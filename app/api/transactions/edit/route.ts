import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    
    const {
      transactionId,
      description,
      amount,
      date,
      categories,
      isManual
    } = body

    // Validate required fields
    if (!transactionId || !categories) {
      return NextResponse.json({ 
        error: 'Transaction ID and categories are required' 
      }, { status: 400 })
    }

    // Validate categories array
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ 
        error: 'Categories must be a non-empty array' 
      }, { status: 400 })
    }

    // Validate manual transaction fields if provided
    if (isManual) {
      if (description && !description.trim()) {
        return NextResponse.json({ 
          error: 'Description cannot be empty' 
        }, { status: 400 })
      }
      if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
        return NextResponse.json({ 
          error: 'Amount must be a positive number' 
        }, { status: 400 })
      }
      if (date && isNaN(Date.parse(date))) {
        return NextResponse.json({ 
          error: 'Invalid date format' 
        }, { status: 400 })
      }
    }

    // Get the transaction to check ownership
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId
      },
      include: { account: true }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: 'Transaction not found or does not belong to user' 
      }, { status: 404 })
    }

    // If all categories are removed, default to "Other"
    const finalCategories = categories.length === 0 ? ['Other'] : categories

    // Prepare update data
    const updateData: any = {
      category: finalCategories,
      updatedAt: new Date(),
    }

    // Only allow editing description, amount, and date for manual transactions
    if (isManual) {
      if (description) updateData.description = description.trim()
      if (amount !== undefined) {
        updateData.amount = -Math.abs(amount) // Always negative for expenses
      }
      if (date) updateData.date = new Date(date)
    }

    // Update the transaction
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // Update the transaction
      const result = await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
      })

      // If it's a manual transaction and amount changed, update the account balance
      if (isManual && amount !== undefined && (transaction.account as any).isVirtual) {
        const oldAmount = transaction.amount
        const newAmount = -Math.abs(amount)
        const difference = newAmount - oldAmount

        // Update the account balance
        const account = await tx.account.findUnique({
          where: { id: transaction.accountId }
        })

        if (account) {
          const newBalance = (account.currentBalance || 0) + difference
          await tx.account.update({
            where: { id: transaction.accountId },
            data: {
              currentBalance: newBalance,
              availableBalance: newBalance
            }
          })
        }
      }

      return result
    })

    return NextResponse.json({
      success: true,
      message: isManual ? 'Transaction updated successfully' : 'Transaction categories updated successfully',
      transaction: {
        id: updatedTransaction.id,
        category: updatedTransaction.category,
        description: updatedTransaction.description,
        amount: updatedTransaction.amount,
        date: updatedTransaction.date
      }
    })

  } catch (error) {
    console.error('Error updating transaction categories:', error)
    return NextResponse.json({ 
      error: 'Failed to update transaction categories' 
    }, { status: 500 })
  }
}
