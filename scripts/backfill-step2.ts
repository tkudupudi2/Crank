import { prisma } from '@/lib/prisma'
import { encryptField } from '@/lib/encryption/fields'

const BATCH = 500

async function backfillTransactions() {
  let lastId: string | null = null
  let updated = 0
  for (;;) {
    const rows = await prisma.transaction.findMany({
      where: lastId ? { id: { gt: lastId } } : {},
      orderBy: { id: 'asc' },
      take: BATCH,
      select: { id: true, amount: true, date: true },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      const data: any = {}
      data.amountEnc = encryptField(r.amount, ['Transaction', 'amount'])
      data.dateEnc = encryptField(r.date?.toISOString?.() || r.date, ['Transaction', 'date'])
      data.amountNum = r.amount
      data.dateUtc = r.date as any
      await prisma.transaction.update({ where: { id: r.id }, data })
      updated++
    }
    lastId = rows[rows.length - 1].id
    console.log('tx step2 backfill', { updated, lastId })
  }
}

async function backfillAccounts() {
  let lastId: string | null = null
  let updated = 0
  for (;;) {
    const rows = await prisma.account.findMany({
      where: lastId ? { id: { gt: lastId } } : {},
      orderBy: { id: 'asc' },
      take: BATCH,
      select: {
        id: true,
        currentBalance: true,
        availableBalance: true,
        creditLimit: true,
        lastPaymentAmount: true,
        lastPaymentDate: true,
      },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      const data: any = {}
      data.currentBalanceEnc = encryptField(r.currentBalance, ['Account', 'currentBalance'])
      data.availableBalanceEnc = encryptField(r.availableBalance, ['Account', 'availableBalance'])
      data.creditLimitEnc = encryptField(r.creditLimit, ['Account', 'creditLimit'])
      data.lastPaymentAmountEnc = encryptField(r.lastPaymentAmount, ['Account', 'lastPaymentAmount'])
      data.lastPaymentDateEnc = encryptField(r.lastPaymentDate?.toISOString?.() || r.lastPaymentDate, ['Account', 'lastPaymentDate'])
      data.currentBalanceNum = r.currentBalance as any
      data.availableBalanceNum = r.availableBalance as any
      data.creditLimitNum = r.creditLimit as any
      data.lastPaymentAmountNum = r.lastPaymentAmount as any
      data.lastPaymentDateUtc = r.lastPaymentDate as any
      await prisma.account.update({ where: { id: r.id }, data })
      updated++
    }
    lastId = rows[rows.length - 1].id
    console.log('acct step2 backfill', { updated, lastId })
  }
}

async function main() {
  console.log('Starting step 2 backfill (amounts/dates)')
  await backfillTransactions()
  await backfillAccounts()
  console.log('Step 2 backfill complete')
}

main().catch(e => { console.error(e); process.exit(1) })


