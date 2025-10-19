import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Budget API - Starting request')
    
    const session = await getServerSession(authOptions)
    console.log('Budget API - Session:', session ? 'Found' : 'Not found')

    if (!(session?.user as any)?.id) {
      console.log('Budget API - No user ID in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    console.log('Budget API - User ID:', userId)

    // Get user preferences first to determine date range
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: userId }
    })

    // Calculate date range based on user preferences
    const now = new Date()
    let startDate: Date
    let endDate: Date
    let periodLabel: string

    console.log('Budget API - User preferences:', userPreferences)
    if (userPreferences?.budgetPreferences) {
      const prefs = userPreferences.budgetPreferences as any
      console.log('Budget API - Budget preferences:', prefs)
      console.log('Budget API - Duration:', prefs.duration)
      console.log('Budget API - Custom dates:', prefs.customStartDate, 'to', prefs.customEndDate)
      
          if (prefs.duration === 'custom' && prefs.customStartDate && prefs.customEndDate) {
            console.log('Budget API - Using custom date range')
            // Parse dates in local timezone for user-friendly date ranges
            startDate = new Date(prefs.customStartDate + 'T00:00:00')
            endDate = new Date(prefs.customEndDate + 'T23:59:59.999')
            periodLabel = `${prefs.customStartDate} to ${prefs.customEndDate}`
      } else if (prefs.duration === 'weekly') {
        // Get start of current week (Sunday)
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
            periodLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      } else if (prefs.duration === 'biweekly') {
        // Get start of current bi-week period (every 2 weeks starting from a fixed date)
        const biweekStart = new Date(2024, 0, 1) // January 1, 2024 as reference
        const daysDiff = Math.floor((now.getTime() - biweekStart.getTime()) / (1000 * 60 * 60 * 24))
        const biweekNumber = Math.floor(daysDiff / 14)
        startDate = new Date(biweekStart)
        startDate.setDate(biweekStart.getDate() + (biweekNumber * 14))
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 13)
        endDate.setHours(23, 59, 59, 999)
            periodLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      } else {
        console.log('Budget API - Using default monthly range (preferences found but not custom)')
        // Default to monthly
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })
      }
    } else {
      console.log('Budget API - Using default monthly range (no preferences found)')
      // Default to monthly if no preferences
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })
    }

    console.log('Budget API - Date range:', startDate, 'to', endDate)
    console.log('Budget API - Period label:', periodLabel)

    // Get all transactions for the calculated date range
    console.log('Budget API - Fetching transactions for date range:', startDate, 'to', endDate)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        }
        // Include all transactions, not just expenses
      },
      include: {
        account: true
      }
    })
    console.log('Budget API - Found transactions:', transactions.length)
    
    // Debug: Log first few transactions to see actual dates
    console.log('Budget API - Sample transactions with dates:')
    transactions.slice(0, 3).forEach((tx: any, index: number) => {
      console.log(`${index + 1}. ${tx.merchantName || tx.description} - Date: ${tx.date.toISOString()} - Amount: $${Math.abs(tx.amount)}`)
    })

    // Define budget categories and their mappings
    const budgetCategories = {
      'Housing': ['Housing', 'Rent', 'Mortgage', 'Property Management', 'Real Estate'],
      'Food & Dining': ['Food and Dining', 'Restaurants', 'Fast Food', 'Groceries', 'Food'],
      'Transportation': ['Transportation', 'Gas', 'Fuel', 'Uber', 'Lyft', 'Taxi', 'Airline'],
      'Entertainment': ['Entertainment', 'Recreation', 'Sports', 'Movies', 'Theater', 'Gym', 'Fitness'],
      'Shopping': ['Shopping', 'Retail', 'General Merchandise', 'Clothing', 'Electronics'],
      'Utilities': ['Utilities', 'Electric', 'Water', 'Internet', 'Phone', 'Cable'],
      'Healthcare': ['Healthcare', 'Medical', 'Pharmacy', 'Dental', 'Vision'],
      'Insurance': ['Insurance', 'Auto Insurance', 'Health Insurance', 'Life Insurance'],
      'Education': ['Education', 'Tuition', 'Books', 'School'],
      'Other': ['Other', 'Miscellaneous', 'Personal Care', 'Business Services']
    }

    // Calculate spending by category
    const categorySpending: { [key: string]: number } = {}
    const categoryColors: { [key: string]: string } = {
      'Housing': 'bg-blue-500',
      'Food & Dining': 'bg-green-500',
      'Transportation': 'bg-yellow-500',
      'Entertainment': 'bg-purple-500',
      'Shopping': 'bg-pink-500',
      'Utilities': 'bg-red-500',
      'Healthcare': 'bg-indigo-500',
      'Insurance': 'bg-orange-500',
      'Education': 'bg-teal-500',
      'Other': 'bg-gray-500'
    }

    // Initialize all categories
    Object.keys(budgetCategories).forEach(category => {
      categorySpending[category] = 0
    })

    // Categorize transactions
    transactions.forEach((transaction: any) => {
      const transactionCategories = transaction.category || []
      let categorized = false

      // Determine if this is a spending transaction based on account type and amount
      const isCreditCard = transaction.account?.type === 'credit'
      const isSpending = isCreditCard ? transaction.amount > 0 : transaction.amount < 0
      
      if (!isSpending) {
        return // Skip non-spending transactions
      }

      // Try to match transaction categories to budget categories
      for (const [budgetCategory, plaidCategories] of Object.entries(budgetCategories)) {
        if (transactionCategories.some((cat: any) => 
          plaidCategories.some((plaidCat: any) => 
            cat.toLowerCase().includes(plaidCat.toLowerCase())
          )
        )) {
          // For credit cards, positive amounts are purchases (spending)
          // For checking accounts, negative amounts are expenses (spending)
          const spendingAmount = isCreditCard ? transaction.amount : Math.abs(transaction.amount)
          categorySpending[budgetCategory] += spendingAmount
          categorized = true
          break
        }
      }

      // If not categorized, check merchant name
      if (!categorized && transaction.merchantName) {
        const merchantName = transaction.merchantName.toLowerCase()
        
        if (merchantName.includes('mcdonald') || merchantName.includes('starbucks') || 
            merchantName.includes('restaurant') || merchantName.includes('cafe')) {
          const spendingAmount = isCreditCard ? transaction.amount : Math.abs(transaction.amount)
          categorySpending['Food & Dining'] += spendingAmount
        } else if (merchantName.includes('uber') || merchantName.includes('lyft') || 
                   merchantName.includes('gas') || merchantName.includes('fuel')) {
          const spendingAmount = isCreditCard ? transaction.amount : Math.abs(transaction.amount)
          categorySpending['Transportation'] += spendingAmount
        } else if (merchantName.includes('gym') || merchantName.includes('fitness') || 
                   merchantName.includes('movie') || merchantName.includes('theater') ||
                   merchantName.includes('climbing')) {
          const spendingAmount = isCreditCard ? transaction.amount : Math.abs(transaction.amount)
          categorySpending['Entertainment'] += spendingAmount
        } else if (merchantName.includes('shop') || merchantName.includes('store') || 
                   merchantName.includes('retail')) {
          const spendingAmount = isCreditCard ? transaction.amount : Math.abs(transaction.amount)
          categorySpending['Shopping'] += spendingAmount
        } else {
          const spendingAmount = isCreditCard ? transaction.amount : Math.abs(transaction.amount)
          categorySpending['Other'] += spendingAmount
        }
      } else if (!categorized) {
        const spendingAmount = isCreditCard ? transaction.amount : Math.abs(transaction.amount)
        categorySpending['Other'] += spendingAmount
      }
    })

    // Calculate total spending
    const totalSpent = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)
    
    console.log('Budget API - Total transactions processed:', transactions.length)
    console.log('Budget API - Category spending breakdown:', categorySpending)
    console.log('Budget API - Total spent calculated:', totalSpent)

      // User preferences already fetched above for date range calculation
      console.log('Budget API - User preferences found:', userPreferences ? 'Yes' : 'No')

      // Parse JSON fields from user preferences
      const savedBudgets = userPreferences?.budgetCategoryBudgets as { [key: string]: number } || {}
      const savedColors = userPreferences?.budgetCategoryColors as { [key: string]: string } || {}

      // Create budget categories with spending data
      const budgetData = Object.entries(categorySpending).map(([name, spent]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
        name,
        budget: savedBudgets[name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')] || 0,
        spent: Math.round(spent * 100) / 100, // Round to 2 decimal places
        color: savedColors[name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')] || categoryColors[name]
      }))

    // Calculate suggested budgets based on spending patterns
    const suggestedBudgets = {
      'Housing': Math.max(categorySpending['Housing'] * 1.2, 2000), // 20% buffer
      'Food & Dining': Math.max(categorySpending['Food & Dining'] * 1.15, 500),
      'Transportation': Math.max(categorySpending['Transportation'] * 1.1, 300),
      'Entertainment': Math.max(categorySpending['Entertainment'] * 1.1, 200),
      'Shopping': Math.max(categorySpending['Shopping'] * 1.1, 150),
      'Utilities': Math.max(categorySpending['Utilities'] * 1.2, 200),
      'Healthcare': Math.max(categorySpending['Healthcare'] * 1.1, 100),
      'Insurance': Math.max(categorySpending['Insurance'] * 1.1, 100),
      'Education': Math.max(categorySpending['Education'] * 1.1, 50),
      'Other': Math.max(categorySpending['Other'] * 1.1, 100)
    }

    // Only apply suggested budgets if no user preferences exist
    if (!userPreferences || Object.keys(savedBudgets).length === 0) {
      budgetData.forEach(category => {
        if (category.budget === 0 && suggestedBudgets[category.name as keyof typeof suggestedBudgets]) {
          category.budget = Math.round(suggestedBudgets[category.name as keyof typeof suggestedBudgets] * 100) / 100
        }
      })
    }

    // Apply user's custom category order if available
    let sortedCategories = budgetData
    if (userPreferences?.budgetCategoryOrder) {
      const customOrder = userPreferences.budgetCategoryOrder
      sortedCategories = budgetData.sort((a, b) => {
        const aIndex = customOrder.indexOf(a.id)
        const bIndex = customOrder.indexOf(b.id)
        // If both categories are in custom order, sort by custom order
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex
        }
        // If only one is in custom order, prioritize it
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        // If neither is in custom order, sort by spending amount
        return b.spent - a.spent
      })
    } else {
      // Default sort by highest spent
      sortedCategories = budgetData.sort((a, b) => b.spent - a.spent)
    }

    // Parse budget preferences from user preferences
    const budgetPrefs = userPreferences?.budgetPreferences as any || {
      totalBudget: 0,
      duration: 'monthly',
      customStartDate: '',
      customEndDate: ''
    }

    // Use user's total budget preference if set, otherwise calculate from categories
    let totalBudget
    if (budgetPrefs?.totalBudget > 0) {
      totalBudget = budgetPrefs.totalBudget
      console.log('Budget API - Using user total budget:', totalBudget)
    } else {
      totalBudget = sortedCategories.reduce((sum, category) => sum + category.budget, 0)
      console.log('Budget API - Calculated total budget from categories:', totalBudget)
    }

      return NextResponse.json({
        success: true,
        data: {
          totalBudget: Math.round(totalBudget),
          totalSpent: Math.round(totalSpent * 100) / 100,
          remaining: Math.round((totalBudget - totalSpent) * 100) / 100,
          categories: sortedCategories,
          period: budgetPrefs?.duration || 'monthly',
          month: periodLabel,
          transactionCount: transactions.length,
          preferences: budgetPrefs,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        }
      })

  } catch (error) {
    console.error('Error fetching budget data:', error)
    console.error('Error details:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch budget data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
