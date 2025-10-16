import { NextRequest, NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhook_type, webhook_code, item_id } = body

    console.log('Plaid webhook received:', webhook_type, webhook_code)

    switch (webhook_type) {
      case 'TRANSACTIONS':
        if (webhook_code === 'INITIAL_UPDATE' || webhook_code === 'HISTORICAL_UPDATE' || webhook_code === 'DEFAULT_UPDATE') {
          // Fetch new transactions for the item
          await fetchTransactionsForItem(item_id)
        }
        break

      case 'ACCOUNTS':
        if (webhook_code === 'BALANCE') {
          // Update account balances
          await updateAccountBalances(item_id)
        }
        break

      case 'ITEM':
        if (webhook_code === 'ERROR') {
          // Handle item error
          await handleItemError(item_id, body.error)
        }
        break
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function fetchTransactionsForItem(itemId: string) {
  try {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { plaidItemId: itemId },
      include: { user: true },
    })

    if (!plaidItem) {
      console.error('Plaid item not found:', itemId)
      return
    }

    // Get transactions from the last 30 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const response = await plaidClient.transactionsGet({
      access_token: plaidItem.accessToken,
      start_date: startDate,
      end_date: new Date(),
    })

    // Update transactions in database
    for (const transaction of response.data.transactions) {
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
            userId: plaidItem.userId,
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
      }
    }

    console.log(`Updated transactions for item ${itemId}`)
  } catch (error) {
    console.error('Error fetching transactions:', error)
  }
}

async function updateAccountBalances(itemId: string) {
  try {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { plaidItemId: itemId },
    })

    if (!plaidItem) {
      console.error('Plaid item not found:', itemId)
      return
    }

    const response = await plaidClient.accountsGet({
      access_token: plaidItem.accessToken,
    })

    // Update account balances
    for (const account of response.data.accounts) {
      await prisma.account.updateMany({
        where: { plaidAccountId: account.account_id },
        data: {
          currentBalance: account.balances.current,
          availableBalance: account.balances.available,
        },
      })
    }

    console.log(`Updated balances for item ${itemId}`)
  } catch (error) {
    console.error('Error updating balances:', error)
  }
}

async function handleItemError(itemId: string, error: any) {
  try {
    await prisma.plaidItem.updateMany({
      where: { plaidItemId: itemId },
      data: { status: 'error' },
    })

    console.log(`Item ${itemId} marked as error:`, error)
  } catch (error) {
    console.error('Error handling item error:', error)
  }
}
