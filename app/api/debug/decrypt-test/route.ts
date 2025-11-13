import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Fetch one transaction with account
    const transaction = await prisma.transaction.findFirst({
      where: { userId },
      include: { account: true },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'No transactions found' }, { status: 404 })
    }

    // Return both raw and what we see after middleware
    return NextResponse.json({
      encryptionEnabled: process.env.ENCRYPTION_ENABLED === 'true',
      transaction: {
        id: transaction.id,
        // Plaintext fields (should be null if PLAINTEXT_WRITES_DISABLED)
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        merchantName: transaction.merchantName,
        // Encrypted fields (raw from DB)
        amountEnc: transaction.amountEnc?.substring(0, 50) + '...',
        dateEnc: transaction.dateEnc?.substring(0, 50) + '...',
        descriptionEnc: transaction.descriptionEnc?.substring(0, 50) + '...',
        // Derived fields
        amountNum: transaction.amountNum,
        dateUtc: transaction.dateUtc,
        // Account
        account: transaction.account ? {
          id: transaction.account.id,
          name: transaction.account.name,
          nameEnc: transaction.account.nameEnc?.substring(0, 50) + '...',
          currentBalance: transaction.account.currentBalance,
          currentBalanceEnc: transaction.account.currentBalanceEnc?.substring(0, 50) + '...',
          currentBalanceNum: transaction.account.currentBalanceNum,
        } : null,
      },
    })
  } catch (error) {
    console.error('Error in decrypt test:', error)
    return NextResponse.json(
      { error: 'Failed to test decryption', details: String(error) },
      { status: 500 }
    )
  }
}
