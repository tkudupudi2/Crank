import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ 
        error: 'Transaction ID is required' 
      }, { status: 400 })
    }

    // Get the transaction to check ownership and type
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId
      },
      include: {
        account: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: 'Transaction not found or does not belong to user' 
      }, { status: 404 })
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: transactionId }
    })

    // If it's a manual transaction on a virtual account, update the account balance
    if (transaction.isManual && transaction.account.isVirtual) {
      const account = transaction.account
      const newBalance = (account.currentBalance || 0) + Math.abs(transaction.amount)
      
      await prisma.account.update({
        where: { id: account.id },
        data: {
          currentBalance: newBalance,
          availableBalance: newBalance
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ 
      error: 'Failed to delete transaction' 
    }, { status: 500 })
  }
}
