/**
 * Advanced Query Processor
 * Handles complex financial queries and comparisons
 */

interface ComparisonQuery {
  type: 'spending_comparison' | 'category_comparison' | 'time_comparison' | 'budget_comparison'
  entities: any
  timeframe1: string
  timeframe2: string
  category1?: string
  category2?: string
}

interface ComplexResult {
  type: string
  data: any
  insights: string[]
  visualization?: any
}

class AdvancedQueryProcessor {
  /**
   * Process complex financial queries
   */
  static async processComplexQuery(query: string, userId: string): Promise<ComplexResult | null> {
    const comparisonQuery = this.parseComparisonQuery(query)
    
    if (comparisonQuery) {
      return await this.processComparisonQuery(comparisonQuery, userId)
    }

    const trendQuery = this.parseTrendQuery(query)
    if (trendQuery) {
      return await this.processTrendQuery(trendQuery, userId)
    }

    const predictionQuery = this.parsePredictionQuery(query)
    if (predictionQuery) {
      return await this.processPredictionQuery(predictionQuery, userId)
    }

    return null
  }

  /**
   * Parse comparison queries
   */
  private static parseComparisonQuery(query: string): ComparisonQuery | null {
    // "Compare my spending this month vs last month"
    const monthComparison = query.match(/compare.*spending.*this month.*vs.*last month/i)
    if (monthComparison) {
      return {
        type: 'time_comparison',
        entities: {},
        timeframe1: 'this month',
        timeframe2: 'last month'
      }
    }

    // "Compare my dining vs groceries spending"
    const categoryComparison = query.match(/compare.*(dining|groceries|entertainment|transportation).*vs.*(dining|groceries|entertainment|transportation)/i)
    if (categoryComparison) {
      return {
        type: 'category_comparison',
        entities: {},
        timeframe1: 'this month',
        timeframe2: 'this month',
        category1: categoryComparison[1],
        category2: categoryComparison[2]
      }
    }

    // "How does my spending compare to last year?"
    const yearComparison = query.match(/how does.*spending.*compare.*to.*last year/i)
    if (yearComparison) {
      return {
        type: 'time_comparison',
        entities: {},
        timeframe1: 'this year',
        timeframe2: 'last year'
      }
    }

    return null
  }

  /**
   * Parse trend queries
   */
  private static parseTrendQuery(query: string): any | null {
    // "Show me my spending trend over the last 6 months"
    const trendMatch = query.match(/show.*trend.*over.*last (\d+) months/i)
    if (trendMatch) {
      return {
        type: 'trend',
        months: parseInt(trendMatch[1]),
        category: this.extractCategory(query)
      }
    }

    // "What's my spending pattern?"
    const patternMatch = query.match(/what.*spending pattern/i)
    if (patternMatch) {
      return {
        type: 'pattern',
        category: this.extractCategory(query)
      }
    }

    return null
  }

  /**
   * Parse prediction queries
   */
  private static parsePredictionQuery(query: string): any | null {
    // "Will I stay within budget this month?"
    const budgetPrediction = query.match(/will.*stay.*within budget/i)
    if (budgetPrediction) {
      return {
        type: 'budget_prediction',
        timeframe: 'this month'
      }
    }

    // "How much will I spend next month?"
    const spendingPrediction = query.match(/how much.*will.*spend.*next month/i)
    if (spendingPrediction) {
      return {
        type: 'spending_prediction',
        timeframe: 'next month',
        category: this.extractCategory(query)
      }
    }

    return null
  }

  /**
   * Extract category from query
   */
  private static extractCategory(query: string): string | null {
    const categories = ['dining', 'groceries', 'entertainment', 'transportation', 'shopping', 'utilities', 'healthcare', 'education']
    
    for (const category of categories) {
      if (query.toLowerCase().includes(category)) {
        return category
      }
    }
    
    return null
  }

  /**
   * Process comparison queries
   */
  private static async processComparisonQuery(comparisonQuery: ComparisonQuery, userId: string): Promise<ComplexResult> {
    const { type, timeframe1, timeframe2, category1, category2 } = comparisonQuery

    switch (type) {
      case 'time_comparison':
        return await this.processTimeComparison(timeframe1, timeframe2, userId)
      case 'category_comparison':
        return await this.processCategoryComparison(category1!, category2!, timeframe1, userId)
      default:
        return {
          type: 'error',
          data: null,
          insights: ['Unable to process this comparison query.']
        }
    }
  }

  /**
   * Process time-based comparisons
   */
  private static async processTimeComparison(timeframe1: string, timeframe2: string, userId: string): Promise<ComplexResult> {
    // This would query the database for actual data
    // For now, return mock data
    const data1 = { amount: 1200, timeframe: timeframe1 }
    const data2 = { amount: 1100, timeframe: timeframe2 }
    
    const difference = data1.amount - data2.amount
    const percentageChange = ((difference / data2.amount) * 100).toFixed(1)
    
    const insights = []
    if (difference > 0) {
      insights.push(`Your spending increased by $${Math.abs(difference).toFixed(2)} (${percentageChange}%) compared to ${timeframe2}.`)
      if (Math.abs(parseFloat(percentageChange)) > 20) {
        insights.push('This is a significant change in your spending pattern.')
      }
    } else {
      insights.push(`Your spending decreased by $${Math.abs(difference).toFixed(2)} (${Math.abs(parseFloat(percentageChange))}%) compared to ${timeframe2}.`)
      insights.push('Great job on reducing your expenses!')
    }

    return {
      type: 'time_comparison',
      data: {
        current: data1,
        previous: data2,
        difference: difference,
        percentageChange: parseFloat(percentageChange)
      },
      insights: insights,
      visualization: {
        type: 'bar_chart',
        data: [
          { period: timeframe1, amount: data1.amount },
          { period: timeframe2, amount: data2.amount }
        ]
      }
    }
  }

