import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    
    // Check if we're in sandbox mode
    const isSandbox = process.env.PLAID_ENV === 'sandbox'
    if (isSandbox) {
      console.log('Running in sandbox mode')
    }

    // Get all Plaid items for the user
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId }
    })

    // Get all accounts for the user
    const accounts = await prisma.account.findMany({
      where: { userId }
    })

    if (plaidItems.length === 0) {
      return NextResponse.json({ 
        liabilities: [],
        message: 'No connected accounts found. Please connect your accounts first.'
      })
    }

    // Continue with liabilities fetching in both sandbox and production

    const allLiabilities = []

    // Fetch liabilities for each Plaid item
    for (const item of plaidItems) {
      try {
        console.log(`Fetching liabilities for item ${item.id} with institution ${item.institutionName}`)
        
        const response = await plaidClient.liabilitiesGet({
          access_token: item.accessToken
        })
        
        console.log(`Liabilities response for item ${item.id}:`, response.data)

        const liabilities = response.data.liabilities

        // Process credit card liabilities
        if (liabilities.credit && liabilities.credit.length > 0) {
          for (const credit of liabilities.credit) {
            // Find the corresponding account in our database
            const account = accounts.find(acc => acc.plaidAccountId === credit.account_id)
            
            if (account) {
              allLiabilities.push({
                accountId: account.id,
                plaidAccountId: credit.account_id,
                accountName: account.name,
                institutionName: item.institutionName,
                type: 'credit',
                currentBalance: credit.current_balance,
                availableBalance: credit.available_balance,
                limit: credit.limit,
                utilization: credit.utilization,
                apr: credit.apr,
                isOverdue: credit.is_overdue,
                lastPaymentAmount: credit.last_payment_amount,
                lastPaymentDate: credit.last_payment_date,
                minimumPaymentAmount: credit.minimum_payment_amount,
                nextPaymentDueDate: credit.next_payment_due_date,
                lastStatementBalance: credit.last_statement_balance,
                lastStatementDate: credit.last_statement_date,
                nextMonthlyPayment: credit.next_monthly_payment,
                interestRatePercentage: credit.interest_rate_percentage,
                interestRateType: credit.interest_rate_type,
              })
            }
          }
        }

        // Process mortgage liabilities
        if (liabilities.mortgage && liabilities.mortgage.length > 0) {
          for (const mortgage of liabilities.mortgage) {
            const account = accounts.find(acc => acc.plaidAccountId === mortgage.account_id)
            
            if (account) {
              allLiabilities.push({
                accountId: account.id,
                plaidAccountId: mortgage.account_id,
                accountName: account.name,
                institutionName: item.institutionName,
                type: 'mortgage',
                currentBalance: mortgage.current_balance,
                originalBalance: mortgage.original_balance,
                lastPaymentAmount: mortgage.last_payment_amount,
                lastPaymentDate: mortgage.last_payment_date,
                nextPaymentDueDate: mortgage.next_payment_due_date,
                nextMonthlyPayment: mortgage.next_monthly_payment,
                escrowBalance: mortgage.escrow_balance,
                interestRatePercentage: mortgage.interest_rate_percentage,
                interestRateType: mortgage.interest_rate_type,
                originalTerm: mortgage.original_term,
                maturityDate: mortgage.maturity_date,
                originationDate: mortgage.origination_date,
                originationPrincipalAmount: mortgage.origination_principal_amount,
                principalBalance: mortgage.principal_balance,
                propertyAddress: mortgage.property_address,
                ytdInterestPaid: mortgage.ytd_interest_paid,
                ytdPrincipalPaid: mortgage.ytd_principal_paid,
              })
            }
          }
        }

        // Process student loan liabilities
        if (liabilities.student && liabilities.student.length > 0) {
          for (const student of liabilities.student) {
            const account = accounts.find(acc => acc.plaidAccountId === student.account_id)
            
            if (account) {
              allLiabilities.push({
                accountId: account.id,
                plaidAccountId: student.account_id,
                accountName: account.name,
                institutionName: item.institutionName,
                type: 'student',
                currentBalance: student.current_balance,
                originalBalance: student.original_balance,
                lastPaymentAmount: student.last_payment_amount,
                lastPaymentDate: student.last_payment_date,
                nextPaymentDueDate: student.next_payment_due_date,
                nextMonthlyPayment: student.next_monthly_payment,
                interestRatePercentage: student.interest_rate_percentage,
                interestRateType: student.interest_rate_type,
                repaymentPlan: student.repayment_plan,
                sequenceNumber: student.sequence_number,
                servicerAddress: student.servicer_address,
                ytdInterestPaid: student.ytd_interest_paid,
                ytdPrincipalPaid: student.ytd_principal_paid,
              })
            }
          }
        }

      } catch (error) {
        console.error(`Error fetching liabilities for item ${item.id}:`, error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: (error as any)?.response?.status,
          data: (error as any)?.response?.data
        })
        
        // Check if it's a consent error
        const errorData = (error as any)?.response?.data
        if (errorData?.error_code === 'ADDITIONAL_CONSENT_REQUIRED') {
          console.log(`User needs to provide additional consent for liabilities on item ${item.id}`)
        }
        // Continue with other items even if one fails
      }
    }

    return NextResponse.json({ liabilities: allLiabilities })

  } catch (error) {
    console.error('Error fetching liabilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch liabilities' },
      { status: 500 }
    )
  }
}
