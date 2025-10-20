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

    const { type, message } = await request.json()
    const userId = (session.user as any).id

    if (!type || !message) {
      return NextResponse.json({ 
        error: 'Type and message are required' 
      }, { status: 400 })
    }

    if (!['bug', 'feature', 'improvement'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid feedback type. Must be bug, feature, or improvement' 
      }, { status: 400 })
    }

    // Get user agent and other metadata
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const metadata = {
      userAgent,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    }

    // Create feedback entry
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type,
        message: message.trim(),
        status: 'new',
        priority: null, // No priority by default - admin will assign
        tags: [], // Can be populated later
        metadata
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      feedbackId: feedback.id
    })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback', 
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}
