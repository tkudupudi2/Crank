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

    const { startDate, endDate } = await request.json()

    // Get user's Plaid items
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: (session.user as any).id },
    })

    if (plaidItems.length === 0) {
      return NextResponse.json({ transactions: [] })
    }

    const allTransactions = []

    for (const item of plaidItems) {
      try {
        const response = await plaidClient.transactionsGet({
          access_token: item.accessToken,
          start_date: new Date(startDate),
          end_date: new Date(endDate),
        })

        const transactions = response.data.transactions

        // Store transactions in database
        for (const transaction of transactions) {
          const account = await prisma.account.findFirst({
            where: { plaidAccountId: transaction.account_id },
          })

          if (account) {
            await prisma.transaction.upsert({
              where: { plaidTransactionId: transaction.transaction_id },
              update: {
                amount: transaction.amount,
                description: transaction.name,
                merchantName: transaction.merchant_name,
                category: transaction.category || [],
                subcategory: transaction.subcategory,
                date: new Date(transaction.date),
                pending: transaction.pending,
              },
              create: {
                userId: (session.user as any).id,
                accountId: account.id,
                plaidTransactionId: transaction.transaction_id,
                amount: transaction.amount,
                description: transaction.name,
                merchantName: transaction.merchant_name,
                category: transaction.category || [],
                subcategory: transaction.subcategory,
                date: new Date(transaction.date),
                pending: transaction.pending,
                accountOwner: transaction.account_owner,
              },
            })

            allTransactions.push({
              ...transaction,
              accountName: account.name,
              accountType: account.type,
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching transactions for item ${item.id}:`, error)
      }
    }

    return NextResponse.json({ transactions: allTransactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
