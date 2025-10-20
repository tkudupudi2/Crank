'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Plus, Calendar, DollarSign, Tag, CreditCard } from 'lucide-react'

interface Account {
  id: string
  name: string
  type: string
  mask: string | null
  institutionName: string
}

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: Account[]
  onTransactionAdded: () => void
}

const CATEGORIES = [
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
  'Other'
]

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'other', label: 'Other', icon: '📝' }
]

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  accounts, 
  onTransactionAdded 
}: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    categories: [] as string[],
    accountType: 'cash', // 'cash', 'existing', or 'other'
    selectedAccountId: '',
    customAccountName: ''
  })
  const [newCategory, setNewCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Amount must be greater than 0')
      }
      if (formData.categories.length === 0) {
        throw new Error('At least one category is required')
      }
      if (formData.accountType === 'existing' && !formData.selectedAccountId) {
        throw new Error('Please select an account')
      }
      if (formData.accountType === 'other' && !formData.customAccountName.trim()) {
        throw new Error('Custom account name is required')
      }

      const response = await fetch('/api/transactions/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          date: formData.date,
          categories: formData.categories,
          accountType: formData.accountType,
          accountId: formData.accountType === 'existing' ? formData.selectedAccountId : null,
          customAccountName: formData.accountType === 'other' ? formData.customAccountName.trim() : null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add transaction')
      }

      // Reset form
      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        categories: [],
        accountType: 'cash',
        selectedAccountId: '',
        customAccountName: ''
      })
      setNewCategory('')

      onTransactionAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Add Manual Transaction</CardTitle>
            <CardDescription>
              Add a transaction that wasn't captured automatically
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Categories *
              </label>
              
              {/* Current Categories */}
              {formData.categories.length === 0 ? (
                <p className="text-sm text-gray-500 italic mb-3">No categories selected (will default to "Other")</p>
              ) : (
                <div className="flex flex-wrap gap-2 mb-3">
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
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Category */}
              <div className="mb-3">
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
                  {CATEGORIES.filter(cat => !formData.categories.includes(cat)).map((category) => (
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
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex-shrink-0 mt-0.5"></div>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">No categories selected</p>
                      <p>This transaction will be categorized as "Other" if no categories are assigned.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Account Type *
              </label>
              <div className="space-y-2">
                {ACCOUNT_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="accountType"
                      value={type.value}
                      checked={formData.accountType === type.value}
                      onChange={(e) => handleInputChange('accountType', e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">{type.icon} {type.label}</span>
                  </label>
                ))}
                
                {/* Existing Account Option */}
                {accounts.length > 0 && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="accountType"
                      value="existing"
                      checked={formData.accountType === 'existing'}
                      onChange={(e) => handleInputChange('accountType', e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">🏦 Existing Account</span>
                  </label>
                )}
              </div>
            </div>

            {/* Existing Account Selection */}
            {formData.accountType === 'existing' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Account *
                </label>
                <select
                  value={formData.selectedAccountId}
                  onChange={(e) => handleInputChange('selectedAccountId', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Choose an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.institutionName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Account Name */}
            {formData.accountType === 'other' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Name *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Venmo, PayPal, Cash App"
                    value={formData.customAccountName}
                    onChange={(e) => handleInputChange('customAccountName', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
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