  /**
   * Process category comparisons
   */
  private static async processCategoryComparison(category1: string, category2: string, timeframe: string, userId: string): Promise<ComplexResult> {
    // This would query the database for actual data
    // For now, return mock data
    const data1 = { category: category1, amount: 300, timeframe: timeframe }
    const data2 = { category: category2, amount: 250, timeframe: timeframe }
    
    const difference = data1.amount - data2.amount
    const percentageDifference = ((difference / data2.amount) * 100).toFixed(1)
    
    const insights = []
    if (difference > 0) {
      insights.push(`You spend $${Math.abs(difference).toFixed(2)} more on ${category1} than ${category2} (${percentageDifference}% more).`)
    } else {
      insights.push(`You spend $${Math.abs(difference).toFixed(2)} less on ${category1} than ${category2} (${Math.abs(parseFloat(percentageDifference))}% less).`)
    }

    return {
      type: 'category_comparison',
      data: {
        category1: data1,
        category2: data2,
        difference: difference,
        percentageDifference: parseFloat(percentageDifference)
      },
      insights: insights,
      visualization: {
        type: 'pie_chart',
        data: [
          { category: category1, amount: data1.amount },
          { category: category2, amount: data2.amount }
        ]
      }
    }
  }

  /**
   * Process trend queries
   */
  private static async processTrendQuery(trendQuery: any, userId: string): Promise<ComplexResult> {
    const { type, months, category } = trendQuery

    if (type === 'trend') {
      // This would query the database for actual trend data
      // For now, return mock data
      const trendData = [
        { month: 'Jan', amount: 1100 },
        { month: 'Feb', amount: 1200 },
        { month: 'Mar', amount: 1150 },
        { month: 'Apr', amount: 1300 },
        { month: 'May', amount: 1250 },
        { month: 'Jun', amount: 1400 }
      ].slice(-months)

      const insights = []
      const firstAmount = trendData[0].amount
      const lastAmount = trendData[trendData.length - 1].amount
      const totalChange = lastAmount - firstAmount
      const averageChange = totalChange / (trendData.length - 1)

      if (totalChange > 0) {
        insights.push(`Your spending has increased by $${totalChange.toFixed(2)} over the last ${months} months.`)
        insights.push(`Average monthly increase: $${averageChange.toFixed(2)}`)
      } else {
        insights.push(`Your spending has decreased by $${Math.abs(totalChange).toFixed(2)} over the last ${months} months.`)
        insights.push(`Average monthly decrease: $${Math.abs(averageChange).toFixed(2)}`)
      }

      return {
        type: 'trend',
        data: {
          trendData: trendData,
          totalChange: totalChange,
          averageChange: averageChange,
          category: category
        },
        insights: insights,
        visualization: {
          type: 'line_chart',
          data: trendData
        }
      }
    }

    return {
      type: 'error',
      data: null,
      insights: ['Unable to process this trend query.']
    }
  }

  /**
   * Process prediction queries
   */
  private static async processPredictionQuery(predictionQuery: any, userId: string): Promise<ComplexResult> {
    const { type, timeframe, category } = predictionQuery

    if (type === 'budget_prediction') {
      // This would analyze current spending patterns and predict budget adherence
      // For now, return mock data
      const currentSpending = 800
      const budgetLimit = 1000
      const daysRemaining = 10
      const projectedSpending = currentSpending + (currentSpending / 20) * daysRemaining

      const insights = []
      if (projectedSpending <= budgetLimit) {
        insights.push(`Based on your current spending pattern, you're on track to stay within budget.`)
        insights.push(`Projected spending: $${projectedSpending.toFixed(2)} (Budget: $${budgetLimit})`)
      } else {
        insights.push(`Warning: You're projected to exceed your budget by $${(projectedSpending - budgetLimit).toFixed(2)}.`)
        insights.push(`Consider reducing spending in the remaining days.`)
      }

      return {
        type: 'budget_prediction',
        data: {
          currentSpending: currentSpending,
          budgetLimit: budgetLimit,
          projectedSpending: projectedSpending,
          daysRemaining: daysRemaining,
          onTrack: projectedSpending <= budgetLimit
        },
        insights: insights
      }
    }

    if (type === 'spending_prediction') {
      // This would analyze historical data to predict future spending
      // For now, return mock data
      const historicalAverage = 1200
      const seasonalAdjustment = 1.1 // 10% increase for next month
      const predictedSpending = historicalAverage * seasonalAdjustment

      const insights = []
      insights.push(`Based on your historical spending patterns, you're likely to spend around $${predictedSpending.toFixed(2)} next month.`)
      insights.push(`This is ${((seasonalAdjustment - 1) * 100).toFixed(1)}% higher than your average monthly spending.`)

      return {
        type: 'spending_prediction',
        data: {
          historicalAverage: historicalAverage,
          predictedSpending: predictedSpending,
          category: category,
          confidence: 0.75
        },
        insights: insights
      }
    }

    return {
      type: 'error',
      data: null,
      insights: ['Unable to process this prediction query.']
    }
  }
}

export default AdvancedQueryProcessor
