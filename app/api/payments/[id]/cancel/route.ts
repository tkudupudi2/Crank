import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const paymentId = params.id

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        userId: userId,
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if payment can be cancelled
    if (payment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed payment' },
        { status: 400 }
      )
    }

    if (payment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Payment is already cancelled' },
        { status: 400 }
      )
    }

    // Update payment status to cancelled
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status: 'cancelled',
      },
      include: {
        fromAccount: {
          select: {
            name: true,
            mask: true,
          }
        },
        toAccount: {
          select: {
            name: true,
            mask: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        amount: updatedPayment.amount,
        status: updatedPayment.status,
        fromAccount: updatedPayment.fromAccount,
        toAccount: updatedPayment.toAccount,
        description: updatedPayment.description,
      },
      message: 'Payment cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling payment:', error)
    return NextResponse.json(
      { error: 'Failed to cancel payment' },
      { status: 500 }
    )
  }
}
