import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    const { 
      fromAccountId, 
      toAccountId, 
      amount, 
      description,
      paymentType = 'manual',
      scheduledDate 
    } = await request.json()

    // Validate required fields
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid amount' },
        { status: 400 }
      )
    }

    // Verify both accounts belong to the user
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({
        where: { id: fromAccountId, userId: userId },
      }),
      prisma.account.findFirst({
        where: { id: toAccountId, userId: userId },
      })
    ])

    if (!fromAccount || !toAccount) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      )
    }

    // Validate account types
    if (fromAccount.type !== 'depository') {
      return NextResponse.json(
        { error: 'From account must be a bank account (checking/savings)' },
        { status: 400 }
      )
    }

    if (toAccount.type !== 'credit') {
      return NextResponse.json(
        { error: 'To account must be a credit card' },
        { status: 400 }
      )
    }

    // Check if from account has sufficient balance
    const availableBalance = fromAccount.availableBalance || fromAccount.currentBalance || 0
    if (availableBalance < amount) {
      return NextResponse.json(
        { 
          error: 'Insufficient funds', 
          details: {
            available: availableBalance,
            requested: amount,
            shortfall: amount - availableBalance
          }
        },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: userId,
        fromAccountId: fromAccountId,
        toAccountId: toAccountId,
        amount: amount,
        description: description || `Payment to ${toAccount.name}`,
        paymentType: paymentType,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: scheduledDate && new Date(scheduledDate) > new Date() ? 'pending' : 'processing',
      },
      include: {
        fromAccount: true,
        toAccount: true,
      }
    })

    // Simulate payment processing with actual balance updates
    setTimeout(async () => {
      try {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Update account balances
        await prisma.$transaction(async (tx) => {
          // Update from account (bank account) - reduce balance
          await tx.account.update({
            where: { id: fromAccountId },
            data: {
              currentBalance: {
                decrement: amount
              },
              availableBalance: {
                decrement: amount
              }
            }
          })

          // Update to account (credit card) - reduce balance
          // In this system, credit card balances are stored as positive numbers representing debt
          // So we decrement the balance to reduce the debt
          await tx.account.update({
            where: { id: toAccountId },
            data: {
              currentBalance: {
                decrement: amount
              }
            }
          })

          // Create transaction record for the bank account (outgoing payment)
          await tx.transaction.create({
            data: {
              userId: userId,
              accountId: fromAccountId,
              plaidTransactionId: `payment_${payment.id}_from`,
              amount: -amount, // Negative for outgoing payment
              description: `Payment to ${toAccount.name}`,
              merchantName: toAccount.institutionName,
              category: ['Payment'],
              date: new Date(),
              pending: false,
              accountOwner: fromAccount.institutionName,
            }
          })

          // Create transaction record for the credit card (payment reducing debt)
          await tx.transaction.create({
            data: {
              userId: userId,
              accountId: toAccountId,
              plaidTransactionId: `payment_${payment.id}_to`,
              amount: -amount, // Negative for credit card payment (reduces debt)
              description: `Payment from ${fromAccount.name}`,
              merchantName: fromAccount.institutionName,
              category: ['Payment'],
              date: new Date(),
              pending: false,
              accountOwner: toAccount.institutionName,
            }
          })

          // Update payment status to completed
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'completed',
              processedDate: new Date(),
            }
          })
        })

        console.log(`Payment ${payment.id} completed successfully with balance updates`)
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error)
        
        // Update payment status to failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            failureReason: 'Processing error',
          }
        })
      }
    }, 2000)

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        fromAccount: {
          name: fromAccount.name,
          mask: fromAccount.mask,
        },
        toAccount: {
          name: toAccount.name,
          mask: toAccount.mask,
        },
        description: payment.description,
        scheduledDate: payment.scheduledDate,
        createdAt: payment.createdAt,
      },
      message: payment.status === 'processing' 
        ? 'Payment is being processed and will update balances shortly'
        : 'Payment scheduled successfully'
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
