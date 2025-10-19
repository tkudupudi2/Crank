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

    // Get all Plaid items for the user
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId }
    })

    if (plaidItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No connected accounts found'
      })
    }

    let updatedAccounts = 0

    // Refresh liabilities for each Plaid item
    for (const item of plaidItems) {
      try {
        console.log(`Refreshing liabilities for item ${item.id} with institution ${item.institutionName}`)

        const response = await plaidClient.liabilitiesGet({
          access_token: item.accessToken
        })

        const liabilities = response.data.liabilities

        // Process credit card liabilities
        if (liabilities.credit && liabilities.credit.length > 0) {
          for (const credit of liabilities.credit) {
            // Skip if account_id is null
            if (!credit.account_id) continue;
            
            // Find the corresponding account in our database
            const account = await prisma.account.findFirst({
              where: { plaidAccountId: credit.account_id }
            })

            if (account) {
              // Extract all liability information
              const dueDate = credit.next_payment_due_date 
                ? new Date(credit.next_payment_due_date) 
                : null
              const minimumPayment = credit.minimum_payment_amount || null
              const creditLimit = credit.credit_limit || null
              const lastPaymentAmount = credit.last_payment_amount || null
              const lastPaymentDate = credit.last_payment_date 
                ? new Date(credit.last_payment_date)
                : null
              const aprs = credit.aprs || null

              // Update the account with liability information
              await prisma.account.update({
                where: { id: account.id },
                data: {
                  dueDate,
                  minimumPayment,
                  creditLimit,
                  lastPaymentAmount,
                  lastPaymentDate,
                  aprs,
                },
              })

              updatedAccounts++
              console.log(`Updated liability data for account: ${account.name}`)
            }
          }
        }

        // Process mortgage liabilities
        if (liabilities.mortgage && liabilities.mortgage.length > 0) {
          for (const mortgage of liabilities.mortgage) {
            // Skip if account_id is null
            if (!mortgage.account_id) continue;
            
            const account = await prisma.account.findFirst({
              where: { plaidAccountId: mortgage.account_id }
            })
            
            if (account) {
              const dueDate = mortgage.next_payment_due_date 
                ? new Date(mortgage.next_payment_due_date) 
                : null
              const minimumPayment = mortgage.next_monthly_payment || null
              const lastPaymentAmount = mortgage.last_payment_amount || null
              const lastPaymentDate = mortgage.last_payment_date 
                ? new Date(mortgage.last_payment_date)
                : null
              const originalBalance = mortgage.original_balance || null
              const escrowBalance = mortgage.escrow_balance || null
              const interestRatePercentage = mortgage.interest_rate_percentage || null
              const interestRateType = mortgage.interest_rate_type || null
              const originalTerm = mortgage.original_term || null
              const maturityDate = mortgage.maturity_date 
                ? new Date(mortgage.maturity_date)
                : null
              const originationDate = mortgage.origination_date 
                ? new Date(mortgage.origination_date)
                : null
              const originationPrincipalAmount = mortgage.origination_principal_amount || null
              const principalBalance = mortgage.principal_balance || null
              const propertyAddress = mortgage.property_address || null
              const ytdInterestPaid = mortgage.ytd_interest_paid || null
              const ytdPrincipalPaid = mortgage.ytd_principal_paid || null

              await prisma.account.update({
                where: { id: account.id },
                data: {
                  dueDate,
                  minimumPayment,
                  lastPaymentAmount,
                  lastPaymentDate,
                  originalBalance,
                  escrowBalance,
                  interestRatePercentage,
                  interestRateType,
                  originalTerm: originalTerm ? parseInt(originalTerm.toString()) : null,
                  maturityDate,
                  originationDate,
                  originationPrincipalAmount,
                  principalBalance,
                  propertyAddress: propertyAddress ? JSON.stringify(propertyAddress) : null,
                  ytdInterestPaid,
                  ytdPrincipalPaid,
                },
              })

              updatedAccounts++
              console.log(`Updated mortgage liability data for account: ${account.name}`)
            }
          }
        }

        // Process student loan liabilities
        if (liabilities.student && liabilities.student.length > 0) {
          for (const student of liabilities.student) {
            // Skip if account_id is null
            if (!student.account_id) continue;
            
            const account = await prisma.account.findFirst({
              where: { plaidAccountId: student.account_id }
            })
            
            if (account) {
              const dueDate = student.next_payment_due_date 
                ? new Date(student.next_payment_due_date) 
                : null
              const minimumPayment = student.next_monthly_payment || null
              const lastPaymentAmount = student.last_payment_amount || null
              const lastPaymentDate = student.last_payment_date 
                ? new Date(student.last_payment_date)
                : null
              const originalBalance = student.original_balance || null
              const interestRatePercentage = student.interest_rate_percentage || null
              const interestRateType = student.interest_rate_type || null
              const repaymentPlan = student.repayment_plan || null
              const sequenceNumber = student.sequence_number || null
              const servicerAddress = student.servicer_address || null
              const ytdInterestPaid = student.ytd_interest_paid || null
              const ytdPrincipalPaid = student.ytd_principal_paid || null

              await prisma.account.update({
                where: { id: account.id },
                data: {
                  dueDate,
                  minimumPayment,
                  lastPaymentAmount,
                  lastPaymentDate,
                  originalBalance,
                  interestRatePercentage,
                  interestRateType,
                  repaymentPlan: repaymentPlan ? JSON.stringify(repaymentPlan) : null,
                  sequenceNumber: sequenceNumber ? parseInt(sequenceNumber.toString()) : null,
                  servicerAddress: servicerAddress ? JSON.stringify(servicerAddress) : null,
                  ytdInterestPaid,
                  ytdPrincipalPaid,
                },
              })

              updatedAccounts++
              console.log(`Updated student loan liability data for account: ${account.name}`)
            }
          }
        }

      } catch (error) {
        console.error(`Error refreshing liabilities for item ${item.id}:`, error)
        // Continue with other items even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated liability data for ${updatedAccounts} accounts`
    })

  } catch (error) {
    console.error('Error refreshing liabilities:', error)
    return NextResponse.json(
      { error: 'Failed to refresh liabilities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
