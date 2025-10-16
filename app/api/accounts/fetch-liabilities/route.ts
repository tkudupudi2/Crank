import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { plaidClient } from '@/lib/plaid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get all credit card accounts that don't have liability data
    const creditCards = await prisma.account.findMany({
      where: {
        userId: userId,
        type: 'credit',
        OR: [
          { dueDate: null },
          { minimumPayment: null }
        ]
      }
    })

    if (creditCards.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All credit cards already have liability data',
        updated: 0
      })
    }

    let updatedCount = 0
    const results = []

    for (const creditCard of creditCards) {
      try {
        // Get the Plaid item for this credit card
        const plaidItem = await prisma.plaidItem.findFirst({
          where: { plaidItemId: creditCard.plaidItemId }
        })

        if (!plaidItem) {
          results.push({
            accountName: creditCard.name,
            status: 'error',
            message: 'No Plaid item found'
          })
          continue
        }

        console.log(`Fetching liabilities for ${creditCard.name}...`)

        // Try to get liabilities data with retry logic
        let liabilitiesData = null
        try {
          const liabilitiesResponse = await plaidClient.liabilitiesGet({
            access_token: plaidItem.accessToken,
          })
          liabilitiesData = liabilitiesResponse.data
          console.log(`Liabilities data for ${creditCard.name}:`, JSON.stringify(liabilitiesData, null, 2))
        } catch (error: any) {
          // Handle specific Plaid error for no liability accounts
          if (error?.error_code === 'NO_LIABILITY_ACCOUNTS') {
            console.log(`No liability accounts found for ${creditCard.name} - this is normal for some institutions`)
            results.push({
              accountName: creditCard.name,
              status: 'warning',
              message: 'No liability data available for this institution'
            })
            continue
          }
          
          console.log(`Initial liabilities fetch failed for ${creditCard.name}:`, error?.message || error)
          
          // Retry after delay
          try {
            await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
            const retryResponse = await plaidClient.liabilitiesGet({
              access_token: plaidItem.accessToken,
            })
            liabilitiesData = retryResponse.data
            console.log(`Retry successful for ${creditCard.name}`)
          } catch (retryError: any) {
            if (retryError?.error_code === 'NO_LIABILITY_ACCOUNTS') {
              console.log(`No liability accounts found on retry for ${creditCard.name}`)
              results.push({
                accountName: creditCard.name,
                status: 'warning',
                message: 'No liability data available for this institution'
              })
            } else {
              console.log(`Retry failed for ${creditCard.name}:`, retryError?.message || retryError)
              results.push({
                accountName: creditCard.name,
                status: 'error',
                message: 'Failed to fetch liability data from Plaid'
              })
            }
            continue
          }
        }

        // Process liability data
        if (liabilitiesData && liabilitiesData.credit && liabilitiesData.credit.length > 0) {
          const creditLiability = liabilitiesData.credit.find(
            (liability: any) => liability.account_id === creditCard.plaidAccountId
          )

          if (creditLiability) {
            const dueDate = creditLiability.next_payment_due_date 
              ? new Date(creditLiability.next_payment_due_date) 
              : null
            const minimumPayment = creditLiability.minimum_payment_amount || null

            await prisma.account.update({
              where: { id: creditCard.id },
              data: {
                dueDate: dueDate,
                minimumPayment: minimumPayment,
              },
            })

            updatedCount++
            results.push({
              accountName: creditCard.name,
              status: 'success',
              message: `Updated with due date: ${dueDate ? dueDate.toISOString().split('T')[0] : 'N/A'}, min payment: $${minimumPayment || 'N/A'}`
            })

            console.log(`✅ Updated ${creditCard.name}: Due ${dueDate}, Min Payment $${minimumPayment}`)
          } else {
            results.push({
              accountName: creditCard.name,
              status: 'warning',
              message: 'No liability data found for this account in Plaid response'
            })
          }
        } else {
          results.push({
            accountName: creditCard.name,
            status: 'warning',
            message: 'No credit liability data available from Plaid'
          })
        }
      } catch (error) {
        console.error(`Error processing ${creditCard.name}:`, error)
        results.push({
          accountName: creditCard.name,
          status: 'error',
          message: 'Processing error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} credit cards with liability data`,
      updated: updatedCount,
      results: results
    })

  } catch (error) {
    console.error('Error fetching liabilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch liability data' },
      { status: 500 }
    )
  }
}
