'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  PieChart,
  RefreshCw,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Settings,
  Calendar
} from 'lucide-react'

interface BudgetCategory {
  id: string
  name: string
  budget: number
  spent: number
  color: string
}

interface BudgetData {
  totalBudget: number
  totalSpent: number
  remaining: number
  categories: BudgetCategory[]
  period: string
  month: string
  transactionCount: number
}

export default function BudgetPage() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [categoryBudgets, setCategoryBudgets] = useState<{ [key: string]: number }>({})
  const [categoryColors, setCategoryColors] = useState<{ [key: string]: string }>({})
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [showBudgetEditor, setShowBudgetEditor] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [categoryTransactions, setCategoryTransactions] = useState<{ [key: string]: any[] }>({})
  const [showPreferencesEditor, setShowPreferencesEditor] = useState(false)
  const [budgetPreferences, setBudgetPreferences] = useState({
    totalBudget: 0,
    duration: 'monthly' as 'weekly' | 'biweekly' | 'monthly' | 'custom',
    customStartDate: '',
    customEndDate: ''
  })

  // Fetch budget data from API
  const fetchBudgetData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/budget')
      const result = await response.json()
      
      if (result.success) {
        setBudgetData(result.data)
        
        // Update category budgets from API response
        const updatedBudgets: { [key: string]: number } = {}
        const updatedColors: { [key: string]: string } = {}
        const updatedOrder: string[] = []
        
        result.data.categories.forEach((category: any) => {
          updatedBudgets[category.id] = category.budget
          updatedColors[category.id] = category.color
          updatedOrder.push(category.id)
        })
        
        setCategoryBudgets(updatedBudgets)
        setCategoryColors(updatedColors)
        setCategoryOrder(updatedOrder)
        
        // Set budget preferences if available
        if (result.data.preferences) {
          setBudgetPreferences(result.data.preferences)
        }
      } else {
        setError(result.error || 'Failed to fetch budget data')
      }
    } catch (err) {
      setError('Failed to fetch budget data')
      console.error('Error fetching budget data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgetData()
  }, [])


  const handleCategoryBudgetUpdate = (categoryId: string, newBudget: number) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [categoryId]: newBudget
    }))
  }

    const saveCategoryBudget = async (categoryId: string) => {
      try {
        // Save to database
        await fetch('/api/budget/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categoryOrder,
            categoryBudgets,
            categoryColors
          })
        })
        
        console.log(`Saved budget for category ${categoryId}: $${categoryBudgets[categoryId]}`)
        setEditingCategory(null)
      } catch (error) {
        console.error('Error saving budget preferences:', error)
        // Still close the modal even if save fails
        setEditingCategory(null)
      }
    }

    const saveBudgetPreferences = async () => {
      try {
        // Save budget preferences
        await fetch('/api/budget/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(budgetPreferences)
        })

        // Save category budgets and other preferences
        await fetch('/api/budget/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categoryOrder,
            categoryBudgets,
            categoryColors
          })
        })
        
        console.log('Saved budget preferences and category budgets')
        setShowPreferencesEditor(false)
        // Refresh budget data to apply new preferences
        fetchBudgetData()
      } catch (error) {
        console.error('Error saving budget preferences:', error)
        // Still close the modal even if save fails
        setShowPreferencesEditor(false)
      }
    }

  const handleColorChange = (categoryId: string, newColor: string) => {
    setCategoryColors(prev => ({
      ...prev,
      [categoryId]: newColor
    }))
  }

  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categoryOrder.indexOf(categoryId)
    if (currentIndex === -1) return

    const newOrder = [...categoryOrder]
    if (direction === 'up' && currentIndex > 0) {
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]]
    } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]]
    }
    setCategoryOrder(newOrder)
  }

  const getSortedCategories = () => {
    if (!budgetData) return []
    return categoryOrder
      .map(id => budgetData.categories.find(cat => cat.id === id))
      .filter(Boolean) as BudgetCategory[]
  }

  const fetchCategoryTransactions = async (categoryId: string) => {
    if (categoryTransactions[categoryId]) return // Already fetched

    try {
      const response = await fetch(`/api/budget/transactions?categoryId=${categoryId}`)
      const result = await response.json()
      
      if (result.success) {
        setCategoryTransactions(prev => ({
          ...prev,
          [categoryId]: result.data
        }))
      }
    } catch (error) {
      console.error('Error fetching category transactions:', error)
    }
  }

  const toggleCategoryExpansion = async (categoryId: string) => {
    const isExpanded = expandedCategories.has(categoryId)
    
    if (isExpanded) {
      // Collapse
      setExpandedCategories(prev => {
        const newSet = new Set(prev)
        newSet.delete(categoryId)
        return newSet
      })
    } else {
      // Expand - fetch transactions if not already loaded
      await fetchCategoryTransactions(categoryId)
      setExpandedCategories(prev => new Set(prev).add(categoryId))
    }
  }

  const getTotalBudget = () => {
    if (!budgetData) return 0
    // Always use the total budget preference if it's set, otherwise calculate from categories
    return budgetPreferences.totalBudget > 0 ? budgetPreferences.totalBudget : Object.values(categoryBudgets).reduce((sum, budget) => sum + budget, 0)
  }

  const getRemainingBudget = () => getTotalBudget() - (budgetData?.totalSpent || 0)
  const getBudgetPercentage = () => {
    if (!budgetData || getTotalBudget() === 0) return 0
    return (budgetData.totalSpent / getTotalBudget()) * 100
  }
  const getCategoryPercentage = (category: BudgetCategory) => (category.spent / category.budget) * 100

  const totalCategoryBudgets = Object.values(categoryBudgets).reduce((sum, budget) => sum + budget, 0)

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <AlertCircle className="h-4 w-4" />
    if (percentage >= 80) return <AlertCircle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your budget data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBudgetData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!budgetData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Target className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No budget data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Budget Tracking</h1>
                <p className="text-gray-600 mt-2">
                  Monitor your spending and stay on track with your financial goals
                  {budgetData.period && ` • ${budgetData.period}`}
                </p>
                {budgetData.transactionCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Based on {budgetData.transactionCount} transactions in this {budgetData.period || 'period'}
                  </p>
                )}
                {budgetData.dateRange && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(budgetData.dateRange.start).toLocaleDateString()} - {new Date(budgetData.dateRange.end).toLocaleDateString()}
                  </p>
                )}
              </div>
        <div className="flex space-x-2">
          <Button onClick={fetchBudgetData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowPreferencesEditor(true)} className="bg-blue-600 hover:bg-blue-700">
            <Settings className="h-4 w-4 mr-2" />
            Edit Preferences
          </Button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalBudget().toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetData.totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(getBudgetPercentage())}`}>
              ${getRemainingBudget().toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">
                    {budgetData.period === 'weekly' ? 'Weekly' :
                     budgetData.period === 'biweekly' ? 'Bi-weekly' :
                     budgetData.period === 'monthly' ? 'Monthly' : 'Custom'} Budget
                  </CardTitle>
                  <CardDescription>
                    {budgetData.month || budgetData.period} budget based on your transaction history
                  </CardDescription>
                </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowBudgetEditor(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overall Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {getBudgetPercentage().toFixed(1)}% used
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  getBudgetPercentage() >= 100 ? 'bg-red-500' :
                  getBudgetPercentage() >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(getBudgetPercentage(), 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>${budgetData.totalSpent.toLocaleString()} spent</span>
              <span>${getTotalBudget().toLocaleString()} budgeted</span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Spending Categories</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddCategory(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid gap-4">
              {getSortedCategories()
                .filter(category => category.spent > 0 || categoryBudgets[category.id] > 0)
                .map((category) => {
                  const isExpanded = expandedCategories.has(category.id)
                  const transactions = categoryTransactions[category.id] || []
                  
                  return (
                    <div key={category.id} className="border rounded-lg p-4">
                      <div 
                        className="flex justify-between items-center mb-3 cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2"
                        onClick={() => toggleCategoryExpansion(category.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                            <div className={`w-4 h-4 rounded-full ${categoryColors[category.id] || category.color}`}></div>
                          </div>
                          <span className="font-medium">{category.name}</span>
                          <div className={`flex items-center space-x-1 ${getStatusColor((category.spent / (categoryBudgets[category.id] || category.budget)) * 100)}`}>
                            {getStatusIcon((category.spent / (categoryBudgets[category.id] || category.budget)) * 100)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            ${category.spent.toLocaleString()} / ${categoryBudgets[category.id]?.toLocaleString() || category.budget.toLocaleString()}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingCategory(category)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                  
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${categoryColors[category.id] || category.color}`}
                          style={{ width: `${Math.min((category.spent / (categoryBudgets[category.id] || category.budget)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{((category.spent / (categoryBudgets[category.id] || category.budget)) * 100).toFixed(1)}% used</span>
                        <span>${((categoryBudgets[category.id] || category.budget) - category.spent).toLocaleString()} remaining</span>
                      </div>

                      {/* Transactions List */}
                      {isExpanded && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Transactions ({transactions.length})
                          </h4>
                          {transactions.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {transactions.map((transaction, index) => (
                                <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {transaction.merchantName || transaction.description}
                                    </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(transaction.date).toLocaleDateString()} • {transaction.account?.name || 'Unknown Account'}
                                        </div>
                                  </div>
                                  <div className="text-sm font-medium text-red-600">
                                    -${Math.abs(transaction.amount).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <p className="text-sm">No transactions found for this category</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>

            {budgetData.categories.filter(category => category.spent > 0 || category.budget > 0).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No spending data available for this month</p>
                <p className="text-sm">Connect your accounts to see budget insights</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Editor Modal */}
      {showBudgetEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Budget Categories</CardTitle>
              <CardDescription>Customize your budget categories, colors, and order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSortedCategories().map((category, index) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveCategory(category.id, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveCategory(category.id, 'down')}
                          disabled={index === getSortedCategories().length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="font-medium text-lg">{category.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${category.spent.toLocaleString()} spent
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Budget Amount</label>
                      <Input
                        type="number"
                        value={categoryBudgets[category.id] || category.budget}
                        onChange={(e) => handleCategoryBudgetUpdate(category.id, parseFloat(e.target.value) || 0)}
                        placeholder="Enter budget amount"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Color</label>
                      <div className="flex space-x-2">
                        {[
                          'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
                          'bg-pink-500', 'bg-red-500', 'bg-indigo-500', 'bg-orange-500',
                          'bg-teal-500', 'bg-gray-500', 'bg-cyan-500', 'bg-emerald-500'
                        ].map((color) => (
                          <div
                            key={color}
                            className={`w-8 h-8 rounded-full ${color} cursor-pointer border-2 ${
                              (categoryColors[category.id] || category.color) === color 
                                ? 'border-gray-800' 
                                : 'border-transparent hover:border-gray-400'
                            }`}
                            onClick={() => handleColorChange(category.id, color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Remaining: ${((categoryBudgets[category.id] || category.budget) - category.spent).toLocaleString()}</span>
                      <span>Usage: {((category.spent / (categoryBudgets[category.id] || category.budget)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
              
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      className="flex-1"
                      onClick={async () => {
                        try {
                          // Save to database
                          await fetch('/api/budget/categories', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              categoryOrder,
                              categoryBudgets,
                              categoryColors
                            })
                          })
                          
                          console.log('Saved budget preferences')
                          setShowBudgetEditor(false)
                        } catch (error) {
                          console.error('Error saving budget preferences:', error)
                          // Still close the modal even if save fails
                          setShowBudgetEditor(false)
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowBudgetEditor(false)}
                    >
                      Cancel
                    </Button>
                  </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit {editingCategory.name} Budget</CardTitle>
              <CardDescription>Update the budget amount for this category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Spending</label>
                <div className="p-2 bg-gray-100 rounded-md text-sm">
                  ${editingCategory.spent.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Budget Amount</label>
                <Input 
                  type="number" 
                  value={categoryBudgets[editingCategory.id] || editingCategory.budget}
                  onChange={(e) => handleCategoryBudgetUpdate(editingCategory.id, parseFloat(e.target.value) || 0)}
                  placeholder="Enter budget amount"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Remaining: ${((categoryBudgets[editingCategory.id] || editingCategory.budget) - editingCategory.spent).toLocaleString()}</p>
                <p>Usage: {((editingCategory.spent / (categoryBudgets[editingCategory.id] || editingCategory.budget)) * 100).toFixed(1)}%</p>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button 
                  className="flex-1" 
                  onClick={() => saveCategoryBudget(editingCategory.id)}
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setEditingCategory(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Preferences Editor Modal */}
      {showPreferencesEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Budget Preferences
              </CardTitle>
              <CardDescription>
                Configure your budget settings including total budget and duration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Budget */}
              <div>
                <label className="text-sm font-medium mb-2 block">Total Budget</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={budgetPreferences.totalBudget === 0 ? '' : budgetPreferences.totalBudget}
                    onChange={(e) => {
                      const value = e.target.value
                      setBudgetPreferences(prev => ({
                        ...prev,
                        totalBudget: value === '' ? 0 : parseFloat(value) || 0
                      }))
                    }}
                    placeholder="Enter your total budget amount"
                    className="flex-1"
                  />
                  {budgetPreferences.totalBudget > 0 && budgetData && budgetData.categories.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Distribute total budget proportionally based on current spending
                        const totalSpent = budgetData.categories.reduce((sum, cat) => sum + cat.spent, 0)
                        const newBudgets: { [key: string]: number } = {}
                        
                        budgetData.categories.forEach(category => {
                          if (totalSpent > 0) {
                            // Distribute proportionally based on spending
                            const proportion = category.spent / totalSpent
                            newBudgets[category.id] = Math.round(budgetPreferences.totalBudget * proportion * 100) / 100
                          } else {
                            // If no spending, distribute equally
                            newBudgets[category.id] = Math.round(budgetPreferences.totalBudget / budgetData.categories.length * 100) / 100
                          }
                        })
                        
                        setCategoryBudgets(newBudgets)
                      }}
                    >
                      Distribute
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will be distributed across your spending categories
                </p>
              </div>

              {/* Budget Duration */}
              <div>
                <label className="text-sm font-medium mb-2 block">Budget Duration</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'biweekly', label: 'Bi-weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'custom', label: 'Custom Range' }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={budgetPreferences.duration === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBudgetPreferences(prev => ({
                        ...prev,
                        duration: option.value as any
                      }))}
                      className="justify-start"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              {budgetPreferences.duration === 'custom' && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Custom Date Range
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <Input
                        type="date"
                        value={budgetPreferences.customStartDate}
                        onChange={(e) => setBudgetPreferences(prev => ({
                          ...prev,
                          customStartDate: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Input
                        type="date"
                        value={budgetPreferences.customEndDate}
                        onChange={(e) => setBudgetPreferences(prev => ({
                          ...prev,
                          customEndDate: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category Budgets */}
              {budgetData && budgetData.categories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Category Budgets</h3>
                  <div className="space-y-3">
                    {budgetData.categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${categoryColors[category.id] || category.color}`}></div>
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-gray-500">
                            (Spent: ${category.spent.toLocaleString()})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={categoryBudgets[category.id] === 0 ? '' : categoryBudgets[category.id]}
                            onChange={(e) => {
                              const value = e.target.value
                              handleCategoryBudgetUpdate(category.id, value === '' ? 0 : parseFloat(value) || 0)
                            }}
                            placeholder="0"
                            className="w-24 text-right"
                          />
                          <span className="text-sm text-gray-500">$</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-4 p-3 border rounded-lg ${totalCategoryBudgets > budgetPreferences.totalBudget && budgetPreferences.totalBudget > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Category Budgets:</span>
                      <span className={`font-semibold ${totalCategoryBudgets > budgetPreferences.totalBudget && budgetPreferences.totalBudget > 0 ? 'text-red-600' : ''}`}>
                        ${totalCategoryBudgets.toLocaleString()}
                      </span>
                    </div>
                    {totalCategoryBudgets > budgetPreferences.totalBudget && budgetPreferences.totalBudget > 0 && (
                      <div className="mt-2 space-y-2">
                        <div className="text-sm text-red-600">
                          ⚠️ Category budgets exceed total budget by ${(totalCategoryBudgets - budgetPreferences.totalBudget).toLocaleString()}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Proportionally scale down all category budgets to fit within total budget
                            const scaleFactor = budgetPreferences.totalBudget / totalCategoryBudgets
                            const normalizedBudgets: { [key: string]: number } = {}
                            
                            Object.entries(categoryBudgets).forEach(([categoryId, budget]) => {
                              normalizedBudgets[categoryId] = Math.round(budget * scaleFactor * 100) / 100
                            })
                            
                            setCategoryBudgets(normalizedBudgets)
                          }}
                          className="text-xs"
                        >
                          Normalize to ${budgetPreferences.totalBudget.toLocaleString()}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Current Budget Summary */}
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Current Budget Summary</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Total Budget:</strong> ${budgetPreferences.totalBudget > 0 ? budgetPreferences.totalBudget.toLocaleString() : 'Not set'}</p>
                  <p><strong>Duration:</strong> {budgetPreferences.duration.charAt(0).toUpperCase() + budgetPreferences.duration.slice(1)}</p>
                  {budgetPreferences.duration === 'custom' && budgetPreferences.customStartDate && budgetPreferences.customEndDate && (
                    <p><strong>Period:</strong> {budgetPreferences.customStartDate} to {budgetPreferences.customEndDate}</p>
                  )}
                </div>
              </div>

                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      className="flex-1"
                      onClick={saveBudgetPreferences}
                      disabled={totalCategoryBudgets > budgetPreferences.totalBudget && budgetPreferences.totalBudget > 0}
                    >
                      {totalCategoryBudgets > budgetPreferences.totalBudget && budgetPreferences.totalBudget > 0 
                        ? 'Fix Budget Mismatch First' 
                        : 'Save Preferences'
                      }
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowPreferencesEditor(false)}
                    >
                      Cancel
                    </Button>
                  </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Category Modal Placeholder */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Category</CardTitle>
              <CardDescription>Add a new spending category to your budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name</label>
                <Input placeholder="e.g., Groceries" />
              </div>
              <div>
                <label className="text-sm font-medium">Budget Amount</label>
                <Input type="number" placeholder="500" />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex space-x-2">
                  {['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500'].map((color) => (
                    <div key={color} className={`w-8 h-8 rounded-full ${color} cursor-pointer border-2 border-transparent hover:border-gray-400`}></div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button className="flex-1" onClick={() => setShowAddCategory(false)}>
                  Add Category
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowAddCategory(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}