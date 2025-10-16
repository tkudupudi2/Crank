'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreditCard, Calendar, DollarSign, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Account {
  id: string
  name: string
  type: string
  currentBalance: number | null
  mask: string | null
  institutionName: string
}

interface Payment {
  id: string
  amount: number
  description: string
  status: string
  dueDate: Date | null
  payDate: Date | null
  account: {
    name: string
    mask: string | null
  }
}

interface PaymentManagerProps {
  accounts: Account[]
  payments: Payment[]
}

export default function PaymentManager({ accounts, payments }: PaymentManagerProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const creditCards = accounts.filter(account => account.type === 'credit')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          amount: parseFloat(amount),
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      })

      if (response.ok) {
        // Reset form
        setSelectedAccount('')
        setAmount('')
        setDescription('')
        setDueDate('')
        setShowPaymentForm(false)
        // Refresh the page to show new payment
        window.location.reload()
      }
    } catch (error) {
      console.error('Error creating payment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Schedule Payment</CardTitle>
              <CardDescription>
                Create a new payment for your credit cards
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPaymentForm(!showPaymentForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showPaymentForm ? 'Cancel' : 'New Payment'}
            </Button>
          </div>
        </CardHeader>
        {showPaymentForm && (
          <CardContent>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select an account</option>
                  {creditCards.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (••••{account.mask})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  type="text"
                  placeholder="Payment description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Schedule Payment'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Payments</CardTitle>
          <CardDescription>
            Your upcoming and recent payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments scheduled</h3>
              <p className="text-muted-foreground">
                Create your first payment to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                    </div>
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.account.name} •••• {payment.account.mask}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    {payment.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                    {payment.payDate && (
                      <p className="text-sm text-muted-foreground">
                        Paid: {format(new Date(payment.payDate), 'MMM d, yyyy')}
                      </p>
                    )}
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
