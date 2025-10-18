'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import AccountConnection from './AccountConnection'

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
  date: Date
  account: {
    name: string
    type: string
  }
}

interface DashboardOverviewProps {
  accounts: Account[]
  netWorth: number
  creditCards: Account[]
  bankAccounts: Account[]
  recentTransactions: Transaction[]
}

export default function DashboardOverview({
  accounts,
  netWorth,
  creditCards,
  bankAccounts,
  recentTransactions,
}: DashboardOverviewProps) {
  const [showConnectMore, setShowConnectMore] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const creditCardBalance = creditCards.reduce((sum, card) => {
    return sum + (card.currentBalance || 0)
  }, 0)

  const bankAccountBalance = bankAccounts.reduce((sum, account) => {
    return sum + (account.currentBalance || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            {netWorth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-500" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(bankAccountBalance)}</div>
            <p className="text-xs text-muted-foreground">
              {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''} connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(creditCardBalance)}</div>
            <p className="text-xs text-muted-foreground">
              {creditCards.length} card{creditCards.length !== 1 ? 's' : ''} connected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connect More Accounts */}
      {accounts.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowConnectMore(!showConnectMore)}
            variant="outline"
            className="mb-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showConnectMore ? 'Hide' : 'Connect More'} Accounts
          </Button>
        </div>
      )}

      {showConnectMore && (
        <div className="mb-6">
          <AccountConnection compact />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Your linked bank accounts and credit cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.slice(0, 5).map((account) => (
                <div key={account.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.institutionName} •••• {account.mask}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(account.currentBalance || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {account.subtype || account.type}
                    </p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/dashboard/accounts">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Accounts
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest account activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {(() => {
                        // For credit cards: positive amounts (charges) are red, negative (payments) are green
                        // For bank accounts: positive amounts (deposits) are green, negative (withdrawals) are red
                        if (transaction.account.type === 'credit') {
                          return transaction.amount > 0 ? (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          )
                        } else {
                          return transaction.amount > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )
                        }
                      })()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.merchantName || transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM d')} • {transaction.account.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-sm ${
                      (() => {
                        // For credit cards: positive amounts (charges) are red, negative (payments) are green
                        // For bank accounts: positive amounts (deposits) are green, negative (withdrawals) are red
                        if (transaction.account.type === 'credit') {
                          return transaction.amount > 0 ? 'text-red-600' : 'text-green-600'
                        } else {
                          return transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }
                      })()
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    No recent transactions
                  </p>
                  <Link href="/dashboard/transactions">
                    <Button variant="outline" size="sm">
                      Sync Transactions
                    </Button>
                  </Link>
                </div>
              )}
              <div className="pt-2">
                <Link href="/dashboard/transactions">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Transactions
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
