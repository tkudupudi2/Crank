/**
 * ML-Enhanced NLP Service
 * Integrates machine learning models with rule-based NLP
 */

import ContextManager from './context-manager'

interface MLPrediction {
  intent: string
  confidence: number
  entities?: any
}

interface HybridResult {
  intent: string
  entities: any
  confidence: number
  sqlQuery: string
  responseTemplate: string
  method: string
}

class MLNLPService {
  private static mlModels: Map<string, any> = new Map()
  private static isModelLoaded = false

  /**
   * Load ML models (placeholder for future implementation)
   */
  static async loadModels(): Promise<void> {
    if (this.isModelLoaded) return

    try {
      // In a real implementation, this would load actual ML models
      // For now, we'll use enhanced rule-based patterns
      console.log('ML models loaded (using enhanced rule-based fallback)')
      this.isModelLoaded = true
    } catch (error) {
      console.error('Failed to load ML models:', error)
      this.isModelLoaded = false
    }
  }

  /**
   * Enhanced intent classification with ML-like confidence scoring
   */
  static classifyIntent(query: string): MLPrediction {
    const enhancedPatterns = {
      spending_analysis: [
        /how much.*spent.*/i,
        /how much.*spend.*/i,
        /how did.*spend.*/i,
        /what.*spent.*/i,
        /what.*spend.*/i,
        /spending.*on.*/i,
        /how much.*expense.*/i,
        /how much.*cost.*/i,
        /paid.*for.*/i,
        /bought.*/i,
        /purchased.*/i,
        /spent.*money.*/i,
        /money.*spent.*/i,
        /outgoing.*money.*/i,
        /debit.*/i,
        /charge.*/i,
        /bill.*/i,
        /payment.*/i,
        /how much did i spend on.*/i,
        /spent.*on.*this.*/i,
        /spent.*on.*last.*/i
      ],
      savings_analysis: [
        /how much.*saved.*/i,
        /savings.*/i,
        /saved.*money.*/i,
        /money.*saved.*/i,
        /deposit.*/i,
        /incoming.*money.*/i,
        /credit.*/i,
        /income.*/i,
        /earned.*/i,
        /received.*/i
      ],
      budget_analysis: [
        /budget.*/i,
        /how much.*left.*/i,
        /remaining.*budget.*/i,
        /budget.*remaining.*/i,
        /budget.*left.*/i,
        /left.*in.*budget.*/i,
        /over.*budget.*/i,
        /under.*budget.*/i,
        /budget.*status.*/i
      ],
      category_breakdown: [
        /breakdown.*/i,
        /categor.*spending.*/i,
        /spending.*by.*categor.*/i,
        /what.*categor.*/i,
        /categor.*analysis.*/i,
        /spending.*distribution.*/i
      ],
      transaction_search: [
        /find.*transaction.*/i,
        /search.*transaction.*/i,
        /show.*transaction.*/i,
        /list.*transaction.*/i,
        /recent.*transaction.*/i,
        /transaction.*history.*/i,
        /purchase.*history.*/i
      ],
      account_balance: [
        /balance.*/i,
        /account.*balance.*/i,
        /how much.*in.*account.*/i,
        /current.*balance.*/i,
        /available.*balance.*/i
      ],
      trend_analysis: [
        /trend.*/i,
        /over.*time.*/i,
        /monthly.*trend.*/i,
        /weekly.*trend.*/i,
        /spending.*trend.*/i,
        /pattern.*/i,
        /change.*over.*time.*/i
      ],
      financial_insights: [
        /insight.*/i,
        /analysis.*/i,
        /summary.*/i,
        /overview.*/i,
        /financial.*health.*/i,
        /money.*management.*/i,
        /financial.*advice.*/i,
        /recommendation.*/i,
        /suggestion.*/i
      ],
      biggest_expenses: [
        /biggest.*expense.*/i,
        /largest.*expense.*/i,
        /highest.*expense.*/i,
        /top.*expense.*/i,
        /most.*expensive.*/i,
        /biggest.*spending.*/i,
        /largest.*spending.*/i,
        /highest.*spending.*/i,
        /top.*spending.*/i,
        /most.*spent.*/i,
        /biggest.*transaction.*/i,
        /largest.*transaction.*/i,
        /highest.*transaction.*/i,
        /top.*transaction.*/i,
        /want.*to.*see.*biggest.*expense/i,
        /what.*is.*biggest.*expense/i,
        /show.*me.*biggest.*expense/i,
        /biggest.*expense.*this.*month/i,
        /largest.*expense.*this.*month/i,
        /top.*expense.*this.*month/i
      ],
      greeting: [
        /^hi$/i,
        /^hello$/i,
        /^hey$/i,
        /^good morning$/i,
        /^good afternoon$/i,
        /^good evening$/i,
        /^howdy$/i,
        /^greetings$/i,
        /^sup$/i,
        /^what's up$/i
      ]
    }

    let bestMatch = { intent: 'unknown', confidence: 0 }

    for (const [intent, patterns] of Object.entries(enhancedPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          const confidence = this.calculateConfidence(query, pattern, intent)
          if (confidence > bestMatch.confidence) {
            bestMatch = { intent, confidence }
          }
        }
      }
    }

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      entities: this.extractEntities(query)
    }
  }

  /**
   * Calculate confidence score based on pattern matching and query complexity
   */
  private static calculateConfidence(query: string, pattern: RegExp, intent: string): number {
    let confidence = 0.7 // Base confidence

    // Boost confidence for exact matches
    if (pattern.test(query.trim())) {
      confidence += 0.2
    }

    // Boost confidence for longer, more specific queries
    if (query.length > 20) {
      confidence += 0.1
    }

    // Boost confidence for financial keywords
    const financialKeywords = ['spend', 'save', 'budget', 'money', 'dollar', 'cost', 'expense', 'income']
    const hasFinancialKeyword = financialKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    )
    if (hasFinancialKeyword) {
      confidence += 0.1
    }

    // Cap confidence at 0.95
    return Math.min(confidence, 0.95)
  }

  /**
   * Enhanced entity extraction
   */
  private static extractEntities(query: string): any {
    const entities: any = {}

    // Extract categories
    const categoryPatterns = {
      dining: /dining|restaurant|food|eat|meal|dinner|lunch|breakfast|cafe|coffee|starbucks/i,
      groceries: /grocery|groceries|supermarket|walmart|target|costco|safeway|kroger|food.*store/i,
      entertainment: /entertainment|movie|cinema|netflix|spotify|game|gaming|fun/i,
      transportation: /transport|gas|fuel|uber|lyft|taxi|bus|train|flight/i,
      travel: /travel|trip|vacation|hotel|airline|flight|booking|reservation/i,
      shopping: /shopping|store|mall|amazon|retail|clothes|clothing|fashion/i,
      utilities: /utility|electric|water|gas|internet|phone|cable|bill/i,
      healthcare: /health|medical|doctor|hospital|pharmacy|medicine|dental/i,
      education: /education|school|university|college|course|book|learning/i
    }

    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(query)) {
        entities.category = category
        break
      }
    }

    // Extract timeframes
    const timeframePatterns = {
      'this week': /this week|current week|past 7 days|last 7 days/i,
      'last week': /last week|previous week/i,
      'this month': /this month|current month|past 30 days|last 30 days/i,
      'last month': /last month|previous month/i,
      'this year': /this year|current year/i,
      'last year': /last year|previous year/i,
      'yesterday': /yesterday/i,
      'today': /today/i
    }

    for (const [timeframe, pattern] of Object.entries(timeframePatterns)) {
      if (pattern.test(query)) {
        entities.timeframe = timeframe
        break
      }
    }

    // Extract merchants
    const merchantMatch = query.match(/(?:at|from|to|with)\s+([a-zA-Z0-9\s]+?)(?:\s|$|,|\.|\?)/i)
    if (merchantMatch) {
      entities.merchant = merchantMatch[1].trim()
    }

    // Extract amounts
    const amountMatch = query.match(/\$?(\d+(?:\.\d{2})?)/i)
    if (amountMatch) {
      entities.amount = parseFloat(amountMatch[1])
    }

    return entities
  }

  /**
   * Process query with hybrid approach
   */
  static async processQuery(query: string, userId: string, userFirstName?: string): Promise<HybridResult> {
    await this.loadModels()

    // Get context for follow-up questions
    const context = ContextManager.getContext(userId)
    const enhancedQuery = this.enhanceQueryWithContext(query, context)

    // Get ML prediction first
    const mlPrediction = this.classifyIntent(enhancedQuery)

    // Check for complex queries
    const complexQuery = this.parseComplexQuery(enhancedQuery)
    if (complexQuery) {
      return this.processComplexQuery(complexQuery, mlPrediction.entities, userFirstName)
    }

    // Generate SQL and response based on intent
    const sqlQuery = this.generateSQL(mlPrediction.intent, mlPrediction.entities)
    const responseTemplate = this.generateResponseTemplate(mlPrediction.intent, mlPrediction.entities, userFirstName)

    // Update context
    ContextManager.updateContext(userId, {
      query: enhancedQuery,
      intent: mlPrediction.intent,
      entities: mlPrediction.entities,
      timestamp: new Date().toISOString()
    })

    return {
      intent: mlPrediction.intent,
      entities: mlPrediction.entities,
      confidence: mlPrediction.confidence,
      sqlQuery,
      responseTemplate,
      method: 'ml_enhanced'
    }
  }

  /**
   * Parse complex queries like comparisons and trends
   */
  private static parseComplexQuery(query: string): any | null {
    // "Compare my spending this month vs last month"
    const monthComparison = query.match(/compare.*spending.*this month.*vs.*last month/i)
    if (monthComparison) {
      return {
        type: 'time_comparison',
        timeframe1: 'this month',
        timeframe2: 'last month'
      }
    }

    // "Compare my spending last month vs this month"
    const monthComparisonReverse = query.match(/compare.*spending.*last month.*vs.*this month/i)
    if (monthComparisonReverse) {
      return {
        type: 'time_comparison',
        timeframe1: 'last month',
        timeframe2: 'this month'
      }
    }

    // "Show me my spending trend over 6 months"
    const trendQuery = query.match(/show.*trend.*over.*(\d+)\s*months/i)
    if (trendQuery) {
      return {
        type: 'trend_analysis',
        months: parseInt(trendQuery[1]),
        category: this.extractCategory(query)
      }
    }

    // "Show me my spending trend over the last 6 months"
    const trendQueryLast = query.match(/show.*trend.*over.*last\s*(\d+)\s*months/i)
    if (trendQueryLast) {
      return {
        type: 'trend_analysis',
        months: parseInt(trendQueryLast[1]),
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
   * Process complex queries
   */
  private static processComplexQuery(complexQuery: any, entities: any, userFirstName?: string): HybridResult {
    if (complexQuery.type === 'time_comparison') {
      // Generate comparison SQL that will be handled by the API
      const timeframe1 = complexQuery.timeframe1
      const timeframe2 = complexQuery.timeframe2
      
      return {
        intent: 'spending_comparison',
        entities: {
          ...entities,
          comparisonType: 'time',
          timeframe1: timeframe1,
          timeframe2: timeframe2
        },
        confidence: 0.9,
        sqlQuery: this.generateComparisonSQL(timeframe1, timeframe2),
        responseTemplate: `Here's your spending comparison between ${timeframe1} and ${timeframe2}: {comparison}`,
        method: 'ml_enhanced_complex'
      }
    }

    if (complexQuery.type === 'trend_analysis') {
      // Generate trend analysis SQL
      const months = complexQuery.months
      const category = complexQuery.category
      
      return {
        intent: 'trend_analysis',
        entities: {
          ...entities,
          trendType: 'monthly',
          months: months,
          category: category
        },
        confidence: 0.9,
        sqlQuery: this.generateTrendSQL(months, category),
        responseTemplate: `Here's your spending trend over the last ${months} months: {trend}`,
        method: 'ml_enhanced_complex'
      }
    }

    return {
      intent: 'unknown',
      entities: entities,
      confidence: 0,
      sqlQuery: 'SELECT 1',
      responseTemplate: "I didn't understand that. Try asking about your spending, savings, or budget!",
      method: 'ml_enhanced'
    }
  }

  /**
   * Generate comparison SQL for time-based comparisons
   */
  private static generateComparisonSQL(timeframe1: string, timeframe2: string): string {
    const dateRange1 = this.getDateRange(timeframe1)
    const dateRange2 = this.getDateRange(timeframe2)
    
    return `WITH period1 AS (
      SELECT SUM(amount) as total FROM transactions 
      WHERE date BETWEEN '${dateRange1.start}' AND '${dateRange1.end}'
    ),
    period2 AS (
      SELECT SUM(amount) as total FROM transactions 
      WHERE date BETWEEN '${dateRange2.start}' AND '${dateRange2.end}'
    )
    SELECT 
      p1.total as period1_total,
      p2.total as period2_total,
      (p1.total - p2.total) as difference,
      CASE 
        WHEN p2.total != 0 THEN CAST(((p1.total - p2.total) / ABS(p2.total)) * 100 AS DECIMAL(10,2))
        ELSE 0 
      END as percentage_change
    FROM period1 p1, period2 p2`
  }

  /**
   * Generate trend analysis SQL for monthly spending trends
   */
  private static generateTrendSQL(months: number, category?: string): string {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - months)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    let categoryFilter = ''
    if (category) {
      const categoryMapping = {
        dining: "category && ARRAY['Food and Dining', 'Food and Drink'] AND NOT (LOWER(\"merchantName\") LIKE '%grocery%' OR LOWER(\"merchantName\") LIKE '%supermarket%' OR LOWER(\"merchantName\") LIKE '%walmart%' OR LOWER(\"merchantName\") LIKE '%target%' OR LOWER(\"merchantName\") LIKE '%costco%' OR LOWER(\"merchantName\") LIKE '%safeway%' OR LOWER(\"merchantName\") LIKE '%kroger%')",
        groceries: "category && ARRAY['Food and Dining', 'Food and Drink'] AND (LOWER(subcategory) IN ('groceries', 'supermarkets') OR LOWER(\"merchantName\") LIKE '%grocery%' OR LOWER(\"merchantName\") LIKE '%supermarket%' OR LOWER(\"merchantName\") LIKE '%walmart%' OR LOWER(\"merchantName\") LIKE '%target%' OR LOWER(\"merchantName\") LIKE '%costco%' OR LOWER(\"merchantName\") LIKE '%safeway%' OR LOWER(\"merchantName\") LIKE '%kroger%')",
        entertainment: "category && ARRAY['Entertainment']",
        transportation: "category && ARRAY['Transportation']",
        shopping: "category && ARRAY['Shopping']",
        utilities: "category && ARRAY['Other']",
        healthcare: "category && ARRAY['Other']",
        education: "category && ARRAY['Other']"
      }
      
      if (categoryMapping[category as keyof typeof categoryMapping]) {
        categoryFilter = `AND ${categoryMapping[category as keyof typeof categoryMapping]}`
      }
    }
    
    return `SELECT 
      DATE_TRUNC('month', date) as month,
      SUM(amount) as total_spending,
      COUNT(*) as transaction_count
    FROM transactions 
    WHERE date BETWEEN '${startDateStr}' AND '${endDateStr}'
    ${categoryFilter}
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month ASC`
  }

  /**
   * Enhance query with context for follow-up questions
   */
  private static enhanceQueryWithContext(query: string, context: any[]): string {
    if (context.length === 0) return query

    const lastContext = context[context.length - 1]
    
    // Handle follow-up questions with timeframe changes
    if (/how about|what about/i.test(query)) {
      const timeframeMatch = query.match(/(this month|last month|this week|last week|this year|last year|yesterday|today)/i)
      const categoryMatch = query.match(/(dining|groceries?|entertainment|transportation|travel|shopping|utilities|healthcare|education)/i)
      
      // If both category and timeframe are specified, use both
      if (categoryMatch && timeframeMatch && lastContext.intent === 'spending_analysis') {
        return `how much did i spend on ${categoryMatch[1]} ${timeframeMatch[1]}`
      }
      
      // If only timeframe is specified, use previous category
      if (timeframeMatch && !categoryMatch && lastContext.intent === 'spending_analysis') {
        const category = lastContext.entities?.category || 'items'
        return `how much did i spend on ${category} ${timeframeMatch[1]}`
      }
      
      // If only category is specified, use previous timeframe
      if (categoryMatch && !timeframeMatch && lastContext.intent === 'spending_analysis') {
        const timeframe = lastContext.entities?.timeframe || 'this month'
        return `how much did i spend on ${categoryMatch[1]} ${timeframe}`
      }
      
      // Fallback: extract category from query
      const category = query.toLowerCase().replace(/what about|how about|\?/gi, '').trim()
      if (category && lastContext.intent === 'spending_analysis') {
        return `how much did I spend on ${category} ${lastContext.entities?.timeframe || 'this month'}`
      }
    }

    // Handle simple timeframe follow-ups like "how about this month"
    if (/^(how about|what about)\s+(this month|last month|this week|last week|this year|last year|yesterday|today)/i.test(query)) {
      const timeframeMatch = query.match(/(this month|last month|this week|last week|this year|last year|yesterday|today)/i)
      if (timeframeMatch && lastContext.intent === 'spending_analysis') {
        const category = lastContext.entities?.category || 'items'
        return `how much did i spend on ${category} ${timeframeMatch[1]}`
      }
    }

    if (/and.*\?$/i.test(query)) {
      return `${lastContext.query} and ${query.replace(/\?$/, '')}`
    }

    return query
  }

  /**
   * Generate SQL query based on intent and entities
   */
  private static generateSQL(intent: string, entities: any): string {
    const category = entities.category
    const timeframe = entities.timeframe || 'this month'
    const merchant = entities.merchant

    switch (intent) {
      case 'spending_analysis':
        return this.generateSpendingSQL(category, timeframe, merchant)
      case 'savings_analysis':
        return this.generateSavingsSQL(timeframe)
      case 'budget_analysis':
        return this.generateBudgetSQL(category, timeframe)
      case 'category_breakdown':
        return this.generateCategoryBreakdownSQL(timeframe)
      case 'transaction_search':
        return this.generateTransactionSearchSQL(merchant, timeframe)
      case 'account_balance':
        return this.generateAccountBalanceSQL()
      case 'trend_analysis':
        return this.generateTrendAnalysisSQL(category, timeframe)
      case 'biggest_expenses':
        return this.generateBiggestExpensesSQL(timeframe)
      default:
        return 'SELECT 1'
    }
  }

  /**
   * Generate spending analysis SQL
   */
  private static generateSpendingSQL(category: string, timeframe: string, merchant?: string): string {
    const dateRange = this.getDateRange(timeframe)
    
    if (merchant && !category) {
      return `SELECT SUM(amount) FROM transactions WHERE LOWER("merchantName") LIKE '%${merchant.toLowerCase()}%' AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    }
    
    if (!category) {
      return `SELECT SUM(amount) FROM transactions WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    }
    
    // Special handling for groceries vs dining
    if (category === 'groceries') {
      return `SELECT SUM(amount) FROM transactions WHERE category && ARRAY['Food and Dining', 'Food and Drink'] AND (LOWER(subcategory) IN ('groceries', 'supermarkets') OR LOWER("merchantName") LIKE '%grocery%' OR LOWER("merchantName") LIKE '%supermarket%' OR LOWER("merchantName") LIKE '%walmart%' OR LOWER("merchantName") LIKE '%target%' OR LOWER("merchantName") LIKE '%costco%' OR LOWER("merchantName") LIKE '%safeway%' OR LOWER("merchantName") LIKE '%kroger%') AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    } else if (category === 'dining') {
      return `SELECT SUM(amount) FROM transactions WHERE category && ARRAY['Food and Dining', 'Food and Drink'] AND NOT (LOWER("merchantName") LIKE '%grocery%' OR LOWER("merchantName") LIKE '%supermarket%' OR LOWER("merchantName") LIKE '%walmart%' OR LOWER("merchantName") LIKE '%target%' OR LOWER("merchantName") LIKE '%costco%' OR LOWER("merchantName") LIKE '%safeway%' OR LOWER("merchantName") LIKE '%kroger%') AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    }
    
    const categoryMapping = {
      entertainment: ['Entertainment'],
      transportation: ['Transportation'],
      travel: ['Travel'],
      shopping: ['Shopping'],
      utilities: ['Other'],
      healthcare: ['Other'],
      education: ['Other']
    }
    
    const categories = categoryMapping[category as keyof typeof categoryMapping] || [category]
    const categoryList = categories.map(cat => `'${cat}'`).join(', ')
    return `SELECT SUM(amount) FROM transactions WHERE category && ARRAY[${categoryList}] AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
  }

  /**
   * Generate other SQL methods (simplified for brevity)
   */
  private static generateSavingsSQL(timeframe: string): string {
    const dateRange = this.getDateRange(timeframe)
    return `SELECT SUM(amount) FROM transactions WHERE amount > 0 AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
  }

  private static generateBudgetSQL(category: string, timeframe: string): string {
    const dateRange = this.getDateRange(timeframe)
    
    // For now, we'll use a simple budget calculation
    // In a real app, you'd have a budgets table with user-defined budgets
    // For this demo, we'll assume a monthly budget of $5000 for general spending
    const monthlyBudget = 5000
    
    let categoryFilter = ''
    if (category) {
      if (category === 'groceries') {
        categoryFilter = `AND category && ARRAY['Food and Dining', 'Food and Drink'] AND (LOWER(subcategory) IN ('groceries', 'supermarkets') OR LOWER("merchantName") LIKE '%grocery%' OR LOWER("merchantName") LIKE '%supermarket%' OR LOWER("merchantName") LIKE '%walmart%' OR LOWER("merchantName") LIKE '%target%' OR LOWER("merchantName") LIKE '%costco%' OR LOWER("merchantName") LIKE '%safeway%' OR LOWER("merchantName") LIKE '%kroger%')`
      } else if (category === 'dining') {
        categoryFilter = `AND category && ARRAY['Food and Dining', 'Food and Drink'] AND NOT (LOWER("merchantName") LIKE '%grocery%' OR LOWER("merchantName") LIKE '%supermarket%' OR LOWER("merchantName") LIKE '%walmart%' OR LOWER("merchantName") LIKE '%target%' OR LOWER("merchantName") LIKE '%costco%' OR LOWER("merchantName") LIKE '%safeway%' OR LOWER("merchantName") LIKE '%kroger%')`
      } else {
        const categoryMapping: { [key: string]: string[] } = {
          entertainment: ['Entertainment'],
          transportation: ['Transportation'],
          shopping: ['Shopping'],
          utilities: ['Other'],
          healthcare: ['Other'],
          education: ['Other'],
        }
        const categories = categoryMapping[category] || [category]
        const categoryList = categories.map(cat => `'${cat}'`).join(', ')
        categoryFilter = `AND category && ARRAY[${categoryList}]`
      }
    }
    
    return `SELECT 
      ${monthlyBudget} as budget_amount,
      COALESCE(SUM(amount), 0) as spent_amount,
      ${monthlyBudget} - COALESCE(SUM(amount), 0) as remaining_amount
    FROM transactions 
    WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
    ${categoryFilter}`
  }

  private static generateCategoryBreakdownSQL(timeframe: string): string {
    const dateRange = this.getDateRange(timeframe)
    return `SELECT category, SUM(amount) as sum FROM transactions WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}' GROUP BY category ORDER BY sum DESC`
  }

  private static generateTransactionSearchSQL(merchant: string, timeframe: string): string {
    const dateRange = this.getDateRange(timeframe)
    if (merchant) {
      return `SELECT "merchantName", amount, date FROM transactions WHERE LOWER("merchantName") LIKE '%${merchant.toLowerCase()}%' AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}' ORDER BY date DESC LIMIT 10`
    }
    return `SELECT "merchantName", amount, date FROM transactions WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}' ORDER BY date DESC LIMIT 10`
  }

  private static generateAccountBalanceSQL(): string {
    return `SELECT SUM("currentBalance") as current_balance FROM accounts WHERE "isActive" = true AND "isVirtual" = false`
  }

  private static generateTrendAnalysisSQL(category: string, timeframe: string): string {
    const dateRange = this.getDateRange(timeframe)
    return `SELECT DATE_TRUNC('week', date) as week, SUM(amount) as sum FROM transactions WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}' GROUP BY week ORDER BY week`
  }

  private static generateBiggestExpensesSQL(timeframe: string): string {
    const dateRange = this.getDateRange(timeframe)
    return `SELECT "merchantName", amount, date, description FROM transactions WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}' ORDER BY ABS(amount) DESC LIMIT 10`
  }

  /**
   * Generate response template
   */
  private static generateResponseTemplate(intent: string, entities: any, userFirstName?: string): string {
    const category = entities.category || 'items'
    const timeframe = entities.timeframe || 'this month'
    const merchant = entities.merchant

    switch (intent) {
      case 'greeting':
        return userFirstName 
          ? `Hello ${userFirstName}! Nice to meet you! I'm here to help you with your finances. What would you like to know about your spending, savings, or budget?`
          : `Hello! Nice to meet you! I'm here to help you with your finances. What would you like to know about your spending, savings, or budget?`
      case 'spending_analysis':
        if (merchant) {
          return `You spent {amount} at ${merchant} ${timeframe}`
        }
        return `You spent {amount} on ${category} ${timeframe}`
      case 'savings_analysis':
        return `You saved {amount} ${timeframe}`
      case 'budget_analysis':
        if (category) {
          return `You have {amount} left in your ${category} budget this month`
        }
        return `You have {amount} left in your monthly budget`
      case 'category_breakdown':
        return `Here's your ${category} spending ${timeframe}: {breakdown}`
      case 'transaction_search':
        return `Here are your recent transactions: {transactions}`
      case 'account_balance':
        return `Your account balance is {amount}`
      case 'trend_analysis':
        return `Here's your ${category} spending trend: {trend}`
      case 'biggest_expenses':
        return `Here are your biggest expenses ${timeframe}: {expenses}`
      case 'financial_insights':
        return `Here are some financial insights for you: {insights}`
      default:
        return `I found some information for you.`
    }
  }

  /**
   * Get date range for timeframe
   */
  private static getDateRange(timeframe: string): { start: string; end: string } {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    switch (timeframe) {
      case 'today':
        return { start: today, end: today }
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        return { start: yesterday, end: yesterday }
      case 'this week':
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        return { start: weekStart, end: today }
      case 'last week':
        const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        return { start: lastWeekStart, end: lastWeekEnd }
      case 'this month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        return { start: monthStart, end: today }
      case 'last month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
        return { start: lastMonthStart, end: lastMonthEnd }
      case 'this year':
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        return { start: yearStart, end: today }
      case 'last year':
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
        return { start: lastYearStart, end: lastYearEnd }
      default:
        return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], end: today }
    }
  }
}

export default MLNLPService
