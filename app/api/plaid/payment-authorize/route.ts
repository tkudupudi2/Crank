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
    const { paymentId, accountId } = await request.json()

    if (!paymentId || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, accountId' },
        { status: 400 }
      )
    }

    // Get the payment details
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId
      },
      include: {
        paymentAccount: {
          include: {
            plaidItem: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Payment is not in pending status' },
        { status: 400 }
      )
    }

    // Authorize the payment
    const authResponse = await plaidClient.paymentInitiationPaymentTokenCreate({
      payment_id: payment.plaidPaymentId!
    })

    const paymentToken = authResponse.data.payment_token

    // Update payment with new token
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        plaidPaymentToken: paymentToken,
        status: 'authorized'
      }
    })

    return NextResponse.json({
      success: true,
      paymentToken: paymentToken,
      message: 'Payment authorized successfully'
    })

  } catch (error) {
    console.error('Error authorizing payment:', error)
    return NextResponse.json(
      { error: 'Failed to authorize payment' },
      { status: 500 }
    )
  }
}
