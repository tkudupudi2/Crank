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
      await prisma.plaidItem.create({
        data: {
          userId: userId,
          plaidItemId: itemId,
          accessToken,
          institutionId,
          institutionName,
        },
      })
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

    // Skip liabilities fetch since we're not requesting the liabilities product in link token
    // This prevents errors when connecting accounts from institutions that don't support liabilities
    let liabilitiesData = null
    console.log('Skipping liabilities fetch - not requested in link token to avoid institution compatibility issues')

    // Store accounts in database
    let newAccountsCount = 0
    let existingAccountsCount = 0
    
    for (const account of accountsResponse.data.accounts) {
      // Get liabilities information for this credit card account
      let dueDate = null
      let minimumPayment = null
      
      if (account.type === 'credit' && liabilitiesData) {
        const creditLiability = liabilitiesData.credit?.find(
          (liability: any) => liability.account_id === account.account_id
        )
        
        if (creditLiability) {
          // Extract due date and minimum payment from liabilities
          dueDate = creditLiability.next_payment_due_date 
            ? new Date(creditLiability.next_payment_due_date) 
            : null
          minimumPayment = creditLiability.minimum_payment_amount || null
          
          console.log(`Credit card liabilities for ${account.name}:`, {
            dueDate: dueDate,
            minimumPayment: minimumPayment,
            apr: creditLiability.aprs,
            lastPaymentAmount: creditLiability.last_payment_amount,
            lastPaymentDate: creditLiability.last_payment_date
          })
        }
      }

      // Check if this specific account already exists
      const existingAccount = await prisma.account.findUnique({
        where: { plaidAccountId: account.account_id },
      })
      
      if (existingAccount) {
        // Update existing account
        await prisma.account.update({
          where: { plaidAccountId: account.account_id },
          data: {
            currentBalance: account.balances.current,
            availableBalance: account.balances.available,
            isActive: true,
            dueDate: account.type === 'credit' ? dueDate : undefined,
            minimumPayment: account.type === 'credit' ? minimumPayment : undefined,
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
            plaidItemId: existingItem ? existingItem.plaidItemId : itemId,
            institutionId,
            institutionName,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            mask: account.mask,
            currentBalance: account.balances.current,
            availableBalance: account.balances.available,
            currencyCode: account.balances.iso_currency_code || 'USD',
            dueDate: account.type === 'credit' ? dueDate : undefined,
            minimumPayment: account.type === 'credit' ? minimumPayment : undefined,
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
                     },
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
                     },
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
