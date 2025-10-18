'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreditCard, Home, GraduationCap, DollarSign, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'

interface Liability {
  accountId: string
  plaidAccountId: string
  accountName: string
  institutionName: string
  type: 'credit' | 'mortgage' | 'student'
  currentBalance: number
  availableBalance?: number
  limit?: number
  utilization?: number
  apr?: number
  isOverdue?: boolean
  lastPaymentAmount?: number
  lastPaymentDate?: string
  minimumPaymentAmount?: number
  nextPaymentDueDate?: string
  lastStatementBalance?: number
  lastStatementDate?: string
  nextMonthlyPayment?: number
  interestRatePercentage?: number
  interestRateType?: string
  // Mortgage specific
  originalBalance?: number
  escrowBalance?: number
  originalTerm?: number
  maturityDate?: string
  originationDate?: string
  originationPrincipalAmount?: number
  principalBalance?: number
  propertyAddress?: any
  ytdInterestPaid?: number
  ytdPrincipalPaid?: number
  // Student loan specific
  repaymentPlan?: string
  sequenceNumber?: number
  servicerAddress?: any
}

export default function LiabilitiesList() {
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchLiabilities = async () => {
      try {
        const response = await fetch('/api/plaid/liabilities')
        const data = await response.json()
        
        if (response.ok) {
          setLiabilities(data.liabilities)
          setMessage(data.message || '')
        } else {
          setError(data.error || 'Failed to fetch liabilities')
        }
      } catch (error) {
        setError('Failed to fetch liabilities')
      } finally {
        setLoading(false)
      }
    }

    fetchLiabilities()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getLiabilityIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <CreditCard className="h-5 w-5" />
      case 'mortgage':
        return <Home className="h-5 w-5" />
      case 'student':
        return <GraduationCap className="h-5 w-5" />
      default:
        return <DollarSign className="h-5 w-5" />
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 0.9) return 'text-red-600'
    if (utilization >= 0.7) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liabilities</CardTitle>
          <CardDescription>Loading your debt information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liabilities</CardTitle>
          <CardDescription>Error loading debt information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (liabilities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liabilities</CardTitle>
          <CardDescription>Debt and credit information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Additional Consent Required</h3>
            </div>
            <p className="text-blue-700 text-sm mb-2">
              To view your debt information (credit cards, loans, mortgages), you need to provide additional consent for the Liabilities product.
            </p>
            <p className="text-blue-600 text-xs">
              This feature requires production access to Plaid Liabilities. In sandbox mode, you can test the basic account connection and transaction features.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Liabilities</CardTitle>
          <CardDescription>Real-time debt information from your connected accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {liabilities.map((liability) => (
              <div key={liability.accountId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getLiabilityIcon(liability.type)}
                    <div>
                      <h3 className="font-semibold">{liability.accountName}</h3>
                      <p className="text-sm text-gray-600">{liability.institutionName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(liability.currentBalance)}</p>
                    {liability.type === 'credit' && liability.utilization && (
                      <p className={`text-sm ${getUtilizationColor(liability.utilization)}`}>
                        {Math.round(liability.utilization * 100)}% utilized
                      </p>
                    )}
                  </div>
                </div>

                {liability.type === 'credit' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {liability.availableBalance !== undefined && (
                      <div>
                        <p className="text-gray-600">Available Credit</p>
                        <p className="font-medium">{formatCurrency(liability.availableBalance)}</p>
                      </div>
                    )}
                    {liability.limit && (
                      <div>
                        <p className="text-gray-600">Credit Limit</p>
                        <p className="font-medium">{formatCurrency(liability.limit)}</p>
                      </div>
                    )}
                    {liability.minimumPaymentAmount && (
                      <div>
                        <p className="text-gray-600">Minimum Payment</p>
                        <p className="font-medium">{formatCurrency(liability.minimumPaymentAmount)}</p>
                      </div>
                    )}
                    {liability.nextPaymentDueDate && (
                      <div>
                        <p className="text-gray-600">Due Date</p>
                        <p className="font-medium">{formatDate(liability.nextPaymentDueDate)}</p>
                      </div>
                    )}
                  </div>
                )}

                {liability.type === 'mortgage' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {liability.originalBalance && (
                      <div>
                        <p className="text-gray-600">Original Balance</p>
                        <p className="font-medium">{formatCurrency(liability.originalBalance)}</p>
                      </div>
                    )}
                    {liability.principalBalance && (
                      <div>
                        <p className="text-gray-600">Principal Balance</p>
                        <p className="font-medium">{formatCurrency(liability.principalBalance)}</p>
                      </div>
                    )}
                    {liability.nextMonthlyPayment && (
                      <div>
                        <p className="text-gray-600">Monthly Payment</p>
                        <p className="font-medium">{formatCurrency(liability.nextMonthlyPayment)}</p>
                      </div>
                    )}
                    {liability.interestRatePercentage && (
                      <div>
                        <p className="text-gray-600">Interest Rate</p>
                        <p className="font-medium">{liability.interestRatePercentage}%</p>
                      </div>
                    )}
                  </div>
                )}

                {liability.type === 'student' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {liability.originalBalance && (
                      <div>
                        <p className="text-gray-600">Original Balance</p>
                        <p className="font-medium">{formatCurrency(liability.originalBalance)}</p>
                      </div>
                    )}
                    {liability.nextMonthlyPayment && (
                      <div>
                        <p className="text-gray-600">Monthly Payment</p>
                        <p className="font-medium">{formatCurrency(liability.nextMonthlyPayment)}</p>
                      </div>
                    )}
                    {liability.interestRatePercentage && (
                      <div>
                        <p className="text-gray-600">Interest Rate</p>
                        <p className="font-medium">{liability.interestRatePercentage}%</p>
                      </div>
                    )}
                    {liability.repaymentPlan && (
                      <div>
                        <p className="text-gray-600">Repayment Plan</p>
                        <p className="font-medium">{liability.repaymentPlan}</p>
                      </div>
                    )}
                  </div>
                )}

                {liability.isOverdue && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>This account is overdue</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
