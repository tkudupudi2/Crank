import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = { userId: userId }
    if (status) {
      where.status = status
    }

    // Get payments with pagination
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          fromAccount: {
            select: {
              name: true,
              mask: true,
              institutionName: true,
            }
          },
          toAccount: {
            select: {
              name: true,
              mask: true,
              institutionName: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where })
    ])

    return NextResponse.json({
      payments: payments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        paymentType: payment.paymentType,
        description: payment.description,
        scheduledDate: payment.scheduledDate,
        processedDate: payment.processedDate,
        failureReason: payment.failureReason,
        fromAccount: payment.fromAccount,
        toAccount: payment.toAccount,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}