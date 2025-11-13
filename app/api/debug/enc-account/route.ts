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

    const account = await prisma.account.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    if (!account) return NextResponse.json({ error: 'No account' }, { status: 404 })

    return NextResponse.json({
      encryptionEnabled: process.env.ENCRYPTION_ENABLED,
      account: {
        id: account.id,
        name: account.name,
        nameEnc: (account as any).nameEnc,
        mask: account.mask,
        maskEnc: (account as any).maskEnc,
        subtype: account.subtype,
        subtypeEnc: (account as any).subtypeEnc,
        institutionName: account.institutionName,
      }
    })
  } catch (e) {
    console.error('debug enc-account error', e)
    return NextResponse.json({ error: 'fail' }, { status: 500 })
  }
}


