import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Check if the account belongs to the user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: (session.user as any).id,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get the institution name to identify which PlaidItem to potentially delete
    const institutionName = account.institutionName

    // Delete associated transactions first
    await prisma.transaction.deleteMany({
      where: { accountId: accountId },
    })

    // Delete the account
    await prisma.account.delete({
      where: {
        id: accountId,
      },
    })

    // Check if there are any remaining accounts for this institution
    const remainingAccountsForInstitution = await prisma.account.count({
      where: {
        userId: (session.user as any).id,
        institutionName: institutionName,
      },
    })

    // If no accounts remain for this institution, delete the PlaidItem
    if (remainingAccountsForInstitution === 0) {
      await prisma.plaidItem.deleteMany({
        where: {
          userId: (session.user as any).id,
          institutionName: institutionName,
        },
      })
      
      console.log(`Deleted PlaidItem for institution: ${institutionName}`)
    }

    return NextResponse.json({ success: true, message: 'Account removed successfully' })
  } catch (error) {
    console.error('Error removing account:', error)
    return NextResponse.json(
      { error: 'Failed to remove account' },
      { status: 500 }
    )
  }
}
