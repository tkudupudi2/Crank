import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import MLNLPServices from '@/lib/ml-nlp-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Process query with ML-enhanced NLP
    const nlpResult = await MLNLPServices.processQuery(query, user.id, user.firstName)

    let queryResult = null
    let response = nlpResult.responseTemplate

    // Execute SQL query if not a simple SELECT 1
    if (nlpResult.sqlQuery !== 'SELECT 1') {
      try {
        console.log('Generated SQL:', nlpResult.sqlQuery)
        const rawResult = await prisma.$queryRawUnsafe(nlpResult.sqlQuery)
        console.log('Query result:', rawResult)
        
        if (Array.isArray(rawResult)) {
          if (rawResult.length > 0) {
            const result = rawResult[0] as any
            console.log('Raw result processing:', { 
              rawResultLength: rawResult.length, 
              intent: nlpResult.intent,
              hasSum: result.sum !== undefined,
              hasMerchantName: rawResult[0]?.merchantName !== undefined,
              hasPeriod1Total: result.period1_total !== undefined,
              resultKeys: Object.keys(result)
            })

            // Handle different result types
            if (result.sum !== undefined && result.category === undefined) {
              queryResult = { amount: Math.abs(result.sum) }
              response = response.replace('{amount}', `$${queryResult.amount.toFixed(2)}`)
            } else if (result.budget_amount !== undefined && result.spent_amount !== undefined) {
              const remaining = result.remaining_amount || (result.budget_amount - result.spent_amount)
              const spent = Math.abs(result.spent_amount)
              const budget = result.budget_amount
              const percentage = budget > 0 ? (spent / budget) * 100 : 0
              
              queryResult = { 
                amount: remaining,
                spent: spent,
                budget: budget,
                percentage: percentage
              }
              
              if (remaining >= 0) {
                response = response.replace('{amount}', `$${remaining.toFixed(2)}`)
              } else {
                response = `You've exceeded your budget by $${Math.abs(remaining).toFixed(2)}. You've spent $${spent.toFixed(2)} out of your $${budget.toFixed(2)} budget (${percentage.toFixed(1)}%).`
              }
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
            } else if (rawResult.length > 0 && nlpResult.intent === 'biggest_expenses') {
              // Handle biggest expenses results
              console.log('Processing biggest expenses:', { rawResultLength: rawResult.length, intent: nlpResult.intent })
              const expenses = rawResult.map((r: any, index: number) => {
                const date = new Date(r.date).toLocaleDateString()
                const merchant = r.merchantName || 'Unknown Merchant'
                const description = r.description ? ` (${r.description})` : ''
                return `${index + 1}. ${merchant}${description} - $${Math.abs(r.amount).toFixed(2)} on ${date}`
              })
              queryResult = { expenses: expenses.join('\n') }
              response = response.replace('{expenses}', queryResult.expenses)
              console.log('Biggest expenses response:', response)
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
            } else if (result.period1_total !== undefined && result.period2_total !== undefined) {
              // Handle comparison results
              const period1Amount = Math.abs(result.period1_total)
              const period2Amount = Math.abs(result.period2_total)
              const difference = Math.abs(result.difference)
              const percentageChange = result.percentage_change
              
              const comparison = `${nlpResult.entities.timeframe1}: $${period1Amount.toFixed(2)}\n${nlpResult.entities.timeframe2}: $${period2Amount.toFixed(2)}\n\nDifference: $${difference.toFixed(2)} (${percentageChange > 0 ? '+' : ''}${percentageChange}%)`
              queryResult = { comparison: comparison }
              response = response.replace('{comparison}', queryResult.comparison)
            } else if (result.month !== undefined) {
              // Handle trend results
              const trends = rawResult.map((r: any) => {
                const month = new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                return `${month}: $${Math.abs(r.total_spending).toFixed(2)} (${r.transaction_count} transactions)`
              })
              queryResult = { trend: trends.join('\n') }
              response = response.replace('{trend}', queryResult.trend)
            }
          } else {
            // Handle empty results gracefully
            response = getEmptyResultMessage(nlpResult.intent, nlpResult.entities)
          }
        }
      } catch (dbError: any) {
        console.error('Database query error:', dbError)
        response = "I couldn't retrieve that information right now. Please try again later."
      }
    }

    // Save conversation to database
    try {
      await prisma.conversation.create({
        data: {
          userId: user.id,
          query: query,
          intent: nlpResult.intent,
          entities: nlpResult.entities,
          response: response,
          confidence: nlpResult.confidence,
          method: nlpResult.method
        }
      })
    } catch (dbError) {
      console.error('Error saving conversation:', dbError)
      // Don't fail the request if conversation saving fails
    }

    return NextResponse.json({
      intent: nlpResult.intent,
      entities: nlpResult.entities,
      confidence: nlpResult.confidence,
      response: response,
      method: nlpResult.method,
      suggestions: getSuggestions(nlpResult.intent)
    })
  } catch (error) {
    console.error('NLP processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    )
  }
}

/**
 * Get appropriate message for empty results
 */
function getEmptyResultMessage(intent: string, entities: any): string {
  const category = entities.category
  const timeframe = entities.timeframe || 'this period'
  const merchant = entities.merchant
  const months = entities.months

  switch (intent) {
    case 'transaction_search':
      return `I didn't find any ${merchant ? merchant + ' ' : ''}transactions ${timeframe}.`
    case 'spending_analysis':
      return `You didn't spend anything on ${category ? category + ' ' : ''}${timeframe}.`
    case 'savings_analysis':
      return `You didn't save anything ${timeframe}.`
    case 'account_balance':
      return `I couldn't retrieve your account balance right now.`
    case 'trend_analysis':
      return `I don't have enough data to show ${category ? category + ' ' : ''}trends over the last ${months || 6} months.`
    case 'spending_comparison':
      return `I don't have enough data to compare your spending between ${entities.timeframe1} and ${entities.timeframe2}.`
    case 'category_breakdown':
      return `I don't have spending data for ${timeframe}.`
    default:
      return `I don't have any data for that query.`
  }
}

/**
 * Get contextual suggestions based on intent
 */
function getSuggestions(intent: string): string[] {
  const suggestions = {
    spending_analysis: [
      "What about groceries?",
      "How much did I spend on entertainment?",
      "Show me my dining expenses",
      "What's my transportation cost?"
    ],
    savings_analysis: [
      "How much did I save last month?",
      "What's my income this month?",
      "Show me my deposits"
    ],
    budget_analysis: [
      "What's my food budget status?",
      "How much is left in entertainment?",
      "Am I over budget this month?"
    ],
    category_breakdown: [
      "Breakdown by category",
      "Show spending distribution",
      "What categories do I spend most on?"
    ],
    transaction_search: [
      "Find my Starbucks purchases",
      "Show recent transactions",
      "Search for Amazon orders"
    ],
    account_balance: [
      "What's my checking balance?",
      "Show all account balances",
      "How much do I have total?"
    ],
    trend_analysis: [
      "Show monthly spending trend",
      "How has my spending changed?",
      "What's my spending pattern?"
    ],
    financial_insights: [
      "Give me financial insights",
      "How am I doing financially?",
      "What should I focus on?"
    ],
    unknown: [
      "How much did I spend last month?",
      "What's my account balance?",
      "Show me my recent transactions",
      "Breakdown my spending by category"
    ]
  }

  return suggestions[intent as keyof typeof suggestions] || suggestions.unknown
}
