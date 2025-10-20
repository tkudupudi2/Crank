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

    // Get user's Plaid items
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: userId },
    })

    if (plaidItems.length === 0) {
      return NextResponse.json({ error: 'No Plaid items found' }, { status: 404 })
    }

    const results = []

    for (const item of plaidItems) {
      try {
        // Get recent transactions (last 30 days)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)

        const formatDate = (date: Date) => date.toISOString().split('T')[0]

        const response = await plaidClient.transactionsGet({
          access_token: item.accessToken,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        })

        const transactions = response.data.transactions

        // Log sample transaction data
        console.log(`=== Plaid Data for ${item.institutionName} ===`)
        if (transactions.length > 0) {
          console.log('Sample transaction:', JSON.stringify(transactions[0], null, 2))
          
          // Check specifically for location data
          const sampleTransaction = transactions[0]
          console.log('Location data check:')
          console.log('- transaction.location:', sampleTransaction.location)
          console.log('- transaction.store_number:', (sampleTransaction as any).store_number)
          console.log('- transaction.merchant_name:', sampleTransaction.merchant_name)
          console.log('- transaction.name:', sampleTransaction.name)
        } else {
          console.log('No transactions found')
        }

        results.push({
          institution: item.institutionName,
          transactionCount: transactions.length,
          sampleTransaction: transactions.length > 0 ? {
            id: transactions[0].transaction_id,
            name: transactions[0].name,
            merchant_name: transactions[0].merchant_name,
            location: transactions[0].location,
            store_number: (transactions[0] as any).store_number,
            amount: transactions[0].amount,
            date: transactions[0].date
          } : null
        })

      } catch (error) {
        console.error(`Error fetching data for ${item.institutionName}:`, error)
        results.push({
          institution: item.institutionName,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({ 
      message: 'Plaid data test completed. Check console logs for detailed output.',
      results 
    })

  } catch (error) {
    console.error('Error in test-plaid-data:', error)
    return NextResponse.json(
      { error: 'Failed to test Plaid data' },
      { status: 500 }
    )
  }
}
