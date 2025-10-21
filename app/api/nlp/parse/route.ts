import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Simple rule-based NLP implementation (in TypeScript)
class RuleBasedNLP {
  private intentPatterns = {
    spending_analysis: [
      /how much.*spent.*/i,
      /what.*spent.*/i,
      /show.*spending.*/i,
      /display.*spending.*/i,
      /how much.*money.*use.*/i,
      /what.*expense.*/i,
      /how much.*pay.*/i,
      /show.*costs.*/i,
      /how much.*spend.*/i,
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
      /what.*spend.*on.*/i
    ],
    savings_analysis: [
      /how much.*save.*/i,
      /what.*save.*/i,
      /show.*savings.*/i,
      /display.*savings.*/i,
      /how much.*money.*save.*/i,
      /what.*savings.*/i,
      /show.*saved.*/i,
      /how much.*put aside.*/i
    ],
    budget_analysis: [
      /how much.*left.*budget.*/i,
      /what.*left.*budget.*/i,
      /show.*budget.*remaining.*/i,
      /how much.*budget.*/i,
      /what.*budget.*status.*/i,
      /display.*budget.*left.*/i,
      /show.*budget.*remaining.*/i,
      /how much.*left.*for.*/i
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
    'last month': /last month|previous month|past month/i,
    'this month': /this month|current month|present month/i,
    'last week': /last week|previous week|past week/i,
    'this week': /this week|current week|present week/i,
    'past 3 days': /past 3 days|last 3 days|past few days/i,
    'past week': /past week|last 7 days|past 7 days/i,
    'this year': /this year|current year|present year/i,
    'last year': /last year|previous year|past year/i
  }

  parseQuery(query: string) {
    const queryLower = query.toLowerCase().trim()
    
    // Classify intent
    const intent = this.classifyIntent(queryLower)
    
    // Extract entities
    const entities = this.extractEntities(queryLower)
    
    // Generate SQL query
    const sqlQuery = this.generateSqlQuery(intent, entities)
    
    // Generate response template
    const responseTemplate = this.generateResponseTemplate(intent, entities)
    
    return {
      intent,
      entities,
      confidence: intent === 'unknown' ? 0.0 : 1.0,
      sqlQuery,
      responseTemplate,
      suggestions: intent === 'unknown' ? this.getSuggestions() : []
    }
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

  private extractEntities(query: string) {
    const entities = {
      category: null as string | null,
      timeframe: null as string | null,
      amount: null as number | null,
      account: null as string | null,
      merchant: null as string | null
    }

    // Extract category
    entities.category = this.extractCategory(query)
    
    // Extract timeframe
    entities.timeframe = this.extractTimeframe(query)
    
    // Extract amount
    entities.amount = this.extractAmount(query)
    
    return entities
  }

  private extractCategory(query: string): string | null {
    for (const [category, keywords] of Object.entries(this.categoryMapping)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
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
    // Look for dollar amounts
    const dollarMatch = query.match(/\$(\d+(?:\.\d{2})?)/)
    if (dollarMatch) {
      return parseFloat(dollarMatch[1])
    }
    
    // Look for number + "dollars"
    const dollarTextMatch = query.match(/(\d+(?:\.\d{2})?)\s*dollars?/)
    if (dollarTextMatch) {
      return parseFloat(dollarTextMatch[1])
    }
    
    return null
  }

  private generateSqlQuery(intent: string, entities: any): string {
    if (intent === 'spending_analysis') {
      return this.generateSpendingSql(entities)
    } else if (intent === 'savings_analysis') {
      return this.generateSavingsSql(entities)
    } else if (intent === 'budget_analysis') {
      return this.generateBudgetSql(entities)
    } else if (intent === 'category_breakdown') {
      return this.generateCategorySql(entities)
    }
    return 'SELECT 1'
  }

  private generateSpendingSql(entities: any): string {
    const category = entities.category
    const timeframe = entities.timeframe || 'this month' // Default to this month if no timeframe specified
    
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
    
    // Use PostgreSQL array contains operator
    const categoryList = categories.map(cat => `'${cat}'`).join(', ')
    return `SELECT SUM(amount) FROM transactions WHERE category && ARRAY[${categoryList}] AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
  }

  private generateSavingsSql(entities: any): string {
    const timeframe = entities.timeframe || 'last month'
    const dateRange = this.getDateRange(timeframe)
    return `SELECT SUM(amount) FROM transactions WHERE amount > 0 AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
  }

  private generateBudgetSql(entities: any): string {
    const category = entities.category || 'general'
    const currentMonth = new Date().toISOString().slice(0, 7)
    return `SELECT budget_amount - spent_amount FROM budgets WHERE category = '${category}' AND month = '${currentMonth}'`
  }

  private generateCategorySql(entities: any): string {
    const category = entities.category
    const timeframe = entities.timeframe
    
    if (!category || !timeframe) {
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
    
    // Use PostgreSQL array contains operator
    const categoryList = categories.map(cat => `'${cat}'`).join(', ')
    return `SELECT category, SUM(amount) FROM transactions WHERE category && ARRAY[${categoryList}] AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}' GROUP BY category`
  }

  private generateResponseTemplate(intent: string, entities: any): string {
    const category = entities.category || 'items'
    const timeframe = entities.timeframe || 'this month'
    
    if (intent === 'spending_analysis') {
      return `You spent $${'{amount}'} on ${category} ${timeframe}`
    } else if (intent === 'savings_analysis') {
      return `You saved $${'{amount}'} ${timeframe}`
    } else if (intent === 'budget_analysis') {
      return `You have $${'{amount}'} left in your ${category} budget`
    } else if (intent === 'category_breakdown') {
      return `Here's your ${category} spending ${timeframe}: ${'{breakdown}'}`
    } else if (intent === 'unknown') {
      return `I didn't understand that. Try asking about your spending, savings, or budget!`
    }
    return `I found some information for you.`
  }

  private getSuggestions(): string[] {
    return [
      "How much did I spend on dining last month?",
      "What did I save this month?",
      "Show me my entertainment spending",
      "How much do I have left in my food budget?",
      "What's my utilities expense this month?",
      "Show me my shopping costs last week"
    ]
  }

  private getDateRange(timeframe: string): { start: string; end: string } {
    const now = new Date()
    
    if (timeframe === 'last month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      }
    } else if (timeframe === 'this month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = now
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      }
    } else if (timeframe === 'last week') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const end = now
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      }
    } else if (timeframe === 'this week') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const end = now
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      }
    } else if (timeframe === 'past 3 days') {
      const start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      const end = now
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      }
    } else if (timeframe === 'past week') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const end = now
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      }
    } else if (timeframe === 'this year') {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = now
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      }
    } else if (timeframe === 'last year') {
      const start = new Date(now.getFullYear() - 1, 0, 1)
      const end = new Date(now.getFullYear() - 1, 11, 31)
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
      }
    }
    
    // Default to last month
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()
    const userId = (session.user as any).id

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Process query with NLP
    const nlp = new RuleBasedNLP()
    const nlpResult = nlp.parseQuery(query)

    // Execute SQL query if it's not a default query
    let queryResult = null
    let response = nlpResult.responseTemplate

    if (nlpResult.sqlQuery !== 'SELECT 1') {
      try {
        console.log('Generated SQL:', nlpResult.sqlQuery)
        // Execute the SQL query using Prisma raw query
        const rawResult = await prisma.$queryRawUnsafe(nlpResult.sqlQuery)
        console.log('Query result:', rawResult)
        
        if (Array.isArray(rawResult) && rawResult.length > 0) {
          const result = rawResult[0] as any
          
          if (result.sum !== undefined && result.category === undefined) {
            // Single value result (spending/savings analysis)
            queryResult = { amount: Math.abs(result.sum) }
            response = response.replace('${amount}', queryResult.amount.toFixed(2))
          } else if (result.budget_amount !== undefined && result.spent_amount !== undefined) {
            // Budget analysis result
            const remaining = result.budget_amount - result.spent_amount
            queryResult = { amount: remaining }
            response = response.replace('${amount}', remaining.toFixed(2))
          } else if (result.category !== undefined) {
            // Category breakdown result - process all results
            const breakdowns = rawResult.map((r: any) => {
              const categoryName = Array.isArray(r.category) ? r.category[0] : r.category
              return `${categoryName}: $${Math.abs(r.sum).toFixed(2)}`
            })
            queryResult = { breakdown: breakdowns.join(', ') }
            response = response.replace('{breakdown}', queryResult.breakdown)
          }
        }
      } catch (dbError) {
        console.error('Database query error:', dbError)
        response = "I couldn't retrieve that information right now. Please try again later."
      }
    }

    // Save conversation to database (optional)
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
      // Don't fail the request if conversation saving fails
    }

    return NextResponse.json({
      success: true,
      intent: nlpResult.intent,
      entities: nlpResult.entities,
      confidence: nlpResult.confidence,
      response,
      queryResult,
      suggestions: nlpResult.suggestions || [],
      method: 'rule_based'
    })

  } catch (error) {
    console.error('NLP API error:', error)
    return NextResponse.json(
      { error: 'Failed to process query', details: (error as Error).message },
      { status: 500 }
    )
  }
}
