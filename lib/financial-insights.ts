/**
 * Financial Insights Service
 * Provides advanced financial analytics and insights
 */

import { prisma } from './prisma'

interface SpendingPattern {
  category: string
  amount: number
  percentage: number
  trend: 'increasing' | 'decreasing' | 'stable'
  averageMonthly: number
}

interface FinancialInsight {
  type: 'warning' | 'suggestion' | 'achievement' | 'trend'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  action?: string
}

interface Recommendation {
  title: string
  description: string
  action: string
}

interface BudgetStatus {
  category: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  status: 'on_track' | 'warning' | 'over_budget'
}

class FinancialInsightsService {
  /**
   * Generate comprehensive financial insights
   */
  static async generateInsights(userId: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = []

    try {
      // Get spending patterns
      const spendingPatterns = await this.getSpendingPatterns(userId)
      
      // Get budget status
      const budgetStatus = await this.getBudgetStatus(userId)
      
      // Get recent trends
      const trends = await this.getSpendingTrends(userId)
      
      // Generate insights based on data
      insights.push(...this.analyzeSpendingPatterns(spendingPatterns))
      insights.push(...this.analyzeBudgetStatus(budgetStatus))
      insights.push(...this.analyzeTrends(trends))
      const proactiveInsights = await this.generateProactiveInsights(userId)
      insights.push(...proactiveInsights)

      // Sort by priority
      return insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
    } catch (error) {
      console.error('Error generating insights:', error)
      return []
    }
  }

  /**
   * Get spending patterns by category
   */
  private static async getSpendingPatterns(userId: string): Promise<SpendingPattern[]> {
    try {
      // App-side compute: fetch a coarse window and aggregate in memory
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      const rows = await prisma.transaction.findMany({
        where: { userId },
        select: { amount: true, date: true, category: true },
        take: 5000,
      })

      // Helper to accumulate spending by primary category for a range
      const sumByCategory = (start: Date, end: Date) => {
        const map = new Map<string, number>()
        for (const tx of rows) {
          const d = new Date(tx.date as any)
          if (d >= start && d <= end && (tx.amount ?? 0) < 0) {
            const primary = (tx.category && tx.category.length > 0 ? tx.category[0] : 'Other') as string
            map.set(primary, (map.get(primary) || 0) + Math.abs(tx.amount || 0))
          }
        }
        return map
      }

      const currentMap = sumByCategory(startOfMonth, endOfMonth)
      const prevMap = sumByCategory(startOfPrevMonth, endOfPrevMonth)
      const totalCurrent = Array.from(currentMap.values()).reduce((a, b) => a + b, 0)

      const patterns: SpendingPattern[] = Array.from(currentMap.entries()).map(([cat, amt]) => {
        const prevAmt = prevMap.get(cat) || 0
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
        if (prevAmt > 0) {
          const change = ((amt - prevAmt) / prevAmt) * 100
          if (change > 10) trend = 'increasing'
          else if (change < -10) trend = 'decreasing'
        }
        return {
          category: cat,
          amount: amt,
          percentage: totalCurrent > 0 ? Math.round((amt / totalCurrent) * 100) : 0,
          trend,
          averageMonthly: amt,
        }
      }).sort((a, b) => b.amount - a.amount).slice(0, 10)

      return patterns
    } catch (error) {
      console.error('Error getting spending patterns:', error)
      return []
    }
  }

  /**
   * Get budget status for categories
   */
  private static async getBudgetStatus(userId: string): Promise<BudgetStatus[]> {
    // TODO: Implement budget tracking system
    // For now, return empty array since we don't have budget data
    return []
  }

