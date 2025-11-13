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

    const stmts = [
      `CREATE INDEX IF NOT EXISTS idx_transactions_user_dateutc_id ON public.transactions ("userId", "dateUtc" DESC, "id")`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_user_amountnum ON public.transactions ("userId", "amountNum")`,
      `CREATE INDEX IF NOT EXISTS idx_accounts_user_currentbalnum ON public.accounts ("userId", "currentBalanceNum")`,
      `CREATE INDEX IF NOT EXISTS idx_accounts_user_availablebalnum ON public.accounts ("userId", "availableBalanceNum")`
    ]

    for (const sql of stmts) {
      await prisma.$executeRawUnsafe(sql)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('add-indexes error', e)
    return NextResponse.json({ error: 'Index creation failed' }, { status: 500 })
  }
}


