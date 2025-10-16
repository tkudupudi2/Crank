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
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

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
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.merchantName && transaction.merchantName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesAccount = !selectedAccount || transaction.account.id === selectedAccount
    const matchesCategory = !selectedCategory || transaction.category.includes(selectedCategory)

    return matchesSearch && matchesAccount && matchesCategory
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
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
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
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
                    <div>
                      <p className="font-medium">
                        {transaction.merchantName || transaction.description}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <span>{transaction.account.name}</span>
                        {transaction.pending && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-600">Pending</span>
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
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
