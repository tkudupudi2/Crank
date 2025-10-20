'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TrendingUp, TrendingDown, PieChart, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  amount: number
  description: string
  merchantName: string | null
  category: string[] | null
  date: Date
  isManual?: boolean
  account: {
    id: string
    type: string
  }
}

interface Account {
  id: string
  type: string
}

interface AnalyticsBlurbProps {
  transactions: Transaction[]
  accounts: Account[]
}

export default function AnalyticsBlurb({ transactions, accounts }: AnalyticsBlurbProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Calculate monthly spending (current month)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const currentMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const account = accounts.find(a => a.id === transaction.account.id)
    
    // Skip payment transactions (they're not spending)
    const isPayment = transaction.description?.toLowerCase().includes('payment') || 
                     transaction.category?.includes('Payment') ||
                     transaction.category?.includes('Transfer')
    
    if (isPayment) {
      return false
    }
    
    // Only include spending transactions
    let isSpending = false
    if (account) {
      if (account.type === 'depository' && transaction.amount < 0) {
        isSpending = true // Negative amounts are expenses for checking/savings
      } else if (account.type === 'credit' && transaction.amount > 0) {
        isSpending = true // Positive amounts are charges for credit cards
      }
    } else if ((transaction as any).isManual) {
      // Manual transactions are always expenses (negative amounts)
      isSpending = transaction.amount < 0
    }
    
    const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                          transactionDate.getFullYear() === currentYear
    
    return isSpending && isCurrentMonth
  })
  

  const monthlySpending = currentMonthTransactions.reduce((sum, transaction) => {
    return sum + Math.abs(transaction.amount)
  }, 0)

  // Calculate last month spending for comparison
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const lastMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const account = accounts.find(a => a.id === transaction.account.id)
    
    // Skip payment transactions (they're not spending)
    const isPayment = transaction.description?.toLowerCase().includes('payment') || 
                     transaction.category?.includes('Payment') ||
                     transaction.category?.includes('Transfer')
    
    if (isPayment) {
      return false
    }
    
    let isSpending = false
    if (account) {
      if (account.type === 'depository' && transaction.amount < 0) {
        isSpending = true
      } else if (account.type === 'credit' && transaction.amount > 0) {
        isSpending = true
      }
    } else if ((transaction as any).isManual) {
      // Manual transactions are always expenses (negative amounts)
      isSpending = transaction.amount < 0
    }
    
    return isSpending && 
           transactionDate.getMonth() === lastMonth && 
           transactionDate.getFullYear() === lastMonthYear
  })

  const lastMonthSpending = lastMonthTransactions.reduce((sum, transaction) => {
    return sum + Math.abs(transaction.amount)
  }, 0)

  // Calculate spending change
  const spendingChange = lastMonthSpending > 0 
    ? ((monthlySpending - lastMonthSpending) / lastMonthSpending) * 100 
    : 0

  // Get top spending category
  const categorySpending: { [key: string]: number } = {}
  
  currentMonthTransactions.forEach(transaction => {
    const category = transaction.category && transaction.category.length > 0 
      ? transaction.category[0] 
      : 'Other'
    
    categorySpending[category] = (categorySpending[category] || 0) + Math.abs(transaction.amount)
  })

  const topCategory = Object.entries(categorySpending).reduce((top, [category, amount]) => {
    return amount > top.amount ? { category, amount } : top
  }, { category: 'No spending', amount: 0 })

  // Get total transactions count
  const totalTransactions = transactions.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Spending Analytics
            </CardTitle>
            <CardDescription>
              Your financial insights at a glance
            </CardDescription>
          </div>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm">
              View Full Analytics
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Monthly Spending */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(monthlySpending)}</div>
            <div className="flex items-center space-x-1">
              {spendingChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <span className={`text-xs ${spendingChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {Math.abs(spendingChange).toFixed(1)}% vs last month
              </span>
            </div>
          </div>

          {/* Top Category */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Top Category</span>
            </div>
            <div className="text-lg font-semibold">{topCategory.category}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(topCategory.amount)} this month
            </div>
          </div>

          {/* Total Transactions */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Activity</span>
            </div>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <div className="text-sm text-muted-foreground">
              transactions tracked
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        {monthlySpending > 0 && (
          <div className="mt-4 p-3 bg-gray-50  rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 ">Quick Insight</span>
            </div>
            <p className="text-sm text-gray-600 ">
              You've spent {formatCurrency(monthlySpending)} this month, with {topCategory.category} being your largest expense category.
              {spendingChange > 0 ? (
                <span className="text-red-500"> Spending is up {spendingChange.toFixed(1)}% from last month.</span>
              ) : spendingChange < 0 ? (
                <span className="text-green-500"> Great job! Spending is down {Math.abs(spendingChange).toFixed(1)}% from last month.</span>
              ) : (
                <span> Spending is similar to last month.</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
