import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    const { public_token } = await request.json()

    if (!public_token) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      )
    }

    // Exchange public token for access token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const accessToken = response.data.access_token
    const itemId = response.data.item_id

    // Get item information
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    })

    const institutionId = itemResponse.data.item.institution_id || ''

    // Get institution information
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ['US'] as any,
    })

    const institutionName = institutionResponse.data.institution.name

    // Check if user already has this institution connected
    const existingItem = await prisma.plaidItem.findFirst({
      where: {
        userId: userId,
        institutionId: institutionId,
      },
    })

    let plaidItemId = itemId

    if (existingItem) {
      // Use existing PlaidItem and update its access token
      console.log(`Using existing PlaidItem for ${institutionName}: ${existingItem.id}`)
      plaidItemId = existingItem.plaidItemId
      
      // Update the access token in case it changed
      await prisma.plaidItem.update({
        where: { id: existingItem.id },
        data: {
          accessToken,
          status: 'active',
        },
      })
    } else {
      // Create new PlaidItem
      console.log(`Creating new PlaidItem for ${institutionName}`)
      const newPlaidItem = await prisma.plaidItem.create({
        data: {
          userId: userId,
          plaidItemId: itemId,
          accessToken,
          institutionId,
          institutionName,
        },
      })
      plaidItemId = newPlaidItem.plaidItemId
    }

    // Get accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    console.log('Accounts returned by Plaid:', accountsResponse.data.accounts.map(acc => ({
      id: acc.account_id,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      mask: acc.mask,
      balances: acc.balances,
    })))

    // Try to fetch liabilities data for credit cards, mortgages, and student loans
    let liabilitiesData = null
    try {
      console.log('Fetching liabilities data for liability accounts...')
      const liabilitiesResponse = await plaidClient.liabilitiesGet({
        access_token: accessToken,
      })
      liabilitiesData = liabilitiesResponse.data.liabilities
      console.log('Liabilities data fetched successfully')
      console.log('Available liability accounts:', {
        credit: liabilitiesData.credit?.map((c: any) => ({ account_id: c.account_id, mask: c.mask })),
        mortgage: liabilitiesData.mortgage?.map((m: any) => ({ account_id: m.account_id, mask: m.mask })),
        student: liabilitiesData.student?.map((s: any) => ({ account_id: s.account_id, mask: s.mask }))
      })
    } catch (error) {
      console.log('Liabilities fetch failed (this is expected in sandbox for some institutions):', error instanceof Error ? error.message : 'Unknown error')
      // Continue without liabilities data - this is normal in sandbox mode
    }

    // Store accounts in database
    let newAccountsCount = 0
    let existingAccountsCount = 0
    
    for (const account of accountsResponse.data.accounts) {
      // Get liabilities information for this account
      let dueDate = null
      let minimumPayment = null
      let creditLimit = null
      let lastPaymentAmount = null
      let lastPaymentDate = null
      let aprs = null
      
      // Mortgage-specific fields
      let originalBalance = null
      let escrowBalance = null
      let interestRatePercentage = null
      let interestRateType = null
      let originalTerm = null
      let maturityDate = null
      let originationDate = null
      let originationPrincipalAmount = null
      let principalBalance = null
      let propertyAddress = null
      let ytdInterestPaid = null
      let ytdPrincipalPaid = null
      
      // Student loan-specific fields
      let repaymentPlan = null
      let sequenceNumber = null
      let servicerAddress = null
      
      if (liabilitiesData) {
        if (account.type === 'credit') {
          const creditLiability = liabilitiesData.credit?.find(
            (liability: any) => liability.account_id === account.account_id
          )
          
          if (creditLiability) {
            // Extract credit card liability information
            dueDate = creditLiability.next_payment_due_date 
              ? new Date(creditLiability.next_payment_due_date) 
              : null
            minimumPayment = creditLiability.minimum_payment_amount || null
            creditLimit = creditLiability.credit_limit || null
            lastPaymentAmount = creditLiability.last_payment_amount || null
            lastPaymentDate = creditLiability.last_payment_date 
              ? new Date(creditLiability.last_payment_date)
              : null
            aprs = creditLiability.aprs || null
            
            console.log(`Credit card liabilities for ${account.name}:`, {
              dueDate: dueDate,
              minimumPayment: minimumPayment,
              creditLimit: creditLimit,
              lastPaymentAmount: lastPaymentAmount,
              lastPaymentDate: lastPaymentDate,
              aprs: aprs
            })
          } else {
            console.log(`No liability data found for credit card ${account.name} (${account.account_id})`)
          }
        } else if (account.subtype === 'mortgage') {
          const mortgageLiability = liabilitiesData.mortgage?.find(
            (liability: any) => liability.account_id === account.account_id
          )
          
          if (mortgageLiability) {
            // Extract mortgage liability information
            dueDate = mortgageLiability.next_payment_due_date 
              ? new Date(mortgageLiability.next_payment_due_date) 
              : null
            minimumPayment = mortgageLiability.next_monthly_payment || null
            lastPaymentAmount = mortgageLiability.last_payment_amount || null
            lastPaymentDate = mortgageLiability.last_payment_date 
              ? new Date(mortgageLiability.last_payment_date)
              : null
            originalBalance = mortgageLiability.original_balance || null
            escrowBalance = mortgageLiability.escrow_balance || null
            interestRatePercentage = mortgageLiability.interest_rate_percentage || null
            interestRateType = mortgageLiability.interest_rate_type || null
            originalTerm = mortgageLiability.original_term || null
            maturityDate = mortgageLiability.maturity_date 
              ? new Date(mortgageLiability.maturity_date)
              : null
            originationDate = mortgageLiability.origination_date 
              ? new Date(mortgageLiability.origination_date)
              : null
            originationPrincipalAmount = mortgageLiability.origination_principal_amount || null
            principalBalance = mortgageLiability.principal_balance || null
            propertyAddress = mortgageLiability.property_address || null
            ytdInterestPaid = mortgageLiability.ytd_interest_paid || null
            ytdPrincipalPaid = mortgageLiability.ytd_principal_paid || null
            
            console.log(`Mortgage liabilities for ${account.name}:`, {
              dueDate: dueDate,
              minimumPayment: minimumPayment,
              lastPaymentAmount: lastPaymentAmount,
              lastPaymentDate: lastPaymentDate,
              originalBalance: originalBalance,
              escrowBalance: escrowBalance,
              interestRatePercentage: interestRatePercentage,
              interestRateType: interestRateType,
              originalTerm: originalTerm,
              maturityDate: maturityDate,
              originationDate: originationDate,
              originationPrincipalAmount: originationPrincipalAmount,
              principalBalance: principalBalance,
              propertyAddress: propertyAddress,
              ytdInterestPaid: ytdInterestPaid,
              ytdPrincipalPaid: ytdPrincipalPaid
            })
          }
        } else if (account.subtype === 'student') {
          const studentLiability = liabilitiesData.student?.find(
            (liability: any) => liability.account_id === account.account_id
          )
          
          if (studentLiability) {
            // Extract student loan liability information
            dueDate = studentLiability.next_payment_due_date 
              ? new Date(studentLiability.next_payment_due_date) 
              : null
            minimumPayment = studentLiability.next_monthly_payment || null
            lastPaymentAmount = studentLiability.last_payment_amount || null
            lastPaymentDate = studentLiability.last_payment_date 
              ? new Date(studentLiability.last_payment_date)
              : null
            originalBalance = studentLiability.original_balance || null
            interestRatePercentage = studentLiability.interest_rate_percentage || null
            interestRateType = studentLiability.interest_rate_type || null
            repaymentPlan = studentLiability.repayment_plan || null
            sequenceNumber = studentLiability.sequence_number || null
            servicerAddress = studentLiability.servicer_address || null
            ytdInterestPaid = studentLiability.ytd_interest_paid || null
            ytdPrincipalPaid = studentLiability.ytd_principal_paid || null
            
            console.log(`Student loan liabilities for ${account.name}:`, {
              dueDate: dueDate,
              minimumPayment: minimumPayment,
              lastPaymentAmount: lastPaymentAmount,
              lastPaymentDate: lastPaymentDate,
              originalBalance: originalBalance,
              interestRatePercentage: interestRatePercentage,
              interestRateType: interestRateType,
              repaymentPlan: repaymentPlan,
              sequenceNumber: sequenceNumber,
              servicerAddress: servicerAddress,
              ytdInterestPaid: ytdInterestPaid,
              ytdPrincipalPaid: ytdPrincipalPaid
            })
          }
        }
      }

      // Check if account already exists by institution and mask (more reliable than plaidAccountId)
      const existingAccount = await prisma.account.findFirst({
        where: { 
          userId: userId,
          institutionId: institutionId,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype
        },
      })
      
      console.log(`Processing account ${account.name} (${account.account_id}):`, {
        exists: !!existingAccount,
        existingAccountId: existingAccount?.id,
        userId: userId,
        plaidItemId: plaidItemId
      })
      
      if (existingAccount) {
        // Update existing account
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            plaidAccountId: account.account_id, // Update to latest plaidAccountId
            currentBalance: account.balances.current,
            availableBalance: account.balances.available,
            isActive: true,
            dueDate: dueDate,
            minimumPayment: minimumPayment,
            creditLimit: account.type === 'credit' ? creditLimit : undefined,
            lastPaymentAmount: lastPaymentAmount,
            lastPaymentDate: lastPaymentDate,
            aprs: account.type === 'credit' ? (aprs || undefined) : undefined,
            // Mortgage fields
            originalBalance: account.subtype === 'mortgage' ? originalBalance : undefined,
            escrowBalance: account.subtype === 'mortgage' ? escrowBalance : undefined,
            interestRatePercentage: (account.type === 'credit' || account.subtype === 'mortgage' || account.subtype === 'student') ? interestRatePercentage : undefined,
            interestRateType: (account.type === 'credit' || account.subtype === 'mortgage' || account.subtype === 'student') ? interestRateType : undefined,
            originalTerm: account.subtype === 'mortgage' ? (originalTerm ? parseInt(originalTerm.toString()) : null) : undefined,
            maturityDate: account.subtype === 'mortgage' ? maturityDate : undefined,
            originationDate: account.subtype === 'mortgage' ? originationDate : undefined,
            originationPrincipalAmount: account.subtype === 'mortgage' ? originationPrincipalAmount : undefined,
            principalBalance: account.subtype === 'mortgage' ? principalBalance : undefined,
            propertyAddress: account.subtype === 'mortgage' ? (propertyAddress || undefined) : undefined,
            ytdInterestPaid: (account.subtype === 'mortgage' || account.subtype === 'student') ? ytdInterestPaid : undefined,
            ytdPrincipalPaid: (account.subtype === 'mortgage' || account.subtype === 'student') ? ytdPrincipalPaid : undefined,
            // Student loan fields
            repaymentPlan: account.subtype === 'student' ? (repaymentPlan ? JSON.stringify(repaymentPlan) : null) : undefined,
            sequenceNumber: account.subtype === 'student' ? (sequenceNumber ? parseInt(sequenceNumber.toString()) : null) : undefined,
            servicerAddress: account.subtype === 'student' ? (servicerAddress || undefined) : undefined,
          },
        })
        existingAccountsCount++
        console.log(`Updated existing account: ${account.name} (${account.subtype})`)
      } else {
        // Create new account
        await prisma.account.create({
          data: {
            userId: userId,
            plaidAccountId: account.account_id,
            plaidItemId: plaidItemId,
            institutionId,
            institutionName,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            mask: account.mask,
            currentBalance: account.balances.current,
            availableBalance: account.balances.available,
            currencyCode: account.balances.iso_currency_code || 'USD',
            dueDate: dueDate,
            minimumPayment: minimumPayment,
            creditLimit: account.type === 'credit' ? creditLimit : undefined,
            lastPaymentAmount: lastPaymentAmount,
            lastPaymentDate: lastPaymentDate,
            aprs: account.type === 'credit' ? (aprs || undefined) : undefined,
            // Mortgage fields
            originalBalance: account.subtype === 'mortgage' ? originalBalance : undefined,
            escrowBalance: account.subtype === 'mortgage' ? escrowBalance : undefined,
            interestRatePercentage: (account.type === 'credit' || account.subtype === 'mortgage' || account.subtype === 'student') ? interestRatePercentage : undefined,
            interestRateType: (account.type === 'credit' || account.subtype === 'mortgage' || account.subtype === 'student') ? interestRateType : undefined,
            originalTerm: account.subtype === 'mortgage' ? (originalTerm ? parseInt(originalTerm.toString()) : null) : undefined,
            maturityDate: account.subtype === 'mortgage' ? maturityDate : undefined,
            originationDate: account.subtype === 'mortgage' ? originationDate : undefined,
            originationPrincipalAmount: account.subtype === 'mortgage' ? originationPrincipalAmount : undefined,
            principalBalance: account.subtype === 'mortgage' ? principalBalance : undefined,
            propertyAddress: account.subtype === 'mortgage' ? (propertyAddress || undefined) : undefined,
            ytdInterestPaid: (account.subtype === 'mortgage' || account.subtype === 'student') ? ytdInterestPaid : undefined,
            ytdPrincipalPaid: (account.subtype === 'mortgage' || account.subtype === 'student') ? ytdPrincipalPaid : undefined,
            // Student loan fields
            repaymentPlan: account.subtype === 'student' ? (repaymentPlan ? JSON.stringify(repaymentPlan) : null) : undefined,
            sequenceNumber: account.subtype === 'student' ? (sequenceNumber ? parseInt(sequenceNumber.toString()) : null) : undefined,
            servicerAddress: account.subtype === 'student' ? (servicerAddress || undefined) : undefined,
          },
        })
        newAccountsCount++
        console.log(`Added new account: ${account.name} (${account.subtype})`)
      }
    }
    
           console.log(`Account sync complete: ${newAccountsCount} new, ${existingAccountsCount} updated`)

           // Auto-sync transactions for new accounts
           let transactionSyncResult = null
           if (newAccountsCount > 0) {
             try {
               console.log('Auto-syncing transactions for new accounts...')
               
               // Get transactions from the last 90 days for new accounts
               const endDate = new Date()
               const startDate = new Date()
               startDate.setDate(startDate.getDate() - 90)

               const formatDate = (date: Date) => date.toISOString().split('T')[0]

               const response = await plaidClient.transactionsGet({
                 access_token: accessToken,
                 start_date: formatDate(startDate),
                 end_date: formatDate(endDate),
               })

               const transactions = response.data.transactions
               
               // Debug: Log sample transaction data to see what Plaid provides
               if (transactions.length > 0) {
                 console.log('Sample Plaid transaction data from exchange_token:', JSON.stringify(transactions[0], null, 2))
               }
               
               let syncedTransactions = 0

               for (const transaction of transactions) {
                 const account = await prisma.account.findFirst({
                   where: { plaidAccountId: transaction.account_id },
                 })

                 if (account) {
                   // Determine correct amount based on transaction direction
                   let correctedAmount = transaction.amount

                   const transactionDirection = (transaction as any).direction
                   if (transactionDirection) {
                     if (transactionDirection === 'OUTFLOW') {
                       // For savings accounts, interest payments should be positive even if marked as OUTFLOW
                       const isInterestPayment = (transaction.name && transaction.name.toLowerCase().includes('intrst')) ||
                                                (transaction.merchant_name && transaction.merchant_name.toLowerCase().includes('intrst'))
                       
                       if (account.type === 'depository' && isInterestPayment) {
                         correctedAmount = Math.abs(transaction.amount)
                       } else {
                         correctedAmount = -Math.abs(transaction.amount)
                       }
                     } else if (transactionDirection === 'INFLOW') {
                       correctedAmount = Math.abs(transaction.amount)
                     }
                   } else {
                     if (account.type === 'depository') {
                       const isInterestPayment = (transaction.name && transaction.name.toLowerCase().includes('intrst')) ||
                                                (transaction.merchant_name && transaction.merchant_name.toLowerCase().includes('intrst'))
                       if (isInterestPayment) {
                         correctedAmount = Math.abs(transaction.amount)
                       } else {
                         correctedAmount = -Math.abs(transaction.amount)
                       }
                     }
                   }

                   // Get categories from Plaid or use fallback mapping
                   let categories = transaction.category || []
                   if (categories.length === 0) {
                     const merchantName = transaction.merchant_name || transaction.name
                     
                     // Simple merchant-to-category mapping
                     const name = merchantName.toLowerCase()
                     if (name.includes('mcdonald') || name.includes('kfc') || name.includes('starbucks') || 
                         name.includes('restaurant') || name.includes('cafe') || name.includes('food')) {
                       categories = ['Food and Dining']
                     } else if (name.includes('uber') || name.includes('lyft') || name.includes('taxi') || 
                                name.includes('gas') || name.includes('fuel') || name.includes('airline') ||
                                name.includes('united') || name.includes('delta') || name.includes('southwest')) {
                       categories = ['Transportation']
                     } else if (name.includes('climbing') || name.includes('gym') || name.includes('fitness') ||
                                name.includes('movie') || name.includes('theater') || name.includes('fun')) {
                       categories = ['Entertainment']
                     } else if (name.includes('shop') || name.includes('store') || name.includes('retail') ||
                                name.includes('bicycle') || name.includes('madison')) {
                       categories = ['Shopping']
                     } else if (name.includes('payment') || name.includes('transfer') || name.includes('credit card') ||
                                name.includes('automatic')) {
                       categories = ['Payment']
                     } else if (name.includes('interest') || name.includes('intrst') || name.includes('pymnt')) {
                       categories = ['Interest']
                     } else if (name.includes('tectra') || name.includes('inc') || name.includes('corp')) {
                       categories = ['Business Services']
                     } else {
                       categories = ['Other']
                     }
                   }

                   await prisma.transaction.upsert({
                     where: { plaidTransactionId: transaction.transaction_id },
                     update: {
                       amount: correctedAmount,
                       description: transaction.name,
                       merchantName: transaction.merchant_name,
                       category: categories,
                       subcategory: (transaction as any).subcategory,
                       date: new Date(transaction.date),
                       pending: transaction.pending,
                       // Location data
                       address: transaction.location?.address || null,
                       city: transaction.location?.city || null,
                       region: transaction.location?.region || null,
                       postalCode: transaction.location?.postal_code || null,
                       country: transaction.location?.country || null,
                       storeNumber: (transaction as any).store_number || null,
                     } as any,
                     create: {
                       userId: userId,
                       accountId: account.id,
                       plaidTransactionId: transaction.transaction_id,
                       amount: correctedAmount,
                       description: transaction.name,
                       merchantName: transaction.merchant_name,
                       category: categories,
                       subcategory: (transaction as any).subcategory,
                       date: new Date(transaction.date),
                       pending: transaction.pending,
                       accountOwner: transaction.account_owner,
                       // Location data
                       address: transaction.location?.address || null,
                       city: transaction.location?.city || null,
                       region: transaction.location?.region || null,
                       postalCode: transaction.location?.postal_code || null,
                       country: transaction.location?.country || null,
                       storeNumber: (transaction as any).store_number || null,
                     } as any,
                   })
                   syncedTransactions++
                 }
               }

               transactionSyncResult = {
                 success: true,
                 syncedTransactions,
                 message: `Synced ${syncedTransactions} transactions for new accounts`
               }

               console.log(`Auto-sync complete: ${syncedTransactions} transactions processed`)
             } catch (error) {
               console.error('Error in auto-sync:', error)
               transactionSyncResult = {
                 success: false,
                 error: 'Failed to sync transactions for new accounts'
               }
             }
           }

           return NextResponse.json({ 
             success: true, 
             newAccountsCount,
             existingAccountsCount,
             institutionName,
             message: newAccountsCount > 0 
               ? `Successfully connected ${newAccountsCount} new account(s) from ${institutionName}`
               : `Updated ${existingAccountsCount} existing account(s) from ${institutionName}`,
             transactionSync: transactionSyncResult
           })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
