import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  try {
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Delete all user-related data in the correct order to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete user preferences
      await tx.userPreferences.deleteMany({
        where: { userId }
      })

      // Delete sync status
      await tx.syncStatus.deleteMany({
        where: { userId }
      })

      // Delete payment schedules
      await tx.paymentSchedule.deleteMany({
        where: { userId }
      })

      // Delete payments
      await tx.payment.deleteMany({
        where: { userId }
      })

      // Delete transactions
      await tx.transaction.deleteMany({
        where: { userId }
      })

      // Delete plaid items
      await tx.plaidItem.deleteMany({
        where: { userId }
      })

      // Delete accounts
      await tx.account.deleteMany({
        where: { userId }
      })

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Account successfully deleted'
    })

  } catch (error) {
    console.error('Error deleting account:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: session?.user ? (session.user as any).id : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to delete account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
