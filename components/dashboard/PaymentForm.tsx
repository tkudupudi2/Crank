'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, Building2, DollarSign, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react'

interface BankAccount {
  id: string
  name: string
  subtype: string | null
  mask: string | null
  institutionName: string
  availableBalance: number
  currentBalance: number
  canPay: boolean
}

interface CreditCard {
  id: string
  name: string
  subtype: string | null
  mask: string | null
  institutionName: string
  currentBalance: number
  dueDate: string | null
  minimumPayment: number | null
  daysUntilDue: number | null
}

interface PaymentFormProps {
  creditCard: CreditCard
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentForm({ creditCard, onClose, onSuccess }: PaymentFormProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'minimum' | 'full_balance' | 'custom'>('minimum')
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Load eligible bank accounts
  useEffect(() => {
    const fetchEligibleAccounts = async () => {
      try {
        const response = await fetch('/api/payments/eligible-accounts')
        const data = await response.json()
        
        if (response.ok) {
          setBankAccounts(data.bankAccounts.filter((account: BankAccount) => account.canPay))
          
          // Auto-select first available account
          if (data.bankAccounts.filter((account: BankAccount) => account.canPay).length > 0) {
            setSelectedBankAccount(data.bankAccounts.filter((account: BankAccount) => account.canPay)[0].id)
          }
        } else {
          setError('Failed to load bank accounts')
        }
      } catch (error) {
        setError('Failed to load bank accounts')
      }
    }

    fetchEligibleAccounts()
  }, [])

  // Set default amount based on payment type
  useEffect(() => {
    if (paymentType === 'minimum' && creditCard.minimumPayment) {
      setAmount(creditCard.minimumPayment.toString())
    } else if (paymentType === 'full_balance') {
      setAmount(creditCard.currentBalance.toString())
    } else if (paymentType === 'custom') {
      setAmount('')
    }
  }, [paymentType, creditCard.minimumPayment, creditCard.currentBalance])

  // Set default scheduled date (next business day)
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Skip weekends
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1)
    }
    
    setScheduledDate(tomorrow.toISOString().split('T')[0])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedBankAccount) {
      setError('Please select a bank account')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccount)
    if (selectedAccount && parseFloat(amount) > selectedAccount.availableBalance) {
      setError('Insufficient funds in selected account')
      return
    }

    setIsSubmitting(true)

    try {
      // Create payment using mock payment system (since Payment Initiation requires production access)
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAccountId: selectedBankAccount,
          toAccountId: creditCard.id,
          amount: parseFloat(amount),
          description: description || `Payment to ${creditCard.name}`,
          paymentType: 'manual',
          scheduledDate: scheduledDate || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || 'Payment created successfully')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        setError(data.error || 'Failed to create payment')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccount)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Pay Credit Card</span>
            </CardTitle>
            <CardDescription>
              Paying {creditCard.name} •••• {creditCard.mask}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Credit Card Info */}
            <div className="bg-gray-50  p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Credit Card Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Balance:</span>
                  <div className="font-semibold">{formatCurrency(creditCard.currentBalance)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Due Date:</span>
                  <div className="font-semibold">
                    {creditCard.dueDate 
                      ? new Date(creditCard.dueDate).toLocaleDateString()
                      : 'Not set'
                    }
                    {creditCard.daysUntilDue !== null && (
                      <span className={`ml-2 text-xs ${
                        creditCard.daysUntilDue <= 3 ? 'text-red-600' : 
                        creditCard.daysUntilDue <= 7 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        ({creditCard.daysUntilDue} days)
                      </span>
                    )}
                  </div>
                </div>
                {creditCard.minimumPayment && (
                  <div>
                    <span className="text-muted-foreground">Minimum Payment:</span>
                    <div className="font-semibold">{formatCurrency(creditCard.minimumPayment)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'minimum', label: 'Minimum', icon: DollarSign },
                  { key: 'full_balance', label: 'Full Balance', icon: CreditCard },
                  { key: 'custom', label: 'Custom', icon: Calendar },
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    type="button"
                    variant={paymentType === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentType(key as any)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Bank Account Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Pay From</label>
              <div className="space-y-2">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBankAccount === account.id
                        ? 'border-blue-500 bg-blue-50 '
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBankAccount(account.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {account.institutionName} •••• {account.mask}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(account.availableBalance)}
                        </div>
                        <div className="text-xs text-muted-foreground">available</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedAccount?.availableBalance || creditCard.currentBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              {selectedAccount && (
                <div className="text-xs text-muted-foreground mt-1">
                  Available: {formatCurrency(selectedAccount.availableBalance)}
                </div>
              )}
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment description"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span>{success}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !selectedBankAccount || !amount}
              >
                {isSubmitting ? 'Creating Payment...' : 'Create Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
