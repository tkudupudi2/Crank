'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  Calendar,
  CreditCard,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'
import AddTransactionModal from './AddTransactionModal'
import DeleteTransactionModal from './DeleteTransactionModal'
import EditTransactionModal from './EditTransactionModal'

interface Account {
  id: string
  name: string
  type: string
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
  pending: boolean
  isManual: boolean
  // Location fields
  address?: string | null
  city?: string | null
  region?: string | null
  postalCode?: string | null
  country?: string | null
  storeNumber?: string | null
  account: Account
}

interface TransactionsListProps {
  transactions: Transaction[]
  accounts: Account[]
}

export default function TransactionsList({ transactions, accounts }: TransactionsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getDateRange = (range: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (range) {
      case 'last-1-week':
        const lastWeek = new Date(today)
        lastWeek.setDate(today.getDate() - 7)
        return { start: lastWeek, end: today }
      case 'last-2-weeks':
        const last2Weeks = new Date(today)
        last2Weeks.setDate(today.getDate() - 14)
        return { start: last2Weeks, end: today }
      case 'last-30-days':
        const last30Days = new Date(today)
        last30Days.setDate(today.getDate() - 30)
        return { start: last30Days, end: today }
      case 'last-3-months':
        const last3Months = new Date(today)
        last3Months.setMonth(today.getMonth() - 3)
        return { start: last3Months, end: today }
      case 'last-6-months':
        const last6Months = new Date(today)
        last6Months.setMonth(today.getMonth() - 6)
        return { start: last6Months, end: today }
      case 'last-year':
        const lastYear = new Date(today)
        lastYear.setFullYear(today.getFullYear() - 1)
        return { start: lastYear, end: today }
      case 'this-month':
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        return { start: thisMonth, end: today }
      case 'last-month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        return { start: lastMonth, end: lastMonthEnd }
      default:
        return null
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        setSyncResult({
          success: true,
          message: result.message || 'Transactions synced successfully'
        })
        // Refresh the page to show updated transactions
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setSyncResult({
          success: false,
          error: result.error || 'Failed to sync transactions'
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: 'Network error while syncing transactions'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDeleteTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDeleteModal(true)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowEditModal(true)
  }

  const handleTransactionDeleted = () => {
    router.refresh()
    setShowDeleteModal(false)
    setSelectedTransaction(null)
  }

  const handleTransactionUpdated = () => {
    router.refresh()
    setShowEditModal(false)
    setSelectedTransaction(null)
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = (transaction.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (transaction.merchantName && transaction.merchantName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesAccount = !selectedAccount || transaction.account.id === selectedAccount
    const matchesCategory = !selectedCategory || (transaction.category && transaction.category.includes(selectedCategory))
    
    // Date filtering
    let matchesDateRange = true
    if (selectedDateRange) {
      const dateRange = getDateRange(selectedDateRange)
      if (dateRange) {
        const transactionDate = new Date(transaction.date)
        matchesDateRange = transactionDate >= dateRange.start && transactionDate <= dateRange.end
      }
    }

    return matchesSearch && matchesAccount && matchesCategory && matchesDateRange
  })


  const categories = Array.from(new Set(transactions.flatMap(t => t.category)))

  const getCategoryIcon = (category: string) => {
    // You could expand this with more specific icons
    return CreditCard
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Food and Drink': 'text-green-600 bg-green-50',
      'Transportation': 'text-blue-600 bg-blue-50',
      'Shopping': 'text-purple-600 bg-purple-50',
      'Entertainment': 'text-pink-600 bg-pink-50',
      'Bills and Utilities': 'text-orange-600 bg-orange-50',
      'Healthcare': 'text-red-600 bg-red-50',
      'Travel': 'text-indigo-600 bg-indigo-50',
    }
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Use filters to find specific transactions
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowAddModal(true)}
                variant="default"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Transaction</span>
              </Button>
              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Transactions'}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All time</option>
                <option value="last-1-week">Last 1 week</option>
                <option value="last-2-weeks">Last 2 weeks</option>
                <option value="last-30-days">Last 30 days</option>
                <option value="last-3-months">Last 3 months</option>
                <option value="last-6-months">Last 6 months</option>
                <option value="last-year">Last year</option>
                <option value="this-month">This month</option>
                <option value="last-month">Last month</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Result Feedback */}
      {syncResult && (
        <div className={`p-4 border rounded-lg ${
          syncResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {syncResult.success ? (
              <>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium">Sync Successful</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium">Sync Failed</span>
              </>
            )}
          </div>
          <p className="text-sm mt-1">
            {syncResult.success ? syncResult.message : syncResult.error}
          </p>
        </div>
      )}

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                {filteredTransactions.length} of {transactions.length} transactions
                {(searchTerm || selectedAccount || selectedCategory || selectedDateRange) && (
                  <span className="ml-2 text-blue-600">(filtered)</span>
                )}
              </CardDescription>
            </div>
            {(searchTerm || selectedAccount || selectedCategory || selectedDateRange) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedAccount('')
                  setSelectedCategory('')
                  setSelectedDateRange('')
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {transactions.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground">
                    Connect your accounts to see your financial activity. Transactions are automatically synced when you visit this page.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or refresh the page to sync more recent transactions
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {transaction.account.type === 'credit' ? (
                        // For credit cards: positive amounts (charges) show red down arrow, negative (payments) show green up arrow
                        transaction.amount > 0 ? (
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-green-600" />
                        )
                      ) : (
                        // For bank accounts: positive amounts (deposits) show green up arrow, negative (withdrawals) show red down arrow
                        transaction.amount > 0 ? (
                          <ArrowUpRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        )
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {transaction.merchantName || transaction.description || 
                         (transaction.category && transaction.category.length > 0 
                          ? transaction.category[0] 
                          : 'Transaction')}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>
                          {transaction.date
                            ? format(new Date(transaction.date), 'MMM d, yyyy')
                            : (transaction as any).dateUtc
                            ? format(new Date((transaction as any).dateUtc), 'MMM d, yyyy')
                            : 'N/A'}
                        </span>
                        <span>•</span>
                        <span>{transaction.account.name}</span>
                        {transaction.pending && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-600">Pending</span>
                          </>
                        )}
                        {transaction.isManual && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600">Manual</span>
                          </>
                        )}
                      </div>
                      {transaction.category.length > 0 && (
                        <div className="flex space-x-1 mt-1">
                          {transaction.category.slice(0, 2).map((category) => (
                            <span
                              key={category}
                              className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Location information */}
                      {(transaction.city || transaction.region || transaction.address) && (
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <span>📍</span>
                          <span>
                            {[transaction.city, transaction.region].filter(Boolean).join(', ')}
                            {transaction.address && (
                              <span className="ml-1 text-gray-400">
                                • {transaction.address}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className={`font-semibold ${
                        // For credit cards: positive amounts (charges) are red, negative (payments) are green
                        // For bank accounts: positive amounts (deposits) are green, negative (withdrawals) are red
                        transaction.account.type === 'credit' 
                          ? (transaction.amount > 0 ? 'text-red-600' : 'text-green-600')
                          : (transaction.amount > 0 ? 'text-green-600' : 'text-red-600')
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit categories"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        accounts={accounts}
        onTransactionAdded={() => {
          router.refresh()
          setShowAddModal(false)
        }}
      />

      {/* Delete Transaction Modal */}
      <DeleteTransactionModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedTransaction(null)
        }}
        transaction={selectedTransaction}
        onTransactionDeleted={handleTransactionDeleted}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedTransaction(null)
        }}
        transaction={selectedTransaction}
        onTransactionUpdated={handleTransactionUpdated}
      />
    </div>
  )
}
