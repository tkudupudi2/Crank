import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const { feedbackId, comment } = await request.json()

    if (!feedbackId || !comment) {
      return NextResponse.json({ 
        error: 'Feedback ID and comment are required' 
      }, { status: 400 })
    }

    // Add the comment
    const newComment = await prisma.feedbackComment.create({
      data: {
        feedbackId,
        comment: comment.trim(),
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Comment added successfully',
      comment: newComment
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add comment', 
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}
