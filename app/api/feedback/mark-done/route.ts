import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const { feedbackId } = await request.json()

    if (!feedbackId) {
      return NextResponse.json({ 
        error: 'Feedback ID is required' 
      }, { status: 400 })
    }

    // Delete the feedback (mark as done)
    await prisma.feedback.delete({
      where: { id: feedbackId },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback marked as done and deleted successfully'
    })
  } catch (error) {
    console.error('Error marking feedback as done:', error)
    return NextResponse.json(
      { 
        error: 'Failed to mark feedback as done', 
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}
