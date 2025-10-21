import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ContextManager from '@/lib/context-manager'

// Enhanced NLP Service with ML + Context Memory
class EnhancedNLPService {

  // Rule-based patterns (fallback)
  private intentPatterns = {
    greeting: [
      /^hi$/i,
      /^hello$/i,
      /^hey$/i,
      /^hiya$/i,
      /^howdy$/i,
      /^greetings$/i,
      /^good morning$/i,
      /^good afternoon$/i,
      /^good evening$/i,
      /^good day$/i,
      /^what's up$/i,
      /^what up$/i,
      /^sup$/i,
      /^yo$/i,
      /^hi there$/i,
      /^hello there$/i,
      /^hey there$/i,
      /^hiya there$/i,
      /^howdy there$/i,
      /^greetings there$/i,
      /^good morning there$/i,
      /^good afternoon there$/i,
      /^good evening there$/i,
      /^good day there$/i,
      /^what's up there$/i,
      /^what up there$/i,
      /^sup there$/i,
      /^yo there$/i,
      /^hi!$/i,
      /^hello!$/i,
      /^hey!$/i,
      /^hiya!$/i,
      /^howdy!$/i,
      /^greetings!$/i,
      /^good morning!$/i,
      /^good afternoon!$/i,
      /^good evening!$/i,
      /^good day!$/i,
      /^what's up!$/i,
      /^what up!$/i,
      /^sup!$/i,
      /^yo!$/i,
      /^hi there!$/i,
      /^hello there!$/i,
      /^hey there!$/i,
      /^hiya there!$/i,
      /^howdy there!$/i,
      /^greetings there!$/i,
      /^good morning there!$/i,
      /^good afternoon there!$/i,
      /^good evening there!$/i,
      /^good day there!$/i,
      /^what's up there!$/i,
      /^what up there!$/i,
      /^sup there!$/i,
      /^yo there!$/i,
      // Additional casual greetings
      /^hiya!$/i,
      /^hey!$/i,
      /^yo!$/i,
      /^sup!$/i,
      /^what's good$/i,
      /^what's good!$/i,
      /^how are you$/i,
      /^how are you!$/i,
      /^how's it going$/i,
      /^how's it going!$/i,
      /^howdy!$/i,
      /^greetings!$/i
    ],
        spending_analysis: [
          /how much.*spent.*/i,
          /how did.*spend.*/i,
          /what.*spent.*/i,
          /show.*spending.*/i,
          /display.*spending.*/i,
          /how much.*money.*use.*/i,
          /what.*expense.*/i,
          /how much.*pay.*/i,
          /show.*costs.*/i,
          /how much.*spend.*/i,
          /how did.*spend.*/i,
          /what.*bill.*/i,
          /what.*cost.*/i,
          /expense.*on.*/i,
          /spending.*on.*/i,
          /cost.*of.*/i,
          /what.*pay.*for.*/i,
          /how much.*pay.*for.*/i,
          /what.*charge.*/i,
          /bill.*for.*/i,
          /display.*costs.*/i,
          /show.*expenses.*/i,
          /display.*expenses.*/i,
          /give.*expenses.*/i,
          /what.*money.*use.*for.*/i,
          /how much.*money.*use.*for.*/i,
          /what.*spend.*on.*/i,
          /how.*spend.*/i,
          // Context-aware patterns
          /how much.*spend.*on.*groceries/i,
          /how much.*spend.*on.*entertainment/i,
          /how much.*spend.*on.*shopping/i,
          /how much.*spend.*on.*utilities/i,
          /how much.*spend.*on.*transportation/i,
          /how much.*spend.*on.*healthcare/i,
          /how much.*spend.*on.*education/i
        ],
    savings_analysis: [
      /how much.*save.*/i,
      /what.*save.*/i,
      /show.*savings.*/i,
      /display.*savings.*/i,
      /savings.*amount.*/i,
      /how much.*saved.*/i,
      /what.*saved.*/i
    ],
    budget_analysis: [
      /how much.*left.*budget.*/i,
      /what.*left.*budget.*/i,
      /budget.*remaining.*/i,
      /budget.*left.*/i,
      /remaining.*budget.*/i,
      /budget.*status.*/i,
      /am.*over.*budget.*/i,
      /under.*budget.*/i
    ],
    category_breakdown: [
      /break down.*expenses.*/i,
      /what.*breakdown.*/i,
      /what.*buy.*in.*/i,
      /give.*spending.*details.*/i,
      /grocery.*breakdown.*/i,
      /breakdown.*grocery.*/i,
      /show.*spending.*breakdown.*/i,
      /display.*spending.*breakdown.*/i
    ],
    transaction_search: [
      /find.*transaction.*/i,
      /search.*transaction.*/i,
      /show.*transaction.*/i,
      /find.*purchase.*/i,
      /search.*purchase.*/i,
      /show.*purchase.*/i,
      /find.*payment.*/i,
      /search.*payment.*/i
    ],
    account_balance: [
      /what.*balance.*/i,
      /show.*balance.*/i,
      /display.*balance.*/i,
      /how much.*account.*/i,
      /account.*balance.*/i,
      /checking.*balance.*/i,
      /savings.*balance.*/i
    ],
    trend_analysis: [
      /how.*trending.*/i,
      /what.*trend.*/i,
      /show.*trend.*/i,
      /spending.*trend.*/i,
      /expense.*trend.*/i,
      /compare.*month.*/i,
      /compare.*week.*/i
    ]
  }

