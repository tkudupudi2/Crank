import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptField } from '@/lib/encryption/fields'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id
    const limitParam = request.nextUrl.searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(5000, parseInt(limitParam))) : 1000

    let txUpdated = 0
    let accUpdated = 0

    // Transactions: overwrite-encrypt amount/date and set derived columns
    const txs = await prisma.transaction.findMany({
      where: { userId },
      select: { id: true, amount: true, date: true },
      orderBy: { id: 'asc' },
      take: limit,
    })
    for (const r of txs) {
      const data: any = {}
      data.amountEnc = encryptField(r.amount, ['Transaction', 'amount'])
      data.dateEnc = encryptField(r.date?.toISOString?.() || r.date, ['Transaction', 'date'])
      data.amountNum = r.amount
      data.dateUtc = r.date as any
      await prisma.transaction.update({ where: { id: r.id }, data })
      txUpdated++
    }

    // Accounts: overwrite-encrypt numeric/date fields and set derived columns
    // Read both plaintext and encrypted fields in case plaintext is null
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        currentBalance: true,
        availableBalance: true,
        creditLimit: true,
        lastPaymentAmount: true,
        lastPaymentDate: true,
        currentBalanceEnc: true,
        availableBalanceEnc: true,
        creditLimitEnc: true,
        lastPaymentAmountEnc: true,
        lastPaymentDateEnc: true,
      },
      orderBy: { id: 'asc' },
      take: limit,
    })
    
    const { decryptField } = await import('@/lib/encryption/fields')
    
    for (const r of accounts) {
      const data: any = {}
      
      // For each field, use plaintext if available, otherwise decrypt from encrypted field
      const getValue = (plain: any, enc: any, fieldName: string): any => {
        if (plain !== null && plain !== undefined) return plain
        if (enc) {
          const decrypted = decryptField(enc, ['Account', fieldName])
          if (decrypted !== null && decrypted !== undefined && decrypted !== '') {
            return decrypted
          }
        }
        return null
      }
      
      const currentBalance = getValue(r.currentBalance, (r as any).currentBalanceEnc, 'currentBalance')
      const availableBalance = getValue(r.availableBalance, (r as any).availableBalanceEnc, 'availableBalance')
      const creditLimit = getValue(r.creditLimit, (r as any).creditLimitEnc, 'creditLimit')
      const lastPaymentAmount = getValue(r.lastPaymentAmount, (r as any).lastPaymentAmountEnc, 'lastPaymentAmount')
      const lastPaymentDateRaw = getValue(r.lastPaymentDate, (r as any).lastPaymentDateEnc, 'lastPaymentDate')
      const lastPaymentDate = lastPaymentDateRaw ? (lastPaymentDateRaw instanceof Date ? lastPaymentDateRaw : new Date(lastPaymentDateRaw)) : null
      
      // Only update if we have values to encrypt/populate
      if (currentBalance !== null || availableBalance !== null || creditLimit !== null || 
          lastPaymentAmount !== null || lastPaymentDate !== null) {
        if (currentBalance !== null) {
          data.currentBalanceEnc = encryptField(currentBalance, ['Account', 'currentBalance'])
          data.currentBalanceNum = currentBalance
        }
        if (availableBalance !== null) {
          data.availableBalanceEnc = encryptField(availableBalance, ['Account', 'availableBalance'])
          data.availableBalanceNum = availableBalance
        }
        if (creditLimit !== null) {
          data.creditLimitEnc = encryptField(creditLimit, ['Account', 'creditLimit'])
          data.creditLimitNum = creditLimit
        }
        if (lastPaymentAmount !== null) {
          data.lastPaymentAmountEnc = encryptField(lastPaymentAmount, ['Account', 'lastPaymentAmount'])
          data.lastPaymentAmountNum = lastPaymentAmount
        }
        if (lastPaymentDate !== null) {
          data.lastPaymentDateEnc = encryptField(lastPaymentDate.toISOString(), ['Account', 'lastPaymentDate'])
          data.lastPaymentDateUtc = lastPaymentDate
        }
        await prisma.account.update({ where: { id: r.id }, data })
        accUpdated++
      }
    }

    return NextResponse.json({ ok: true, txUpdated, accUpdated })
  } catch (e) {
    console.error('backfill-step2 error', e)
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 })
  }
}


