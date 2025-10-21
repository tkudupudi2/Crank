import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ContextManager from '@/lib/context-manager'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the actual user ID from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete all conversations for this user
    await prisma.conversation.deleteMany({
      where: { userId: user.id }
    })

    // Also clear the context memory for this user
    ContextManager.clearUserContext(user.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Conversations cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing conversations:', error)
    return NextResponse.json(
      { error: 'Failed to clear conversations' }, 
      { status: 500 }
    )
  }
}
