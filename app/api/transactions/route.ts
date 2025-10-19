import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get transactions from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        date: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        account: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Transform transactions to match the expected format
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category || [],
      date: transaction.date,
      merchantName: transaction.merchantName,
      account: transaction.account ? {
        id: transaction.account.id,
        name: transaction.account.name,
        type: transaction.account.type,
        subtype: transaction.account.subtype,
        institutionName: transaction.account.institutionName
      } : null
    }))

    return NextResponse.json(formattedTransactions)

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
