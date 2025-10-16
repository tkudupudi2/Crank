import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get user's accounts
    const accounts = await prisma.account.findMany({
      where: { 
        userId: userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        subtype: true,
        mask: true,
        institutionName: true,
        currentBalance: true,
        availableBalance: true,
        dueDate: true,
        minimumPayment: true,
      }
    })

    // Separate bank accounts and credit cards
    const bankAccounts = accounts.filter(account => account.type === 'depository')
    const creditCards = accounts.filter(account => account.type === 'credit')

    // Format bank accounts with available balance info
    const eligibleBankAccounts = bankAccounts.map(account => ({
      id: account.id,
      name: account.name,
      subtype: account.subtype,
      mask: account.mask,
      institutionName: account.institutionName,
      availableBalance: account.availableBalance || account.currentBalance || 0,
      currentBalance: account.currentBalance || 0,
      canPay: (account.availableBalance || account.currentBalance || 0) > 0,
    }))

    // Format credit cards with payment info
    const eligibleCreditCards = creditCards.map(account => ({
      id: account.id,
      name: account.name,
      subtype: account.subtype,
      mask: account.mask,
      institutionName: account.institutionName,
      currentBalance: Math.abs(account.currentBalance || 0), // Show as positive
      dueDate: account.dueDate,
      minimumPayment: account.minimumPayment,
      daysUntilDue: account.dueDate 
        ? Math.ceil((new Date(account.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }))

    return NextResponse.json({
      bankAccounts: eligibleBankAccounts,
      creditCards: eligibleCreditCards,
    })

  } catch (error) {
    console.error('Error fetching eligible accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch eligible accounts' },
      { status: 500 }
    )
  }
}