  private categoryMapping = {
    dining: ['dining', 'food', 'restaurants', 'eating out', 'meals', 'restaurant', 'cafe', 'bar', 'food & drink'],
    groceries: ['groceries', 'grocery', 'food shopping', 'supermarket', 'grocery store', 'food & drink'],
    entertainment: ['entertainment', 'fun', 'leisure', 'recreation', 'movies', 'streaming', 'games', 'music'],
    transportation: ['transportation', 'travel', 'commute', 'gas', 'fuel', 'public transit', 'uber', 'lyft'],
    shopping: ['shopping', 'online', 'retail', 'stores', 'amazon', 'ebay'],
    utilities: ['utilities', 'electricity', 'water', 'internet', 'phone', 'cable', 'internet service'],
    healthcare: ['healthcare', 'medical', 'pharmacy', 'doctor', 'hospital', 'health', 'medicine'],
    education: ['education', 'school', 'training', 'courses', 'books', 'university', 'college', 'learning']
  }

  private timeframePatterns = {
    "last month": /last month|previous month|past month/i,
    "this month": /this month|current month|present month/i,
    "last week": /last week|previous week|past week/i,
    "this week": /this week|current week|present week/i,
    "past 3 days": /past 3 days|last 3 days|past few days/i,
    "past week": /past week|last 7 days|past 7 days/i,
    "this year": /this year|current year|present year/i,
    "last year": /last year|previous year|past year/i
  }

  // Context-aware query processing
  async processQuery(query: string, userId: string, userFirstName?: string): Promise<any> {
    // Get conversation context
    const context = this.getContext(userId)
    
    // Enhance query with context
    const enhancedQuery = this.enhanceQueryWithContext(query, context)
    
    // Debug logging
    if (query !== enhancedQuery) {
      console.log(`Context enhancement: "${query}" → "${enhancedQuery}"`)
    }
    
    // Classify intent
    const intent = this.classifyIntent(enhancedQuery)
    
    // Extract entities from the enhanced query
    const entities = this.extractEntities(enhancedQuery)
    
    console.log('Enhanced query entities:', entities)
    
    // Generate SQL
    const sqlQuery = this.generateSqlQuery(intent, entities)
    
    // Generate response template
    let responseTemplate = this.generateResponseTemplate(intent, entities)
    
    // Special handling for greetings with user's first name
    if (intent === 'greeting' && userFirstName) {
      responseTemplate = `Hello ${userFirstName}! Nice to meet you! I'm here to help you with your finances. What would you like to know about your spending, savings, or budget?`
    }
    
    // Update context
    this.updateContext(userId, {
      query,
      intent,
      entities,
      timestamp: new Date()
    })

    return {
      intent,
      entities,
      confidence: 0.9, // High confidence for rule-based
      sqlQuery,
      responseTemplate,
      context: context.slice(-3), // Last 3 queries for context
      method: 'enhanced_rule_based',
      originalQuery: query,
      enhancedQuery: enhancedQuery
    }
  }

