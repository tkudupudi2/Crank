import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const { feedbackId, priority } = await request.json()

    if (!feedbackId) {
      return NextResponse.json({ 
        error: 'Feedback ID is required' 
      }, { status: 400 })
    }

    // Allow null priority (no priority)
    if (priority !== null && !['low', 'medium', 'high', 'critical'].includes(priority)) {
      return NextResponse.json({ 
        error: 'Invalid priority. Must be low, medium, high, critical, or null' 
      }, { status: 400 })
    }

    // Update the feedback priority
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { priority },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Priority updated successfully',
      feedback: updatedFeedback
    })
  } catch (error) {
    console.error('Error updating feedback priority:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update priority', 
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}
