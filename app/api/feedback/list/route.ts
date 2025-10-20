import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (priority) {
      if (priority === 'null') {
        where.priority = null
      } else {
        where.priority = priority
      }
    }

    // Get all feedback first (we'll sort manually)
    const [allFeedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          comments: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      }),
      prisma.feedback.count({ where })
    ])

    // Custom priority sorting: critical > high > medium > low > null
    const priorityOrder = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4, null: 5 }
    
    const sortedFeedback = allFeedback.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // If same priority, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Apply pagination after sorting
    const feedback = sortedFeedback.slice(skip, skip + limit)

    return NextResponse.json({
      success: true,
      feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch feedback', 
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}
