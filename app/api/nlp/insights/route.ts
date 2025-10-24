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

    // Generate financial insights
    const insights = await FinancialInsightsService.generateInsights(user.id)
    const recommendations = await FinancialInsightsService.getRecommendations(user.id)
    const healthScore = await FinancialInsightsService.getFinancialHealthScore(user.id)

    return NextResponse.json({
      insights,
      recommendations,
      healthScore,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
