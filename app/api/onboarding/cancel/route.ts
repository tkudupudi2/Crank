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

    const userId = (session.user as any).id

    // Delete the user and all associated data (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting user account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