  /**
   * Get spending trends over time
   */
  private static async getSpendingTrends(userId: string): Promise<any> {
    try {
      // App-side compute for last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      sixMonthsAgo.setDate(1)

      const rows = await prisma.transaction.findMany({
        where: { userId },
        select: { amount: true, date: true, category: true },
        take: 10000,
      })

      const bucket = new Map<string, number>()
      const catTotals = new Map<string, number>()
      for (const tx of rows) {
        const d = new Date(tx.date as any)
        if (d >= sixMonthsAgo && (tx.amount ?? 0) < 0) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          bucket.set(key, (bucket.get(key) || 0) + Math.abs(tx.amount || 0))
          const primary = (tx.category && tx.category.length > 0 ? tx.category[0] : 'Other') as string
          catTotals.set(primary, (catTotals.get(primary) || 0) + Math.abs(tx.amount || 0))
        }
      }

      const keys = Array.from(bucket.keys()).sort()
      const monthlySpending = keys.map(k => bucket.get(k) || 0)
      const categories = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c)

      return { monthlySpending, categories }
    } catch (error) {
      console.error('Error getting spending trends:', error)
      return {
        monthlySpending: [],
        categories: []
      }
    }
  }

  /**
   * Analyze spending patterns and generate insights
   */
  private static analyzeSpendingPatterns(patterns: SpendingPattern[]): FinancialInsight[] {
    const insights: FinancialInsight[] = []

    // Return early if no patterns
    if (patterns.length === 0) {
      return insights
    }

    // Find highest spending category
    const highestSpending = patterns.reduce((max, current) => 
      current.amount > max.amount ? current : max
    )

    if (highestSpending.percentage > 40) {
      insights.push({
        type: 'warning',
        title: 'High Spending Concentration',
        message: `You're spending ${highestSpending.percentage}% of your money on ${highestSpending.category}. Consider diversifying your spending.`,
        priority: 'high',
        actionable: true,
        action: 'Review your spending habits and consider setting limits for this category.'
      })
    }

    // Check for increasing trends
    const increasingCategories = patterns.filter(p => p.trend === 'increasing')
    if (increasingCategories.length > 0) {
      insights.push({
        type: 'trend',
        title: 'Spending Increase Detected',
        message: `Your spending on ${increasingCategories.map(c => c.category).join(', ')} has been increasing.`,
        priority: 'medium',
        actionable: true,
        action: 'Review these categories and consider if the increases are necessary.'
      })
    }

    // Check for decreasing trends (positive)
    const decreasingCategories = patterns.filter(p => p.trend === 'decreasing')
    if (decreasingCategories.length > 0) {
      insights.push({
        type: 'achievement',
        title: 'Spending Reduction Success',
        message: `Great job! You've reduced spending on ${decreasingCategories.map(c => c.category).join(', ')}.`,
        priority: 'low',
        actionable: false
      })
    }

    return insights
  }

  /**
   * Analyze budget status and generate insights
   */
  private static analyzeBudgetStatus(budgets: BudgetStatus[]): FinancialInsight[] {
    const insights: FinancialInsight[] = []

    // Check for over-budget categories
    const overBudget = budgets.filter(b => b.status === 'over_budget')
    if (overBudget.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Over Budget Alert',
        message: `You've exceeded your budget for ${overBudget.map(b => b.category).join(', ')}.`,
        priority: 'high',
        actionable: true,
        action: 'Review your spending and adjust your budget or spending habits.'
      })
    }

    // Check for warning categories (close to budget limit)
    const warningCategories = budgets.filter(b => b.status === 'warning')
    if (warningCategories.length > 0) {
      insights.push({
        type: 'suggestion',
        title: 'Budget Warning',
        message: `You're approaching your budget limit for ${warningCategories.map(b => b.category).join(', ')}.`,
        priority: 'medium',
        actionable: true,
        action: 'Monitor your spending in these categories to avoid going over budget.'
      })
    }

    // Check for well-managed budgets
    const onTrack = budgets.filter(b => b.status === 'on_track' && b.percentage < 70)
    if (onTrack.length > 0) {
      insights.push({
        type: 'achievement',
        title: 'Budget Management Success',
        message: `You're doing well managing your budget for ${onTrack.map(b => b.category).join(', ')}.`,
        priority: 'low',
        actionable: false
      })
    }

    return insights
  }

  /**
   * Analyze trends and generate insights
   */
  private static analyzeTrends(trends: any): FinancialInsight[] {
    const insights: FinancialInsight[] = []

    // Analyze monthly spending trend
    const monthlySpending = trends.monthlySpending
    if (monthlySpending.length >= 3) {
      const recent = monthlySpending.slice(-3)
      const isIncreasing = recent[2] > recent[1] && recent[1] > recent[0]
      const isDecreasing = recent[2] < recent[1] && recent[1] < recent[0]

      if (isIncreasing) {
        insights.push({
          type: 'trend',
          title: 'Monthly Spending Trend',
          message: 'Your monthly spending has been increasing over the last 3 months.',
          priority: 'medium',
          actionable: true,
          action: 'Review your recent purchases and identify areas where you can cut back.'
        })
      } else if (isDecreasing) {
        insights.push({
          type: 'achievement',
          title: 'Spending Reduction Trend',
          message: 'Great job! Your monthly spending has been decreasing.',
          priority: 'low',
          actionable: false
        })
      }
    }

    return insights
  }

  /**
   * Generate proactive insights
   */
  private static async generateProactiveInsights(userId: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = []

    // Check for unusual spending patterns
    insights.push({
      type: 'suggestion',
      title: 'Savings Opportunity',
      message: 'Consider setting up automatic transfers to your savings account to build your emergency fund.',
      priority: 'medium',
      actionable: true,
      action: 'Set up automatic savings transfers of $50-100 per month.'
    })

    // Check for subscription optimization
    insights.push({
      type: 'suggestion',
      title: 'Subscription Review',
      message: 'Review your subscriptions and cancel any you no longer use to save money.',
      priority: 'low',
      actionable: true,
      action: 'Audit your monthly subscriptions and cancel unused services.'
    })

    return insights
  }

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(userId: string): Promise<Recommendation[]> {
    const insights = await this.generateInsights(userId)
    
    // Get actionable recommendations from insights
    const insightRecommendations = insights
      .filter(insight => insight.actionable && insight.action)
      .map(insight => ({
        title: insight.title,
        description: insight.message,
        action: insight.action!
      }))
    
    // Add general recommendations if we don't have enough
    const generalRecommendations: Recommendation[] = [
      {
        title: "Set Up Emergency Fund",
        description: "Aim to save 3-6 months of expenses in an emergency fund for financial security.",
        action: "Set up automatic transfers to a savings account"
      },
      {
        title: "Review Monthly Budget",
        description: "Track your spending against a monthly budget to identify areas for improvement.",
        action: "Create a budget and monitor spending weekly"
      },
      {
        title: "Pay Down High-Interest Debt",
        description: "Focus on paying off credit cards and high-interest loans to improve your financial health.",
        action: "Make extra payments on highest interest rate debts first"
      },
      {
        title: "Diversify Your Spending",
        description: "Avoid concentrating too much spending in one category to maintain financial balance.",
        action: "Review spending patterns and adjust budget allocation"
      },
      {
        title: "Monitor Credit Score",
        description: "Keep track of your credit score and report to maintain good financial standing.",
        action: "Check your credit report regularly and dispute any errors"
      }
    ]
    
    // Combine and return up to 5 recommendations
    const allRecommendations = [...insightRecommendations, ...generalRecommendations]
    return allRecommendations.slice(0, 5)
  }

  /**
   * Get financial health score
   */
  static async getFinancialHealthScore(userId: string): Promise<number> {
    try {
      const insights = await this.generateInsights(userId)
      
      // If no insights (no transaction data), return neutral score
      if (insights.length === 0) {
        return 50
      }
      
      let score = 100
      
      // Deduct points for warnings and high priority issues
      insights.forEach(insight => {
        if (insight.type === 'warning' && insight.priority === 'high') {
          score -= 20
        } else if (insight.type === 'warning' && insight.priority === 'medium') {
          score -= 10
        } else if (insight.type === 'suggestion' && insight.priority === 'high') {
          score -= 5
        }
      })
      
      // Add points for achievements
      const achievements = insights.filter(i => i.type === 'achievement')
      score += Math.min(achievements.length * 5, 20)
      
      return Math.max(0, Math.min(100, score))
    } catch (error) {
      console.error('Error calculating financial health score:', error)
      return 50 // Default neutral score
    }
  }
}

export default FinancialInsightsService
