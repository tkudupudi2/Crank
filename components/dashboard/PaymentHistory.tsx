'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CreditCard, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  Filter,
  RefreshCw
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  status: string
  paymentType: string
  description: string
  scheduledDate: string | null
  processedDate: string | null
  failureReason: string | null
  fromAccount: {
    name: string
    mask: string | null
    institutionName: string
  }
  toAccount: {
    name: string
    mask: string | null
    institutionName: string
  }
  createdAt: string
  updatedAt: string
}

interface PaymentHistoryProps {
  className?: string
}

export default function PaymentHistory({ className }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchPayments = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const url = statusFilter 
        ? `/api/payments?status=${statusFilter}&limit=20`
        : '/api/payments?limit=20'
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments)
      } else {
        setError(data.error || 'Failed to fetch payments')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [statusFilter])

  const handleCancelPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/cancel`, {
        method: 'PUT',
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh payments list
        fetchPayments(true)
      } else {
        alert(data.error || 'Failed to cancel payment')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment History</span>
            </CardTitle>
            <CardDescription>
              Track your credit card payments
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPayments(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading payments...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="ml-2 text-red-500">{error}</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payments found</p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter ? 'Try changing the status filter' : 'Create your first payment to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(payment.status)}
                      <div>
                        <div className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {payment.description || 'Payment'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <Building2 className="h-4 w-4" />
                          <span>From:</span>
                        </div>
                        <div className="font-medium">
                          {payment.fromAccount.name}
                        </div>
                        <div className="text-gray-500">
                          {payment.fromAccount.institutionName} •••• {payment.fromAccount.mask}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <CreditCard className="h-4 w-4" />
                          <span>To:</span>
                        </div>
                        <div className="font-medium">
                          {payment.toAccount.name}
                        </div>
                        <div className="text-gray-500">
                          {payment.toAccount.institutionName} •••• {payment.toAccount.mask}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-3">
                      {payment.scheduledDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Scheduled: {formatDate(payment.scheduledDate)}</span>
                        </div>
                      )}
                      {payment.processedDate && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Processed: {formatDate(payment.processedDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Created: {formatDate(payment.createdAt)}</span>
                      </div>
                    </div>

                    {payment.failureReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                        <strong>Failed:</strong> {payment.failureReason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>

                    {(payment.status === 'pending' || payment.status === 'processing') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelPayment(payment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