  private getContext(userId: string): any[] {
    const context = ContextManager.getContext(userId)
    console.log(`Retrieved context for user ${userId}:`, context.length, 'items')
    return context
  }

  private enhanceQueryWithContext(query: string, context: any[]): string {
    console.log(`Enhancing query: "${query}" with context length: ${context.length}`)
    
    // Handle follow-up questions
    if (query.toLowerCase().includes('what about') || query.toLowerCase().includes('how about')) {
      const lastQuery = context[context.length - 1]
      console.log('Last query from context:', lastQuery)
      
      if (lastQuery) {
        // Get the previous intent and entities
        const lastIntent = lastQuery.intent
        const lastEntities = lastQuery.entities
        
        console.log('Last intent:', lastIntent, 'Last entities:', lastEntities)
        
        if (lastIntent === 'spending_analysis' && lastEntities?.timeframe) {
          // For spending analysis follow-ups, add the timeframe and make it a spending query
          const category = query.toLowerCase().replace(/what about|how about|\?/gi, '').trim()
          const enhanced = `how much did I spend on ${category} ${lastEntities.timeframe}`
          console.log('Enhanced query:', enhanced)
          return enhanced
        } else if (lastIntent === 'category_breakdown' && lastEntities?.timeframe) {
          // For category breakdown follow-ups
          const enhanced = `show me my ${query.toLowerCase().replace(/what about|how about/gi, '').trim()} spending ${lastEntities.timeframe}`
          console.log('Enhanced query:', enhanced)
          return enhanced
        }
      }
    }

    // Handle "this month" references
    if (query.toLowerCase().includes('this month') && context.length > 0) {
      const lastQuery = context[context.length - 1]
      if (lastQuery?.entities?.timeframe) {
        query = query.replace(/this month/gi, lastQuery.entities.timeframe)
      }
    }

    // Handle "show me" without context
    if (query.toLowerCase().includes('show me') && !query.toLowerCase().includes('spending') && !query.toLowerCase().includes('expense')) {
      query = query.replace(/show me/gi, 'show me my spending on')
    }

    return query
  }

