'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PiggyBank,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Coffee,
  Gamepad2,
  Briefcase,
  Heart,
  BookOpen,
  Zap,
  Phone,
  Plane,
  Shirt,
  Dumbbell,
  Gift,
  X,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface Account {
  id: string
  name: string
  type: string
  subtype: string | null
  currentBalance: number | null
  availableBalance: number | null
  mask: string | null
  institutionName: string
}

interface Transaction {
  id: string
  amount: number
  description: string
  merchantName: string | null
  category: string[]
  date: Date
  account: {
    name: string
    type: string
  }
}

interface AnalyticsContentProps {
  accounts: Account[]
  transactions: Transaction[]
  monthlyTransactions: Transaction[]
}

export default function AnalyticsContent({ accounts, transactions, monthlyTransactions }: AnalyticsContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [timePeriod, setTimePeriod] = useState<'1w' | '30d' | '90d' | '1y'>('1w')
  const router = useRouter()
  
  // Filter transactions by time period
  const getFilteredTransactions = (period: string) => {
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '1w':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 90)
    }
    
    return transactions.filter(t => new Date(t.date) >= startDate)
  }
  
  const filteredTransactions = getFilteredTransactions(timePeriod)
  
  // Debug logging
  console.log('Analytics Debug:', {
    totalTransactions: transactions.length,
    filteredTransactions: filteredTransactions.length,
    timePeriod,
    accounts: accounts.length,
    sampleTransactions: transactions.slice(0, 3)
  })
  
  // Calculate balance metrics
  const creditCardBalance = accounts
    .filter(account => account.type === 'credit')
    .reduce((sum, account) => sum + (account.currentBalance || 0), 0)
  const bankAccountBalance = accounts
    .filter(account => account.type === 'depository')
    .reduce((sum, account) => sum + (account.currentBalance || 0), 0)
  
  // Total balance = only bank accounts (checking/savings)
  const totalBalance = bankAccountBalance
  
  // Net worth = bank accounts - credit card debt
  const netWorth = bankAccountBalance - creditCardBalance

  // Calculate spending metrics using filtered transactions
  // For depository accounts: negative amounts are expenses (spending)
  // For credit accounts: positive amounts are charges (spending)
  const totalSpending = filteredTransactions
    .filter(t => {
      const account = accounts.find(a => a.id === t.accountId)
      if (!account) return false
      
      if (account.type === 'depository') {
        return t.amount < 0 // Negative amounts are expenses for checking/savings
      } else if (account.type === 'credit') {
        return t.amount > 0 // Positive amounts are charges for credit cards
      }
      return false
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  // Calculate income (money coming in - only from bank accounts) using filtered transactions
  const totalIncome = filteredTransactions
    .filter(t => {
      const account = accounts.find(a => a.id === t.accountId)
      if (!account) return false
      
      // Only consider depository accounts (bank accounts) for income
      // Credit card transactions should not be counted as income
      return account.type === 'depository' && t.amount > 0
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // Calculate monthly spending trend
  const monthlySpending = monthlyTransactions.reduce((acc, transaction) => {
    const account = accounts.find(a => a.id === transaction.accountId)
    if (!account) return acc
    
    let isSpending = false
    if (account.type === 'depository' && transaction.amount < 0) {
      isSpending = true // Negative amounts are expenses for checking/savings
    } else if (account.type === 'credit' && transaction.amount > 0) {
      isSpending = true // Positive amounts are charges for credit cards
    }
    
    if (isSpending) {
      const month = new Date(transaction.date).toISOString().slice(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + Math.abs(transaction.amount)
    }
    return acc
  }, {} as Record<string, number>)

  const monthlyTrend = Object.entries(monthlySpending)
    .sort(([a], [b]) => b.localeCompare(a)) // Sort in descending order (latest first)
    .slice(0, 6) // First 6 months (most recent)

  // Enhanced categorization function
  const categorizeTransaction = (transaction: Transaction): string => {
    const description = transaction.description.toLowerCase()
    const merchantName = transaction.merchantName?.toLowerCase() || ''
    const category = transaction.category?.[0]?.toLowerCase() || ''
    
    // Check description and merchant name for keywords
    const searchText = `${description} ${merchantName} ${category}`
    
    // Bills & Services - Check this FIRST to catch payments before they match other categories
    if (searchText.includes('credit card') || searchText.includes('payment') ||
        searchText.includes('automatic payment') || searchText.includes('bill') ||
        searchText.includes('subscription') || searchText.includes('service') ||
        searchText.includes('insurance') || searchText.includes('loan')) {
      return 'Bills & Services'
    }
    
    // Food & Dining - Use regex to handle apostrophes and variations
    if (searchText.includes('restaurant') || searchText.includes('food') || 
        searchText.includes('grocery') || searchText.includes('cafe') ||
        searchText.includes('coffee') || searchText.includes('dining') ||
        searchText.includes('pizza') || searchText.includes('burger') ||
        /mcdonald['']?s?/i.test(searchText) || // Handle McDonald's, McDonalds, etc.
        searchText.includes('starbucks') || searchText.includes('subway') || 
        searchText.includes('kfc') || searchText.includes('chipotle') || 
        searchText.includes('taco bell') || searchText.includes('burger king') ||
        searchText.includes('wendy') || searchText.includes('domino') ||
        searchText.includes('pizza hut') || searchText.includes('panera')) {
      return 'Food & Dining'
    }
    
    // Transportation - Be more specific to avoid false matches
    if (searchText.includes('gas station') || searchText.includes('fuel') ||
        searchText.includes('uber') || searchText.includes('lyft') ||
        searchText.includes('taxi') || searchText.includes('parking') ||
        searchText.includes('automotive') || searchText.includes('car repair') ||
        searchText.includes('public transport') || searchText.includes('bus') ||
        searchText.includes('metro') || searchText.includes('train') ||
        searchText.includes('airport') || searchText.includes('toll')) {
      return 'Transportation'
    }
    
    // Shopping
    if (searchText.includes('amazon') || searchText.includes('walmart') ||
        searchText.includes('target') || searchText.includes('costco') ||
        searchText.includes('retail') || searchText.includes('store') ||
        searchText.includes('shopping') || searchText.includes('mall') ||
        searchText.includes('clothing') || searchText.includes('fashion') ||
        searchText.includes('nike') || searchText.includes('adidas')) {
      return 'Shopping'
    }
    
    // Entertainment
    if (searchText.includes('netflix') || searchText.includes('spotify') ||
        searchText.includes('movie') || searchText.includes('cinema') ||
        searchText.includes('game') || searchText.includes('entertainment') ||
        searchText.includes('recreation') || searchText.includes('sports') ||
        searchText.includes('gym') || searchText.includes('fitness') ||
        searchText.includes('youtube') || searchText.includes('disney')) {
      return 'Entertainment'
    }
    
    // Healthcare
    if (searchText.includes('medical') || searchText.includes('health') ||
        searchText.includes('doctor') || searchText.includes('hospital') ||
        searchText.includes('pharmacy') || searchText.includes('cvs') ||
        searchText.includes('walgreens') || searchText.includes('clinic')) {
      return 'Healthcare'
    }
    
    // Utilities
    if (searchText.includes('electric') || searchText.includes('gas bill') ||
        searchText.includes('water') || searchText.includes('internet') ||
        searchText.includes('phone') || searchText.includes('cable') ||
        searchText.includes('utility') || searchText.includes('at&t') ||
        searchText.includes('verizon') || searchText.includes('comcast')) {
      return 'Utilities'
    }
    
    // Travel
    if (searchText.includes('hotel') || searchText.includes('airline') ||
        searchText.includes('flight') || searchText.includes('travel') ||
        searchText.includes('airbnb') || searchText.includes('booking') ||
        searchText.includes('expedia') || searchText.includes('southwest') ||
        searchText.includes('united') || searchText.includes('delta')) {
      return 'Travel'
    }
    
    // Education
    if (searchText.includes('school') || searchText.includes('university') ||
        searchText.includes('education') || searchText.includes('tuition') ||
        searchText.includes('book') || searchText.includes('course')) {
      return 'Education'
    }
    
    // Use original category if it exists and is meaningful
    if (transaction.category?.[0] && transaction.category[0] !== 'Other') {
      return transaction.category[0]
    }
    
    return 'Other'
  }

  // Calculate spending by category with improved categorization using filtered transactions
  const categorySpending = filteredTransactions
    .filter(t => {
      const account = accounts.find(a => a.id === t.accountId)
      if (!account) return false
      
      if (account.type === 'depository') {
        return t.amount < 0 // Negative amounts are expenses for checking/savings
      } else if (account.type === 'credit') {
        return t.amount > 0 // Positive amounts are charges for credit cards
      }
      return false
    })
    .reduce((acc, transaction) => {
      const category = categorizeTransaction(transaction)
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount)
      return acc
    }, {} as Record<string, number>)

  const topCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) // Show top 10 categories

  // Prepare data for pie chart
  const pieChartData = topCategories.map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: ((amount / totalSpending) * 100).toFixed(1)
  }))

  // Define colors for pie chart - more distinguishable colors
  const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ]

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase()
    if (categoryLower.includes('food') || categoryLower.includes('dining')) {
      return Utensils
    } else if (categoryLower.includes('transportation')) {
      return Car
    } else if (categoryLower.includes('shopping')) {
      return ShoppingCart
    } else if (categoryLower.includes('entertainment')) {
      return Gamepad2
    } else if (categoryLower.includes('healthcare')) {
      return Heart
    } else if (categoryLower.includes('education')) {
      return BookOpen
    } else if (categoryLower.includes('utilities')) {
      return Zap
    } else if (categoryLower.includes('travel')) {
      return Plane
    } else if (categoryLower.includes('bills') || categoryLower.includes('services')) {
      return Phone
    } else if (categoryLower.includes('clothing') || categoryLower.includes('fashion')) {
      return Shirt
    } else if (categoryLower.includes('fitness') || categoryLower.includes('gym')) {
      return Dumbbell
    } else if (categoryLower.includes('gift') || categoryLower.includes('donation')) {
      return Gift
    } else {
      return Briefcase
    }
  }

  // Calculate spending by account
  const spendingByAccount = transactions
    .filter(t => {
      const account = accounts.find(a => a.id === t.accountId)
      if (!account) return false
      
      if (account.type === 'depository') {
        return t.amount < 0 // Negative amounts are expenses for checking/savings
      } else if (account.type === 'credit') {
        return t.amount > 0 // Positive amounts are charges for credit cards
      }
      return false
    })
    .reduce((acc, transaction) => {
      const accountName = transaction.account.name
      acc[accountName] = (acc[accountName] || 0) + Math.abs(transaction.amount)
      return acc
    }, {} as Record<string, number>)

  const accountSpending = Object.entries(spendingByAccount)
    .sort(([,a], [,b]) => b - a)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Handle category click
  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setIsModalOpen(true)
  }

  // Get transactions for selected category using filtered transactions
  const getTransactionsForCategory = (categoryName: string) => {
    return filteredTransactions.filter(transaction => {
      const account = accounts.find(a => a.id === transaction.accountId)
      if (!account) return false
      
      // Check if this is a spending transaction based on account type
      let isSpending = false
      if (account.type === 'depository' && transaction.amount < 0) {
        isSpending = true // Negative amounts are expenses for checking/savings
      } else if (account.type === 'credit' && transaction.amount > 0) {
        isSpending = true // Positive amounts are charges for credit cards
      }
      
      if (!isSpending) return false
      
      const transactionCategory = categorizeTransaction(transaction)
      return transactionCategory === categoryName
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Navigation functions
  const navigateToAccounts = () => {
    router.push('/dashboard/accounts')
  }

  const navigateToTransactions = () => {
    router.push('/dashboard/transactions')
  }

  // Get spending trend direction
  const getSpendingTrend = () => {
    if (monthlyTrend.length < 2) return 'stable'
    const recent = monthlyTrend.slice(-1)[0][1]
    const previous = monthlyTrend.slice(-2, -1)[0][1]
    return recent > previous ? 'up' : 'down'
  }

  const spendingTrend = getSpendingTrend()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={navigateToAccounts}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Bank accounts only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            {netWorth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              netWorth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(netWorth)}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets minus debts
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={navigateToTransactions}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpending)}</div>
            <p className="text-xs text-muted-foreground">
              {timePeriod === '1w' ? 'Last 7 days' :
               timePeriod === '30d' ? 'Last 30 days' :
               timePeriod === '90d' ? 'Last 90 days' :
               timePeriod === '1y' ? 'Last year' : 'Last 90 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {timePeriod === '1w' ? 'Last 7 days' :
               timePeriod === '30d' ? 'Last 30 days' :
               timePeriod === '90d' ? 'Last 90 days' :
               timePeriod === '1y' ? 'Last year' : 'Last 90 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            {totalIncome - totalSpending >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalIncome - totalSpending >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalIncome - totalSpending)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income minus spending
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category - Pie Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>
                  Where your money goes
                </CardDescription>
              </div>
              {/* Time Period Toggle */}
              <div className="flex space-x-1 bg-gray-100  rounded-lg p-1">
                {[
                  { key: '1w', label: '1W' },
                  { key: '30d', label: '30D' },
                  { key: '90d', label: '90D' },
                  { key: '1y', label: '1Y' }
                ].map((period) => (
                  <Button
                    key={period.key}
                    variant={timePeriod === period.key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimePeriod(period.key as any)}
                    className="h-8 px-3 text-xs"
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <div className="space-y-4">
                {/* Pie Chart */}
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name
                        ]}
                        labelFormatter={(label) => ''}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{
                          paddingTop: '20px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Category List */}
                <div className="grid grid-cols-1 gap-2">
                  {pieChartData.map((item, index) => {
                    const Icon = getCategoryIcon(item.name)
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleCategoryClick(item.name)}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50  hover:bg-gray-100  transition-colors cursor-pointer text-left w-full"
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="w-5 h-5 bg-gray-100  rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon className="h-3 w-3 text-gray-600 " />
                          </div>
                          <span className="text-sm font-medium truncate">{item.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium">{formatCurrency(item.value)}</p>
                          <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No spending data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Spending by Account and Monthly Trend */}
        <div className="space-y-6">
          {/* Spending by Account */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Account</CardTitle>
              <CardDescription>
                Which accounts you spend from most
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accountSpending.length > 0 ? (
                <div className="space-y-4">
                  {accountSpending.map(([accountName, amount]) => {
                    const percentage = (amount / totalSpending) * 100
                    
                    return (
                      <div key={accountName} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{accountName}</p>
                            <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatCurrency(amount)}</p>
                          <div className="w-20 bg-gray-200  rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No spending data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Spending Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>
                Your spending over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrend.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Trend:</span>
                      {spendingTrend === 'up' ? (
                        <div className="flex items-center space-x-1 text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">Increasing</span>
                        </div>
                      ) : spendingTrend === 'down' ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-sm">Decreasing</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Stable</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {monthlyTrend.map(([month, amount]) => {
                      const maxAmount = Math.max(...monthlyTrend.map(([,amt]) => amt))
                      const percentage = (amount / maxAmount) * 100
                      const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })
                      
                      return (
                        <div key={month} className="flex items-center justify-between">
                          <span className="text-sm font-medium w-16">{monthName}</span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200  rounded-full h-3">
                              <div 
                                className="bg-primary h-3 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium w-20 text-right">{formatCurrency(amount)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No spending trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {(() => {
                    const Icon = getCategoryIcon(selectedCategory)
                    return <Icon className="h-4 w-4 text-gray-600" />
                  })()}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedCategory} Transactions
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {(() => {
                const categoryTransactions = getTransactionsForCategory(selectedCategory)
                
                if (categoryTransactions.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions found in this category</p>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">
                        Total: {formatCurrency(categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0))}
                      </span>
                      <span className="text-sm text-gray-500">
                        {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {categoryTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            {transaction.amount < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.merchantName || transaction.description}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(transaction.date)}</span>
                              <span>•</span>
                              <span>{transaction.account.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          {transaction.pending && (
                            <p className="text-xs text-yellow-600">Pending</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
