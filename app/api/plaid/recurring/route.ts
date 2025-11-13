import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId },
    })

    if (plaidItems.length === 0) {
      return NextResponse.json({ recurring: [] })
    }

    const recurringStreams: any[] = []

    for (const item of plaidItems) {
      try {
        // Preload accounts for this item to resolve account metadata
        const accounts = await prisma.account.findMany({
          where: { plaidItemId: item.id },
        })
        const accountByPlaidId = new Map(accounts.map(a => [a.plaidAccountId, a]))
        const accountIds = accounts.map(a => a.plaidAccountId).filter((id): id is string => id !== null)

        const resp = await plaidClient.transactionsRecurringGet({
          access_token: item.accessToken,
          account_ids: accountIds,
        })

        const data = resp.data
        const outflows = data.outflow_streams || []
        const inflows = data.inflow_streams || []

        for (const stream of outflows) {
          // Map Plaid stream to frontend shape
          const firstAccountId = stream.account_ids?.[0]
          const account = firstAccountId ? accountByPlaidId.get(firstAccountId) : undefined
          recurringStreams.push({
            id: stream.stream_id || `${item.id}_${stream.description}_${stream.last_date}`,
            merchantName: stream.merchant_name || stream.merchant_description || stream.description || 'Unknown',
            description: stream.description || stream.merchant_description || '',
            amount: Math.abs(stream.last_amount?.amount ?? 0),
            frequency: (stream.frequency as any) || 'monthly',
            nextDue: stream.next_date ? new Date(stream.next_date) : (stream.last_date ? new Date(stream.last_date) : new Date()),
            lastPayment: stream.last_date ? new Date(stream.last_date) : new Date(),
            account: account?.name || (item.institutionName || 'Account'),
            institutionName: item.institutionName || null,
            accountType: (account?.type as any) || null,
            category: Array.isArray(stream.personal_finance_category?.detailed) ? [stream.personal_finance_category.detailed] : (stream.category ? (stream.category as any) : []),
            isEstimated: false,
            direction: 'outflow',
            isOutflow: true,
          })
        }

        for (const stream of inflows) {
          const firstAccountId = stream.account_ids?.[0]
          const account = firstAccountId ? accountByPlaidId.get(firstAccountId) : undefined
          recurringStreams.push({
            id: stream.stream_id || `${item.id}_${stream.description}_${stream.last_date}_in`,
            merchantName: stream.merchant_name || stream.merchant_description || stream.description || 'Unknown',
            description: stream.description || stream.merchant_description || '',
            amount: Math.abs(stream.last_amount?.amount ?? 0),
            frequency: (stream.frequency as any) || 'monthly',
            nextDue: stream.next_date ? new Date(stream.next_date) : (stream.last_date ? new Date(stream.last_date) : new Date()),
            lastPayment: stream.last_date ? new Date(stream.last_date) : new Date(),
            account: account?.name || (item.institutionName || 'Account'),
            institutionName: item.institutionName || null,
            accountType: (account?.type as any) || null,
            category: Array.isArray(stream.personal_finance_category?.detailed) ? [stream.personal_finance_category.detailed] : (stream.category ? (stream.category as any) : []),
            isEstimated: false,
            direction: 'inflow',
            isOutflow: false,
          })
        }
      } catch (err) {
        console.error('Error fetching recurring for item', item.id, err)
        // continue other items
      }
    }

    return NextResponse.json({ recurring: recurringStreams })
  } catch (error) {
    console.error('Recurring API error', error)
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 })
  }
}


