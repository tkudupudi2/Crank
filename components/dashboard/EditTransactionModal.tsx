'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Plus, Minus, Edit3, Tag, DollarSign, Calendar } from 'lucide-react'
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
  // Location fields
  address?: string | null
  city?: string | null
  region?: string | null
  postalCode?: string | null
  country?: string | null
  storeNumber?: string | null
  account: {
    id: string
    name: string
    type: string
    mask: string | null
    institutionName: string
  }
}

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onTransactionUpdated: () => void
}

const AVAILABLE_CATEGORIES = [
  'Food and Drink',
  'Transportation', 
  'Shopping',
  'Entertainment',
  'Bills and Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Business Services',
  'Personal Care',
  'Gifts and Donations',
  'Investments',
  'Interest',
  'Payment',
  'Transfer',
  'Other'
]

export default function EditTransactionModal({ 
  isOpen, 
  onClose, 
  transaction,
  onTransactionUpdated 
}: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    categories: [] as string[]
  })
  const [newCategory, setNewCategory] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: Math.abs(transaction.amount).toString(), // Show positive amount for editing
        date: new Date(transaction.date).toISOString().split('T')[0],
        categories: [...transaction.category]
      })
      setNewCategory('')
      setError('')
    }
  }, [transaction])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // Clear error when user starts typing
  }

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim()
    if (trimmedCategory && !formData.categories.includes(trimmedCategory)) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, trimmedCategory]
      }))
      setNewCategory('')
    }
  }

  const handleRemoveCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove)
    }))
  }

  const handleAddPresetCategory = (category: string) => {
    if (!formData.categories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    setError('')
    setIsUpdating(true)

    try {
      // Validate form data
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Amount must be greater than 0')
      }
      if (!formData.date) {
        throw new Error('Date is required')
      }
      if (formData.categories.length === 0) {
        throw new Error('At least one category is required')
      }

      const response = await fetch('/api/transactions/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          date: formData.date,
          categories: formData.categories,
          isManual: transaction.isManual
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update transaction')
      }

      onTransactionUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsUpdating(false)
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
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Edit3 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Edit Transaction</CardTitle>
              <CardDescription>
                Update transaction categories
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            disabled={isUpdating}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Details Preview */}
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
              
              {/* Location information */}
              {(transaction.city || transaction.region || transaction.address) && (
                <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
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

            {/* Editable Fields - Only for Manual Transactions */}
            {transaction.isManual && (
              <>
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description *
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., Coffee at Starbucks"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount (Expense) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the amount you spent (will be recorded as negative)
                  </p>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Current Categories */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Current Categories
              </label>
              {formData.categories.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No categories assigned (will default to "Other")</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      <span>{category}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(category)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Category */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Add Custom Category
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter custom category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCategory()
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim() || formData.categories.includes(newCategory.trim())}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

              {/* Preset Categories */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quick Add Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_CATEGORIES.filter(cat => !formData.categories.includes(cat)).map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPresetCategory(category)}
                      className="justify-start text-left"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

            {/* Warning about Other category */}
            {formData.categories.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex-shrink-0 mt-0.5"></div>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">No categories selected</p>
                    <p>This transaction will be categorized as "Other" if no categories are assigned.</p>
                  </div>
                </div>
              </div>
            )}

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
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Update Categories
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
