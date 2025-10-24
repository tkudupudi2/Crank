import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import FinancialInsightsService from '@/lib/financial-insights'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from database
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get financial health score and insights
    const [score, insights, recommendations] = await Promise.all([
      FinancialInsightsService.getFinancialHealthScore(user.id),
      FinancialInsightsService.generateInsights(user.id),
      FinancialInsightsService.getRecommendations(user.id)
    ])

    return NextResponse.json({
      score,
      insights,
      recommendations,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting financial health:', error)
    return NextResponse.json(
      { error: 'Failed to get financial health data' },
      { status: 500 }
    )
  }
}
