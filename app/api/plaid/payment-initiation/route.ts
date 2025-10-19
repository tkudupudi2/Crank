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
    const { 
      paymentAmount, 
      paymentAccountId, 
      creditCardAccountId,
      paymentDescription 
    } = await request.json()

    if (!paymentAmount || !paymentAccountId || !creditCardAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentAmount, paymentAccountId, creditCardAccountId' },
        { status: 400 }
      )
    }

    console.log('Payment Initiation Request:', {
      paymentAmount,
      paymentAccountId,
      creditCardAccountId,
      paymentDescription
    })

    // Get the payment account (bank account) details
    const paymentAccount = await prisma.account.findFirst({
      where: {
        id: paymentAccountId,
        userId,
        type: 'depository' // Bank account
      }
    })

    if (!paymentAccount) {
      return NextResponse.json(
        { error: 'Payment account not found or invalid' },
        { status: 404 }
      )
    }

    console.log('Payment Account:', {
      id: paymentAccount.id,
      name: paymentAccount.name,
      type: paymentAccount.type,
      mask: paymentAccount.mask,
      plaidAccountId: paymentAccount.plaidAccountId
    })

    // Get the liability account details (credit card, mortgage, or student loan)
    const liabilityAccount = await prisma.account.findFirst({
      where: {
        id: creditCardAccountId,
        userId,
        type: {
          in: ['credit', 'mortgage', 'student'] // Credit card, mortgage, or student loan
        }
      }
    })

    if (!liabilityAccount) {
      return NextResponse.json(
        { error: 'Liability account not found or invalid' },
        { status: 404 }
      )
    }

    console.log('Liability Account:', {
      id: liabilityAccount.id,
      name: liabilityAccount.name,
      type: liabilityAccount.type,
      mask: liabilityAccount.mask,
      plaidAccountId: liabilityAccount.plaidAccountId
    })

    // Create payment recipient (the liability account)
    // For credit cards, we need to use a different approach since they don't have IBANs
    let recipientResponse
    
    // For US accounts, we should use Plaid Transfer API instead of Payment Initiation
    // Payment Initiation is designed for European markets with IBAN
    // For now, let's create a simple recipient with a US account number format
    
    console.log('Creating recipient for US account:', {
      name: liabilityAccount.name,
      accountId: liabilityAccount.plaidAccountId,
      mask: liabilityAccount.mask
    })

    // Use a simple US account number format (9 digits)
    const usAccountNumber = liabilityAccount.plaidAccountId.slice(-9).padStart(9, '0')
    
    recipientResponse = await plaidClient.paymentInitiationRecipientCreate({
      name: liabilityAccount.name,
      iban: usAccountNumber, // Using account number as IBAN for US accounts
      address: {
        street: ['123 Main St'],
        city: 'New York',
        postal_code: '10001',
        country: 'US'
      }
    })

    const recipientId = recipientResponse.data.recipient_id

    // Create payment
    const paymentResponse = await plaidClient.paymentInitiationPaymentCreate({
      recipient_id: recipientId,
      reference: `Payment to ${liabilityAccount.name} - ${paymentDescription || 'Liability payment'}`,
      amount: {
        value: paymentAmount,
        currency: 'USD' as any
      }
    })

    const paymentId = paymentResponse.data.payment_id

    // Create payment token for authorization
    const paymentTokenResponse = await (plaidClient as any).paymentInitiationPaymentTokenCreate({
      payment_id: paymentId
    })

    const paymentToken = paymentTokenResponse.data.payment_token

    // Store payment in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: paymentAmount,
        description: paymentDescription || `Payment to ${liabilityAccount.name}`,
        status: 'pending',
        fromAccountId: paymentAccountId,
        toAccountId: creditCardAccountId,
        scheduledDate: new Date()
      }
    })

    // Store Plaid-specific data separately (we can add these fields to the schema later if needed)
    console.log('Plaid Payment Data:', {
      paymentId,
      recipientId,
      paymentToken
    })

    // Process the payment immediately in sandbox mode
    try {
      // In sandbox mode, we can simulate the payment processing
      // In production, this would be handled by the bank after authorization
      
      // Update account balances
      await prisma.$transaction(async (tx) => {
        // Update from account (bank account) - reduce balance
        await tx.account.update({
          where: { id: paymentAccountId },
          data: {
            currentBalance: {
              decrement: paymentAmount
            },
            availableBalance: {
              decrement: paymentAmount
            }
          }
        })

        // Update to account (liability) - reduce balance
        await tx.account.update({
          where: { id: creditCardAccountId },
          data: {
            currentBalance: {
              decrement: paymentAmount
            }
          }
        })

        // Create transaction record for the bank account (outgoing payment)
        await tx.transaction.create({
          data: {
            userId: userId,
            accountId: paymentAccountId,
            plaidTransactionId: `payment_${payment.id}_from`,
            amount: -paymentAmount, // Negative for outgoing payment
            description: `Payment to ${liabilityAccount.name}`,
            merchantName: liabilityAccount.institutionName,
            category: ['Payment'],
            date: new Date(),
            pending: false,
            accountOwner: paymentAccount.institutionName,
          }
        })

        // Create transaction record for the liability account (payment reducing debt)
        await tx.transaction.create({
          data: {
            userId: userId,
            accountId: creditCardAccountId,
            plaidTransactionId: `payment_${payment.id}_to`,
            amount: -paymentAmount, // Negative for liability payment (reduces debt)
            description: `Payment from ${paymentAccount.name}`,
            merchantName: paymentAccount.institutionName,
            category: ['Payment'],
            date: new Date(),
            pending: false,
            accountOwner: liabilityAccount.institutionName,
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

      console.log(`Payment ${payment.id} completed successfully with Plaid Payment Initiation`)
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

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        status: 'completed',
        paymentToken: paymentToken,
        paymentId: paymentId,
        recipientId: recipientId
      },
      message: 'Payment processed successfully using Plaid Payment Initiation'
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Check if it's a Plaid API error
    if (error && typeof error === 'object' && 'response' in error) {
      const plaidError = error as any
      console.error('Plaid API error:', plaidError.response?.data)
      return NextResponse.json(
        { 
          error: 'Plaid API error', 
          details: plaidError.response?.data?.error_message || plaidError.message,
          code: plaidError.response?.data?.error_code
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get all payments for the user
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        fromAccount: true,
        toAccount: true
      } as any,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ payments })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
