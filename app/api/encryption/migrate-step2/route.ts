import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apply step-2 columns via SQL (idempotent)
    const sqlAccounts = `
      ALTER TABLE public.accounts
        ADD COLUMN IF NOT EXISTS "currentBalanceEnc" text,
        ADD COLUMN IF NOT EXISTS "availableBalanceEnc" text,
        ADD COLUMN IF NOT EXISTS "creditLimitEnc" text,
        ADD COLUMN IF NOT EXISTS "lastPaymentAmountEnc" text,
        ADD COLUMN IF NOT EXISTS "lastPaymentDateEnc" text,
        ADD COLUMN IF NOT EXISTS "currentBalanceNum" double precision,
        ADD COLUMN IF NOT EXISTS "availableBalanceNum" double precision,
        ADD COLUMN IF NOT EXISTS "creditLimitNum" double precision,
        ADD COLUMN IF NOT EXISTS "lastPaymentAmountNum" double precision,
        ADD COLUMN IF NOT EXISTS "lastPaymentDateUtc" timestamptz;
    `

    const sqlTransactions = `
      ALTER TABLE public.transactions
        ADD COLUMN IF NOT EXISTS "amountEnc" text,
        ADD COLUMN IF NOT EXISTS "dateEnc" text,
        ADD COLUMN IF NOT EXISTS "amountNum" double precision,
        ADD COLUMN IF NOT EXISTS "dateUtc" timestamptz;
    `

    await prisma.$executeRawUnsafe(sqlAccounts)
    await prisma.$executeRawUnsafe(sqlTransactions)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('migrate-step2 error', e)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}


