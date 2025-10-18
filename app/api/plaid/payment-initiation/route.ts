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

    // Get the payment account (bank account) details
    const paymentAccount = await prisma.account.findFirst({
      where: {
        id: paymentAccountId,
        userId,
        type: 'depository' // Bank account
      },
      include: {
        plaidItem: true
      }
    })

    if (!paymentAccount) {
      return NextResponse.json(
        { error: 'Payment account not found or invalid' },
        { status: 404 }
      )
    }

    // Get the credit card account details
    const creditCardAccount = await prisma.account.findFirst({
      where: {
        id: creditCardAccountId,
        userId,
        type: 'credit' // Credit card
      }
    })

    if (!creditCardAccount) {
      return NextResponse.json(
        { error: 'Credit card account not found or invalid' },
        { status: 404 }
      )
    }

    // Create payment recipient (the credit card)
    const recipientResponse = await plaidClient.paymentInitiationRecipientCreate({
      name: creditCardAccount.name,
      iban: creditCardAccount.mask || creditCardAccount.plaidAccountId,
      address: {
        street: ['123 Main St'], // This would come from user input in a real app
        city: 'New York',
        postal_code: '10001',
        country: 'US'
      }
    })

    const recipientId = recipientResponse.data.recipient_id

    // Create payment
    const paymentResponse = await plaidClient.paymentInitiationPaymentCreate({
      recipient_id: recipientId,
      reference: `Payment to ${creditCardAccount.name} - ${paymentDescription || 'Credit card payment'}`,
      amount: {
        value: paymentAmount,
        currency: 'USD'
      }
    })

    const paymentId = paymentResponse.data.payment_id

    // Create payment token for authorization
    const paymentTokenResponse = await plaidClient.paymentInitiationPaymentTokenCreate({
      payment_id: paymentId
    })

    const paymentToken = paymentTokenResponse.data.payment_token

    // Store payment in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: paymentAmount,
        description: paymentDescription || `Payment to ${creditCardAccount.name}`,
        status: 'pending',
        paymentAccountId: paymentAccountId,
        creditCardAccountId: creditCardAccountId,
        plaidPaymentId: paymentId,
        plaidRecipientId: recipientId,
        plaidPaymentToken: paymentToken,
        scheduledDate: new Date(),
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        status: payment.status,
        paymentToken: paymentToken,
        paymentId: paymentId,
        recipientId: recipientId
      }
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
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
        paymentAccount: true,
        creditCardAccount: true
      },
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
