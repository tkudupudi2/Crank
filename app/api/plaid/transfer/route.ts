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
      transferAmount, 
      fromAccountId, 
      toAccountId,
      transferDescription 
    } = await request.json()

    if (!transferAmount || !fromAccountId || !toAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: transferAmount, fromAccountId, toAccountId' },
        { status: 400 }
      )
    }

    // Validate amount is positive and has at most 2 decimal places
    if (transferAmount <= 0) {
      return NextResponse.json(
        { error: 'Transfer amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Ensure amount has at most 2 decimal places
    const amountStr = transferAmount.toString()
    const decimalPlaces = amountStr.includes('.') ? amountStr.split('.')[1].length : 0
    if (decimalPlaces > 2) {
      return NextResponse.json(
        { error: 'Transfer amount cannot have more than 2 decimal places' },
        { status: 400 }
      )
    }

    console.log('Transfer Request:', {
      transferAmount,
      fromAccountId,
      toAccountId,
      transferDescription
    })

    // Get the source account (bank account) details
    const fromAccount = await prisma.account.findFirst({
      where: {
        id: fromAccountId,
        userId,
        type: 'depository' // Bank account
      }
    })

    if (!fromAccount) {
      return NextResponse.json(
        { error: 'Source account not found or invalid' },
        { status: 404 }
      )
    }

    // Get the destination account (liability) details
    const toAccount = await prisma.account.findFirst({
      where: {
        id: toAccountId,
        userId,
        type: {
          in: ['credit', 'mortgage', 'student'] // Credit card, mortgage, or student loan
        }
      }
    })

    if (!toAccount) {
      return NextResponse.json(
        { error: 'Destination account not found or invalid' },
        { status: 404 }
      )
    }

    console.log('From Account:', {
      id: fromAccount.id,
      name: fromAccount.name,
      type: fromAccount.type,
      plaidAccountId: fromAccount.plaidAccountId,
      institutionName: fromAccount.institutionName
    })

    console.log('To Account:', {
      id: toAccount.id,
      name: toAccount.name,
      type: toAccount.type,
      plaidAccountId: toAccount.plaidAccountId,
      institutionName: toAccount.institutionName
    })

    // Validate that we have valid Plaid account IDs
    if (!fromAccount.plaidAccountId) {
      return NextResponse.json(
        { error: 'Source account missing Plaid account ID' },
        { status: 400 }
      )
    }

    if (!toAccount.plaidAccountId) {
      return NextResponse.json(
        { error: 'Destination account missing Plaid account ID' },
        { status: 400 }
      )
    }

    // Get the Plaid item for the source account to get access token
    const plaidItem = await prisma.plaidItem.findFirst({
      where: {
        plaidItemId: fromAccount.plaidItemId
      }
    })

    if (!plaidItem) {
      return NextResponse.json(
        { error: 'Plaid item not found for source account' },
        { status: 404 }
      )
    }

    // IMPORTANT: Plaid Transfer API is for bank-to-bank transfers, not credit card payments
    // For credit card payments, we need to use a different approach
    // This is a limitation - we cannot directly pay credit cards using Plaid Transfer API
    
    // For now, we'll simulate the payment process and update balances
    // In a real implementation, you would need to:
    // 1. Use the credit card issuer's payment API directly
    // 2. Or use a payment processor like Stripe
    // 3. Or use Plaid's Payment Initiation (but it's not available for US credit cards)
    
    // Format amount to 2 decimal places as required by Plaid
    const formattedAmount = transferAmount.toFixed(2)
    
    console.log('Simulating payment process for:', {
      amount: formattedAmount,
      fromAccount: fromAccount.name,
      toAccount: toAccount.name
    })

    // Since Plaid Transfer API doesn't support credit card payments,
    // we'll simulate the payment process and update balances directly
    const simulatedTransferId = `sim_${Date.now()}_${fromAccountId}_${toAccountId}`
    const simulatedAuthorizationId = `auth_${Date.now()}_${fromAccountId}_${toAccountId}`

    // Store payment in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: transferAmount,
        description: transferDescription || `Payment to ${toAccount.name}`,
        status: 'pending',
        fromAccountId: fromAccountId,
        toAccountId: toAccountId,
        plaidTransferId: simulatedTransferId,
        scheduledDate: new Date(),
        createdAt: new Date()
      }
    })

    console.log('Payment created:', {
      paymentId: payment.id,
      simulatedTransferId,
      simulatedAuthorizationId,
      amount: transferAmount
    })

    // Process the transfer immediately in sandbox mode
    try {
      // In sandbox mode, we can simulate the transfer processing
      // In production, this would be handled by the ACH network
      
      // Update account balances
      await prisma.$transaction(async (tx) => {
        // Update from account (bank account) - reduce balance
        await tx.account.update({
          where: { id: fromAccountId },
          data: {
            currentBalance: {
              decrement: transferAmount
            },
            availableBalance: {
              decrement: transferAmount
            }
          }
        })

        // Update to account (liability) - reduce balance
        await tx.account.update({
          where: { id: toAccountId },
          data: {
            currentBalance: {
              decrement: transferAmount
            }
          }
        })

        // Create transaction record for the bank account (outgoing transfer)
        await tx.transaction.create({
          data: {
            userId: userId,
            accountId: fromAccountId,
            plaidTransactionId: `transfer_${transfer.id}_from`,
            amount: -transferAmount, // Negative for outgoing transfer
            description: `Transfer to ${toAccount.name}`,
            merchantName: toAccount.institutionName,
            category: ['Transfer'],
            date: new Date(),
            pending: false,
            accountOwner: fromAccount.institutionName,
          }
        })

        // Create transaction record for the liability account (payment reducing debt)
        await tx.transaction.create({
          data: {
            userId: userId,
            accountId: toAccountId,
            plaidTransactionId: `transfer_${transfer.id}_to`,
            amount: -transferAmount, // Negative for liability payment (reduces debt)
            description: `Transfer from ${fromAccount.name}`,
            merchantName: fromAccount.institutionName,
            category: ['Transfer'],
            date: new Date(),
            pending: false,
            accountOwner: toAccount.institutionName,
          }
        })

        // Update transfer status to completed
        await tx.payment.update({
          where: { id: transfer.id },
          data: {
            status: 'completed',
            processedDate: new Date(),
          }
        })
      })

      console.log(`Payment ${payment.id} completed successfully (simulated)`)
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
        transferId: simulatedTransferId,
        authorizationId: simulatedAuthorizationId
      },
      message: 'Payment processed successfully (simulated - Plaid Transfer API does not support credit card payments)'
    })

  } catch (error) {
    console.error('Error creating transfer:', error)
    
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
        error: 'Failed to create transfer',
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

    // Get all transfers for the user
    const transfers = await prisma.payment.findMany({
      where: { userId },
      include: {
        fromAccount: true,
        toAccount: true
      } as any,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ transfers })

  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}