  private classifyIntent(query: string): string {
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          return intent
        }
      }
    }
    return 'unknown'
  }

  private extractEntities(query: string): any {
    const entities: any = {
      category: this.extractCategory(query),
      timeframe: this.extractTimeframe(query),
      amount: this.extractAmount(query),
      account: this.extractAccount(query),
      merchant: this.extractMerchant(query)
    }

    return entities
  }

  private extractCategory(query: string): string | null {
    const lowerQuery = query.toLowerCase()
    
    // Check for specific category keywords first
    for (const [category, keywords] of Object.entries(this.categoryMapping)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          console.log(`Found category: ${category} for keyword: ${keyword}`)
          return category
        }
      }
    }
    
    return null
  }

  private extractTimeframe(query: string): string | null {
    for (const [timeframe, pattern] of Object.entries(this.timeframePatterns)) {
      if (pattern.test(query)) {
        return timeframe
      }
    }
    return null
  }

  private extractAmount(query: string): number | null {
    const amountMatch = query.match(/\$?(\d+(?:\.\d{2})?)/)
    return amountMatch ? parseFloat(amountMatch[1]) : null
  }

  private extractAccount(query: string): string | null {
    if (/checking|checking account/i.test(query)) return 'checking'
    if (/savings|savings account/i.test(query)) return 'savings'
    if (/credit|credit card/i.test(query)) return 'credit card'
    return null
  }

  private extractMerchant(query: string): string | null {
    // Enhanced merchant extraction
    // Look for "Find my X purchases" or "Show me X transactions"
    const findMatch = query.match(/(?:find|show|search).*?(?:my|the)?\s+([A-Za-z\s]+?)\s+(?:purchases|transactions|spending)/i)
    if (findMatch) {
      let merchant = findMatch[1].trim()
      // Remove common words like "my", "the", "from", "last", "week", "month"
      merchant = merchant.replace(/\b(my|the|from|last|week|month|year|day|days)\b/gi, '').trim()
      console.log(`Found merchant: ${merchant}`)
      return merchant
    }
    
    // Look for "at X" or "from X" patterns
    const atMatch = query.match(/(?:at|from|to)\s+([A-Za-z\s]+?)(?:\s|$)/i)
    if (atMatch) {
      let merchant = atMatch[1].trim()
      merchant = merchant.replace(/\b(my|the|from|last|week|month|year|day|days)\b/gi, '').trim()
      console.log(`Found merchant: ${merchant}`)
      return merchant
    }
    
    return null
  }

  private generateSqlQuery(intent: string, entities: any): string {
    switch (intent) {
      case 'spending_analysis':
        return this.generateSpendingSql(entities)
      case 'savings_analysis':
        return this.generateSavingsSql(entities)
      case 'budget_analysis':
        return this.generateBudgetSql(entities)
      case 'category_breakdown':
        return this.generateCategorySql(entities)
      case 'transaction_search':
        return this.generateTransactionSearchSql(entities)
      case 'account_balance':
        return this.generateAccountBalanceSql(entities)
      case 'trend_analysis':
        return this.generateTrendAnalysisSql(entities)
      default:
        return 'SELECT 1'
    }
  }

  private generateSpendingSql(entities: any): string {
    const category = entities.category
    const timeframe = entities.timeframe || 'this month'
    const merchant = entities.merchant
    
    console.log('generateSpendingSql - category:', category, 'timeframe:', timeframe, 'merchant:', merchant)
    
    // If there's a merchant but no category, search by merchant
    if (merchant && !category) {
      const dateRange = this.getDateRange(timeframe)
      return `SELECT SUM(amount) FROM transactions WHERE LOWER("merchantName") LIKE '%${merchant.toLowerCase()}%' AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    }
    
    if (!category) {
      // For general spending queries without a specific category, sum all transactions
      const dateRange = this.getDateRange(timeframe)
      return `SELECT SUM(amount) FROM transactions WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    }
    
    const dateRange = this.getDateRange(timeframe)
    
    // Special handling for groceries vs dining
    if (category === 'groceries') {
      // For groceries, look for grocery-related subcategories or merchant names
      return `SELECT SUM(amount) FROM transactions WHERE category && ARRAY['Food and Dining', 'Food and Drink'] AND (LOWER(subcategory) IN ('groceries', 'supermarkets') OR LOWER("merchantName") LIKE '%grocery%' OR LOWER("merchantName") LIKE '%supermarket%' OR LOWER("merchantName") LIKE '%walmart%' OR LOWER("merchantName") LIKE '%target%' OR LOWER("merchantName") LIKE '%costco%' OR LOWER("merchantName") LIKE '%safeway%' OR LOWER("merchantName") LIKE '%kroger%') AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    } else if (category === 'dining') {
      // For dining, exclude grocery stores
      return `SELECT SUM(amount) FROM transactions WHERE category && ARRAY['Food and Dining', 'Food and Drink'] AND NOT (LOWER("merchantName") LIKE '%grocery%' OR LOWER("merchantName") LIKE '%supermarket%' OR LOWER("merchantName") LIKE '%walmart%' OR LOWER("merchantName") LIKE '%target%' OR LOWER("merchantName") LIKE '%costco%' OR LOWER("merchantName") LIKE '%safeway%' OR LOWER("merchantName") LIKE '%kroger%') AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    }
    
    // For other categories, use the standard mapping
    const categoryMapping = {
      entertainment: ['Entertainment'],
      transportation: ['Transportation'],
      shopping: ['Shopping'],
      utilities: ['Other'],
      healthcare: ['Other'],
      education: ['Other']
    }
    
    const categories = categoryMapping[category as keyof typeof categoryMapping] || [category]
    console.log('Using categories for SQL:', categories)
    
    const categoryList = categories.map(cat => `'${cat}'`).join(', ')
    return `SELECT SUM(amount) FROM transactions WHERE category && ARRAY[${categoryList}] AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
  }

  private generateSavingsSql(entities: any): string {
    const timeframe = entities.timeframe || 'this month'
    const dateRange = this.getDateRange(timeframe)
    return `SELECT SUM(amount) FROM transactions WHERE amount > 0 AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
  }

  private generateBudgetSql(entities: any): string {
    const category = entities.category || 'dining'
    return `SELECT budget_amount - spent_amount FROM budgets WHERE category = '${category}' AND month = '${new Date().toISOString().slice(0, 7)}'`
  }

  private generateCategorySql(entities: any): string {
    const category = entities.category
    const timeframe = entities.timeframe || 'this month'
    
    if (!category) {
      return 'SELECT 1'
    }
    
    const categoryMapping = {
      dining: ['Food and Dining', 'Food and Drink'],
      groceries: ['Food and Dining', 'Food and Drink'],
      entertainment: ['Entertainment'],
      transportation: ['Transportation'],
      shopping: ['Shopping'],
      utilities: ['Other'],
      healthcare: ['Other'],
      education: ['Other']
    }
    
    const categories = categoryMapping[category as keyof typeof categoryMapping] || [category]
    const dateRange = this.getDateRange(timeframe)
    
    const categoryList = categories.map(cat => `'${cat}'`).join(', ')
    return `SELECT category, SUM(amount) FROM transactions WHERE category && ARRAY[${categoryList}] AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}' GROUP BY category`
  }

  private generateTransactionSearchSql(entities: any): string {
    const merchant = entities.merchant
    const timeframe = entities.timeframe || 'this month'
    const dateRange = this.getDateRange(timeframe)
    
    if (merchant) {
      return `SELECT * FROM transactions WHERE LOWER("merchantName") LIKE '%${merchant.toLowerCase()}%' AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}' ORDER BY date DESC LIMIT 10`
    }
    
    return `SELECT * FROM transactions WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}' ORDER BY date DESC LIMIT 10`
  }

  private generateAccountBalanceSql(entities: any): string {
    const account = entities.account || 'checking'
    return `SELECT current_balance FROM accounts WHERE type = '${account}' AND is_active = true`
  }

  private generateTrendAnalysisSql(entities: any): string {
    const category = entities.category
    const timeframe = entities.timeframe || 'this month'
    const dateRange = this.getDateRange(timeframe)
    
    if (category) {
      const categoryMapping = {
        dining: ['Food and Dining', 'Food and Drink'],
        groceries: ['Food and Dining', 'Food and Drink'],
        entertainment: ['Entertainment'],
        transportation: ['Transportation'],
        shopping: ['Shopping'],
        utilities: ['Other'],
        healthcare: ['Other'],
        education: ['Other']
      }
      
      const categories = categoryMapping[category as keyof typeof categoryMapping] || [category]
      const categoryList = categories.map(cat => `'${cat}'`).join(', ')
      return `SELECT DATE_TRUNC('week', date) as week, SUM(amount) FROM transactions WHERE category && ARRAY[${categoryList}] AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}' GROUP BY week ORDER BY week`
    }
    
    return `SELECT DATE_TRUNC('week', date) as week, SUM(amount) FROM transactions WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}' GROUP BY week ORDER BY week`
  }

  private generateResponseTemplate(intent: string, entities: any): string {
    const category = entities.category || 'items'
    const timeframe = entities.timeframe || 'this month'
    const merchant = entities.merchant
    
    switch (intent) {
      case 'greeting':
        return `Hello! Nice to meet you! I'm here to help you with your finances. What would you like to know about your spending, savings, or budget?`
      case 'spending_analysis':
        if (merchant) {
          return `You spent ${'{amount}'} at ${merchant} ${timeframe}`
        }
        return `You spent ${'{amount}'} on ${category} ${timeframe}`
      case 'savings_analysis':
        return `You saved ${'{amount}'} ${timeframe}`
      case 'budget_analysis':
        return `You have ${'{amount}'} left in your ${category} budget`
      case 'category_breakdown':
        return `Here's your ${category} spending ${timeframe}: ${'{breakdown}'}`
      case 'transaction_search':
        return `Here are your recent transactions: ${'{transactions}'}`
      case 'account_balance':
        return `Your ${entities.account || 'account'} balance is ${'{amount}'}`
      case 'trend_analysis':
        return `Here's your ${category} spending trend: ${'{trend}'}`
      case 'unknown':
        return `I didn't understand that. Try asking about your spending, savings, or budget!`
      default:
        return `I found some information for you.`
    }
  }

  private getDateRange(timeframe: string): { start: string; end: string } {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    switch (timeframe) {
      case 'last month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          start: lastMonth.toISOString().split('T')[0],
          end: lastMonthEnd.toISOString().split('T')[0]
        }
      case 'this month':
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return {
          start: thisMonth.toISOString().split('T')[0],
          end: today
        }
      case 'last week':
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return {
          start: lastWeek.toISOString().split('T')[0],
          end: today
        }
      case 'this week':
        const thisWeek = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000)
        return {
          start: thisWeek.toISOString().split('T')[0],
          end: today
        }
      case 'past 3 days':
        const past3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        return {
          start: past3Days.toISOString().split('T')[0],
          end: today
        }
      case 'past week':
        const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return {
          start: pastWeek.toISOString().split('T')[0],
          end: today
        }
      case 'this year':
        const thisYear = new Date(now.getFullYear(), 0, 1)
        return {
          start: thisYear.toISOString().split('T')[0],
          end: today
        }
      case 'last year':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1)
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)
        return {
          start: lastYear.toISOString().split('T')[0],
          end: lastYearEnd.toISOString().split('T')[0]
        }
      default:
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: today
        }
    }
  }

  private updateContext(userId: string, contextItem: any): void {
    ContextManager.updateContext(userId, contextItem)
  }

  private getSuggestions(): string[] {
    return [
      "How much did I spend on dining last month?",
      "What did I save this month?",
      "Show me my entertainment spending",
      "How much do I have left in my food budget?",
      "What's my utilities expense this month?",
      "Show me my shopping costs last week",
      "Find my Starbucks purchases",
      "What's my checking balance?",
      "How is my spending trending?"
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Get the actual user ID and first name from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user.id
    const nlp = new EnhancedNLPService()
    const nlpResult = await nlp.processQuery(query, userId, user.firstName)

    let queryResult = null
    let response = nlpResult.responseTemplate

        if (nlpResult.sqlQuery !== 'SELECT 1') {
          try {
            console.log('Generated SQL:', nlpResult.sqlQuery)
            const rawResult = await prisma.$queryRawUnsafe(nlpResult.sqlQuery)
            console.log('Query result:', rawResult)
            console.log('Raw result type:', typeof rawResult, 'Array?', Array.isArray(rawResult))
            if (Array.isArray(rawResult)) {
              console.log('Array length:', rawResult.length)
              if (rawResult.length > 0) {
                console.log('First result:', rawResult[0])
                console.log('First result keys:', Object.keys(rawResult[0]))
              }
            }
        
        if (Array.isArray(rawResult)) {
          if (rawResult.length > 0) {
            const result = rawResult[0] as any
            
                if (result.sum !== undefined && result.category === undefined) {
                  queryResult = { amount: Math.abs(result.sum) }
                  console.log('Processing sum result:', result.sum, 'Amount:', queryResult.amount)
                  console.log('Response before replace:', response)
                  response = response.replace('{amount}', `$${queryResult.amount.toFixed(2)}`)
                  console.log('Response after replace:', response)
            } else if (result.budget_amount !== undefined && result.spent_amount !== undefined) {
              const remaining = result.budget_amount - result.spent_amount
              queryResult = { amount: remaining }
              response = response.replace('{amount}', `$${remaining.toFixed(2)}`)
            } else if (result.category !== undefined) {
              const breakdowns = rawResult.map((r: any) => {
                const categoryName = Array.isArray(r.category) ? r.category[0] : r.category
                return `${categoryName}: $${Math.abs(r.sum).toFixed(2)}`
              })
              queryResult = { breakdown: breakdowns.join(', ') }
              response = response.replace('{breakdown}', queryResult.breakdown)
            } else if (result.current_balance !== undefined) {
              queryResult = { amount: result.current_balance }
              response = response.replace('{amount}', `$${result.current_balance.toFixed(2)}`)
            } else if (result.week !== undefined) {
              const trends = rawResult.map((r: any) => {
                const week = new Date(r.week).toLocaleDateString()
                return `${week}: $${Math.abs(r.sum).toFixed(2)}`
              })
              queryResult = { trend: trends.join(', ') }
              response = response.replace('{trend}', queryResult.trend)
                } else if (result.merchantName !== undefined) {
                  const transactions = rawResult.map((r: any) => {
                    const date = new Date(r.date).toLocaleDateString()
                    return `${date}: ${r.merchantName} - $${Math.abs(r.amount).toFixed(2)}`
                  })
                  queryResult = { transactions: transactions.join('\n') }
                  response = response.replace('{transactions}', queryResult.transactions)
                } else if (rawResult.length > 0 && rawResult[0].merchantName) {
                  // Handle transaction search results
                  const transactions = rawResult.map((r: any) => {
                    const date = new Date(r.date).toLocaleDateString()
                    return `${date}: ${r.merchantName} - $${Math.abs(r.amount).toFixed(2)}`
                  })
                  queryResult = { transactions: transactions.join('\n') }
                  response = response.replace('{transactions}', queryResult.transactions)
                }
          } else {
            // Handle empty results based on intent
            if (nlpResult.intent === 'transaction_search') {
              const merchant = nlpResult.entities.merchant
              const timeframe = nlpResult.entities.timeframe || 'this period'
              response = `I didn't find any ${merchant ? merchant + ' ' : ''}transactions ${timeframe}.`
            } else if (nlpResult.intent === 'spending_analysis') {
              const category = nlpResult.entities.category
              const timeframe = nlpResult.entities.timeframe || 'this period'
              response = `You didn't spend anything on ${category} ${timeframe}.`
            } else if (nlpResult.intent === 'savings_analysis') {
              const timeframe = nlpResult.entities.timeframe || 'this period'
              response = `You didn't save anything ${timeframe}.`
            } else if (nlpResult.intent === 'account_balance') {
              response = `I couldn't retrieve your account balance right now.`
            } else if (nlpResult.intent === 'trend_analysis') {
              const category = nlpResult.entities.category
              const timeframe = nlpResult.entities.timeframe || 'this period'
              response = `I don't have enough data to show ${category ? category + ' ' : ''}trends ${timeframe}.`
            }
          }
        }
      } catch (dbError: any) {
        console.error('Database query error:', dbError)
        response = "I couldn't retrieve that information right now. Please try again later."
      }
    }

    // Save conversation to database
    try {
      if (prisma.conversation) {
        await prisma.conversation.create({
          data: {
            userId,
            query,
            intent: nlpResult.intent,
            entities: nlpResult.entities,
            response,
            confidence: nlpResult.confidence
          }
        })
      }
    } catch (conversationError) {
      console.error('Error saving conversation:', conversationError)
    }

    return NextResponse.json({
      success: true,
      intent: nlpResult.intent,
      entities: nlpResult.entities,
      confidence: nlpResult.confidence,
      response,
      queryResult,
      context: nlpResult.context,
      suggestions: [],
      method: nlpResult.method
    })
  } catch (error) {
    console.error('Enhanced NLP API error:', error)
    return NextResponse.json(
      { error: 'Failed to process query', details: (error as Error).message },
      { status: 500 }
    )
  }
}
