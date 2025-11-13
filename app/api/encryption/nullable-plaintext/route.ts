import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Makes plaintext columns nullable to allow enc-only writes at ingest
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const txAlters = [
      // Transactions - textual/PII
      'ALTER TABLE transactions ALTER COLUMN description DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN merchantName DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN accountOwner DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN address DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN city DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN region DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN postalCode DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN country DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN storeNumber DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN subcategory DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN category DROP NOT NULL',
      // Transactions - numeric/date
      'ALTER TABLE transactions ALTER COLUMN amount DROP NOT NULL',
      'ALTER TABLE transactions ALTER COLUMN date DROP NOT NULL',
    ]

    const acctAlters = [
      'ALTER TABLE accounts ALTER COLUMN name DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN mask DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN subtype DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN servicerAddress DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN propertyAddress DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN repaymentPlan DROP NOT NULL',
      // numeric/date
      'ALTER TABLE accounts ALTER COLUMN currentBalance DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN availableBalance DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN creditLimit DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN lastPaymentAmount DROP NOT NULL',
      'ALTER TABLE accounts ALTER COLUMN lastPaymentDate DROP NOT NULL',
    ]

    for (const sql of [...txAlters, ...acctAlters]) {
      try {
        await prisma.$executeRawUnsafe(sql)
      } catch (e) {
        // ignore if already nullable or column missing
      }
    }

    return NextResponse.json({ ok: true, changed: txAlters.length + acctAlters.length })
  } catch (e) {
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}


