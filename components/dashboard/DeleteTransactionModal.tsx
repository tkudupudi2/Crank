'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  amount: number
  description: string
  merchantName: string | null
  category: string[]
  date: Date
  pending: boolean
  isManual: boolean
  account: {
    id: string
    name: string
    type: string
    mask: string | null
    institutionName: string
  }
}

interface DeleteTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onTransactionDeleted: () => void
}

export default function DeleteTransactionModal({ 
  isOpen, 
  onClose, 
  transaction,
  onTransactionDeleted 
}: DeleteTransactionModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!transaction) return

    setError('')
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/transactions/delete?id=${transaction.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete transaction')
      }

      onTransactionDeleted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (!isOpen || !transaction) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-red-900">Delete Transaction</CardTitle>
              <CardDescription>
                This action cannot be undone
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            disabled={isDeleting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Transaction Details */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.merchantName || transaction.description}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transaction.account.name} • {transaction.account.institutionName}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.account.type === 'credit' 
                      ? (transaction.amount > 0 ? 'text-red-600' : 'text-green-600')
                      : (transaction.amount > 0 ? 'text-green-600' : 'text-red-600')
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                <div className="flex items-center space-x-2">
                  {transaction.category.length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {transaction.category[0]}
                    </span>
                  )}
                  {transaction.isManual && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      Manual
                    </span>
                  )}
                  {transaction.pending && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Are you sure you want to delete this transaction?</p>
                  <p className="mt-1">
                    {transaction.isManual 
                      ? "This will also update the account balance if it's a manual account."
                      : "This will permanently remove the transaction from your records."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Transaction
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
