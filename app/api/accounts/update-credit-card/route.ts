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

    const { accountId, dueDate, minimumPayment } = await request.json()

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Check if the account belongs to the user and is a credit card
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: (session.user as any).id,
        type: 'credit', // Only allow updating credit card accounts
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Credit card account not found' }, { status: 404 })
    }

    // Validate due date if provided
    let parsedDueDate = null
    if (dueDate) {
      parsedDueDate = new Date(dueDate)
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 })
      }
    }

    // Validate minimum payment if provided
    let parsedMinimumPayment = null
    if (minimumPayment !== null && minimumPayment !== undefined) {
      parsedMinimumPayment = parseFloat(minimumPayment)
      if (isNaN(parsedMinimumPayment) || parsedMinimumPayment < 0) {
        return NextResponse.json({ error: 'Minimum payment must be a positive number' }, { status: 400 })
      }
    }

    // Update the account
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        dueDate: parsedDueDate,
        minimumPayment: parsedMinimumPayment,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Credit card information updated successfully',
      account: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        dueDate: updatedAccount.dueDate,
        minimumPayment: updatedAccount.minimumPayment,
      }
    })

  } catch (error) {
    console.error('Error updating credit card information:', error)
    return NextResponse.json(
      { error: 'Failed to update credit card information' },
      { status: 500 }
    )
  }
}
