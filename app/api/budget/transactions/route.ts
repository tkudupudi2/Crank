import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    let categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Decode URL-encoded characters
    categoryId = decodeURIComponent(categoryId)

    // Get user's budget preferences to determine date range
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: userId }
    })

    let startDate: Date
    let endDate: Date

    if (userPreferences?.budgetPreferences) {
      const prefs = userPreferences.budgetPreferences as any
      
          if (prefs.duration === 'custom' && prefs.customStartDate && prefs.customEndDate) {
            // Parse dates in local timezone for user-friendly date ranges
            startDate = new Date(prefs.customStartDate + 'T00:00:00')
            endDate = new Date(prefs.customEndDate + 'T23:59:59.999')
      } else if (prefs.duration === 'weekly') {
        // Get start of current week (Sunday)
        const now = new Date()
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
      } else if (prefs.duration === 'biweekly') {
        // Get start of current biweekly period (every other Monday)
        const now = new Date()
        const dayOfWeek = now.getDay()
        const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek // Monday is day 1
        const monday = new Date(now)
        monday.setDate(now.getDate() + daysToMonday)
        
        // Find which biweekly period we're in
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const daysSinceStart = Math.floor((monday.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
        const biweekNumber = Math.floor(daysSinceStart / 14)
        
        startDate = new Date(startOfYear)
        startDate.setDate(startOfYear.getDate() + (biweekNumber * 14))
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 13)
        endDate.setHours(23, 59, 59, 999)
      } else {
        // Default to current month
        const now = new Date()
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
      }
    } else {
      // Default to current month if no preferences
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
    }

    // Map category IDs to Plaid categories
    const categoryMapping: { [key: string]: string[] } = {
      'housing': ['Housing', 'Rent', 'Mortgage', 'Property Management', 'Real Estate'],
      'food-and-dining': ['Food and Dining', 'Restaurants', 'Fast Food', 'Groceries', 'Food'],
      'food-&-dining': ['Food and Dining', 'Restaurants', 'Fast Food', 'Groceries', 'Food'], // Legacy format
      'food-&amp;-dining': ['Food and Dining', 'Restaurants', 'Fast Food', 'Groceries', 'Food'], // URL encoded version
      'transportation': ['Transportation', 'Gas', 'Fuel', 'Uber', 'Lyft', 'Taxi', 'Airline'],
      'entertainment': ['Entertainment', 'Recreation', 'Sports', 'Movies', 'Theater', 'Gym', 'Fitness'],
      'shopping': ['Shopping', 'Retail', 'General Merchandise', 'Clothing', 'Electronics'],
      'utilities': ['Utilities', 'Electric', 'Water', 'Internet', 'Phone', 'Cable'],
      'healthcare': ['Healthcare', 'Medical', 'Pharmacy', 'Dental', 'Vision'],
      'insurance': ['Insurance', 'Auto Insurance', 'Health Insurance', 'Life Insurance'],
      'education': ['Education', 'Tuition', 'Books', 'School'],
      'other': ['Other', 'Miscellaneous', 'Personal Care', 'Business Services', 'General Merchandise', 'Service', 'Payment', 'Interest', 'Transfer', 'Deposit', 'Withdrawal']
    }

    // Also map by category name for better matching
    const categoryNameMapping: { [key: string]: string[] } = {
      'Housing': ['Housing', 'Rent', 'Mortgage', 'Property Management', 'Real Estate'],
      'Food & Dining': ['Food and Dining', 'Restaurants', 'Fast Food', 'Groceries', 'Food'],
      'Transportation': ['Transportation', 'Gas', 'Fuel', 'Uber', 'Lyft', 'Taxi', 'Airline'],
      'Entertainment': ['Entertainment', 'Recreation', 'Sports', 'Movies', 'Theater', 'Gym', 'Fitness'],
      'Shopping': ['Shopping', 'Retail', 'General Merchandise', 'Clothing', 'Electronics'],
      'Utilities': ['Utilities', 'Electric', 'Water', 'Internet', 'Phone', 'Cable'],
      'Healthcare': ['Healthcare', 'Medical', 'Pharmacy', 'Dental', 'Vision'],
      'Insurance': ['Insurance', 'Auto Insurance', 'Health Insurance', 'Life Insurance'],
      'Education': ['Education', 'Tuition', 'Books', 'School'],
      'Other': ['Other', 'Miscellaneous', 'Personal Care', 'Business Services', 'General Merchandise', 'Service', 'Payment', 'Interest', 'Transfer', 'Deposit', 'Withdrawal']
    }

    const plaidCategories = categoryMapping[categoryId] || categoryNameMapping[categoryId] || []
    
    console.log(`Fetching transactions for category: ${categoryId}`)
    console.log(`Plaid categories to match:`, plaidCategories)

    // Get all transactions for the date range first to debug
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        }
        // Include all transactions to see credit card activity
      },
      include: {
        account: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    console.log(`Found ${allTransactions.length} total transactions in date range ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    // Debug: Log all transactions to see what we have
    console.log('All transactions in date range:')
    allTransactions.forEach((tx: any, index: number) => {
      console.log(`${index + 1}. ${tx.merchantName || tx.description} - $${Math.abs(tx.amount)} - Categories: ${tx.category?.join(', ') || 'None'} - Account: ${tx.account?.name || 'Unknown'} - Date: ${tx.date.toISOString()}`)
    })

    // Filter transactions by category
    const transactions = allTransactions.filter((transaction: any) => {
      // Determine if this is a spending transaction based on account type and amount
      const isCreditCard = transaction.account?.type === 'credit'
      const isSpending = isCreditCard ? transaction.amount > 0 : transaction.amount < 0
      
      if (!isSpending) {
        return false
      }

      const transactionCategories = transaction.category || []
      
      // Check if any of the transaction categories match our target categories
      const categoryMatch = transactionCategories.some((cat: any) => 
        plaidCategories.some((plaidCat: any) => 
          cat.toLowerCase().includes(plaidCat.toLowerCase())
        )
      )

      // Check merchant name patterns
      const merchantName = transaction.merchantName?.toLowerCase() || ''
      let merchantMatch = false

      if (categoryId === 'food-and-dining' || categoryId === 'food-&-dining' || categoryId === 'food-&amp;-dining' || categoryId === 'Food & Dining') {
        merchantMatch = ['mcdonald', 'starbucks', 'restaurant', 'cafe', 'food', 'dining', 'subway', 'pizza', 'burger', 'taco', 'chicken', 'kfc', 'wendy', 'domino', 'papa'].some(keyword => 
          merchantName.includes(keyword)
        )
      } else if (categoryId === 'transportation' || categoryId === 'Transportation') {
        merchantMatch = ['uber', 'lyft', 'gas', 'fuel', 'taxi', 'airline'].some(keyword => 
          merchantName.includes(keyword)
        )
      } else if (categoryId === 'entertainment' || categoryId === 'Entertainment') {
        merchantMatch = ['gym', 'fitness', 'movie', 'theater', 'entertainment'].some(keyword => 
          merchantName.includes(keyword)
        )
      } else if (categoryId === 'shopping' || categoryId === 'Shopping') {
        merchantMatch = ['shop', 'store', 'retail', 'amazon', 'target', 'walmart'].some(keyword => 
          merchantName.includes(keyword)
        )
      } else if (categoryId === 'other' || categoryId === 'Other') {
        // For "Other" category, we want transactions that don't clearly fit other categories
        // Check if it matches any other specific category patterns
        const isFood = ['mcdonald', 'starbucks', 'restaurant', 'cafe', 'food', 'dining', 'subway', 'pizza', 'burger', 'taco', 'chicken', 'kfc', 'wendy', 'domino', 'papa'].some(keyword => 
          merchantName.includes(keyword)
        )
        const isTransport = ['uber', 'lyft', 'gas', 'fuel', 'taxi', 'airline'].some(keyword => 
          merchantName.includes(keyword)
        )
        const isEntertainment = ['gym', 'fitness', 'movie', 'theater', 'entertainment'].some(keyword => 
          merchantName.includes(keyword)
        )
        const isShopping = ['shop', 'store', 'retail', 'amazon', 'target', 'walmart'].some(keyword => 
          merchantName.includes(keyword)
        )
        
        // Only include if it doesn't match other specific categories
        merchantMatch = !isFood && !isTransport && !isEntertainment && !isShopping
      }

      return categoryMatch || merchantMatch
    })

    console.log(`Filtered to ${transactions.length} transactions for category ${categoryId}`)
    if (transactions.length > 0) {
      console.log('Sample transaction:', {
        merchant: transactions[0].merchantName,
        description: transactions[0].description,
        categories: transactions[0].category,
        amount: transactions[0].amount
      })
    }

    return NextResponse.json({
      success: true,
      data: transactions
    })

  } catch (error) {
    console.error('Error fetching category transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category transactions' },
      { status: 500 }
    )
  }
}
