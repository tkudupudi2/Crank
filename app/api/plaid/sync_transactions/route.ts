import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Plaid items
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: (session.user as any).id },
    })

    if (plaidItems.length === 0) {
      return NextResponse.json({ error: 'No connected accounts found' }, { status: 404 })
    }

    let totalTransactions = 0
    const errors = []

    // Sync transactions for each Plaid item
    for (const item of plaidItems) {
      try {
        // Get transactions from the last 30 days
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)

        // Format dates as YYYY-MM-DD strings
        const formatDate = (date: Date) => date.toISOString().split('T')[0]

        const response = await plaidClient.transactionsGet({
          access_token: item.accessToken,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        })

        const transactions = response.data.transactions

        // Store transactions in database
        for (const transaction of transactions) {
          const account = await prisma.account.findFirst({
            where: { plaidAccountId: transaction.account_id },
          })

          if (account) {
            // Determine correct amount based on transaction direction
            let correctedAmount = transaction.amount
            
            // Use amount as-is (Plaid provides correct signs)
            correctedAmount = transaction.amount

            console.log(`Transaction: ${transaction.name}, Original: ${transaction.amount}, Corrected: ${correctedAmount}`)

            await prisma.transaction.upsert({
              where: { plaidTransactionId: transaction.transaction_id },
              update: {
                amount: correctedAmount,
                description: transaction.name,
                merchantName: transaction.merchant_name,
                category: transaction.category || [],
                subcategory: null,
                date: new Date(transaction.date),
                pending: transaction.pending,
              },
              create: {
                userId: (session.user as any).id,
                accountId: account.id,
                plaidTransactionId: transaction.transaction_id,
                amount: correctedAmount,
                description: transaction.name,
                merchantName: transaction.merchant_name,
                category: transaction.category || [],
                subcategory: null,
                date: new Date(transaction.date),
                pending: transaction.pending,
                accountOwner: transaction.account_owner,
              },
            })
            totalTransactions++
          }
        }

        console.log(`Synced ${transactions.length} transactions for item ${item.id}`)
      } catch (error) {
        console.error(`Error syncing transactions for item ${item.id}:`, error)
        errors.push(`Failed to sync transactions for ${item.institutionName}`)
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalTransactions,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}
