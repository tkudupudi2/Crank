'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, Building2, Eye, EyeOff, DollarSign, Calendar, Plus, Trash2, EyeIcon, X, Info, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import AccountConnection from './AccountConnection'
import PaymentForm from './PaymentForm'

interface Account {
  id: string
  name: string
  type: string
  subtype: string | null
  currentBalance: number | null
  availableBalance: number | null
  mask: string | null
  institutionName: string
  currencyCode: string
  dueDate: Date | null
  minimumPayment: number | null
}

interface AccountsListProps {
  accounts: Account[]
  creditCards: Account[]
  bankAccounts: Account[]
}

export default function AccountsList({ accounts, creditCards, bankAccounts }: AccountsListProps) {
  const [showBalances, setShowBalances] = useState(true)
  const [showConnectMore, setShowConnectMore] = useState(false)
  const [removingAccount, setRemovingAccount] = useState<string | null>(null)
  const [visibleAccountNumbers, setVisibleAccountNumbers] = useState<Set<string>>(new Set())
  const [editingCreditCard, setEditingCreditCard] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [minimumPayment, setMinimumPayment] = useState('')
  const [updatingCreditCard, setUpdatingCreditCard] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null)
  const [fetchingLiabilities, setFetchingLiabilities] = useState(false)
  const [liabilitiesResult, setLiabilitiesResult] = useState<{ success: boolean; message?: string } | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedCreditCard, setSelectedCreditCard] = useState<Account | null>(null)
  const router = useRouter()

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getAccountIcon = (type: string) => {
    return type === 'credit' ? CreditCard : Building2
  }

  const getAccountTypeColor = (type: string) => {
    return type === 'credit' ? 'text-red-600' : 'text-green-600'
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleEditCreditCard = (account: Account) => {
    setEditingCreditCard(account.id)
    setDueDate(account.dueDate ? new Date(account.dueDate).toISOString().split('T')[0] : '')
    setMinimumPayment(account.minimumPayment ? account.minimumPayment.toString() : '')
  }

  const handleCancelEdit = () => {
    setEditingCreditCard(null)
    setDueDate('')
    setMinimumPayment('')
  }

  const handleUpdateCreditCard = async (accountId: string) => {
    setUpdatingCreditCard(true)
    
    try {
      const response = await fetch('/api/accounts/update-credit-card', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          dueDate: dueDate || null,
          minimumPayment: minimumPayment ? parseFloat(minimumPayment) : null,
        }),
      })

      if (response.ok) {
        router.refresh()
        setEditingCreditCard(null)
        setDueDate('')
        setMinimumPayment('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update credit card information')
      }
    } catch (error) {
      alert('Network error while updating credit card information')
    } finally {
      setUpdatingCreditCard(false)
    }
  }

  const handleShowAccountInfo = (account: Account) => {
    setSelectedAccount(account)
    setShowAccountModal(true)
  }

  const handleCloseAccountModal = () => {
    setShowAccountModal(false)
    setSelectedAccount(null)
  }

  const getAccountTypeBg = (type: string) => {
    return type === 'credit' ? 'bg-red-50' : 'bg-green-50'
  }

  const generateFullAccountNumber = (mask: string | null, accountId: string) => {
    if (!mask) return '•••• •••• •••• ••••'
    
    // Generate a mock full account number for demonstration
    // In a real app, this would come from a secure source
    const accountIdHash = accountId.slice(-8) // Use last 8 chars of account ID
    const paddedHash = accountIdHash.padStart(12, '0')
    const formattedNumber = paddedHash.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
    return formattedNumber
  }

  const toggleAccountNumberVisibility = (accountId: string) => {
    const newVisible = new Set(visibleAccountNumbers)
    if (newVisible.has(accountId)) {
      newVisible.delete(accountId)
    } else {
      newVisible.add(accountId)
    }
    setVisibleAccountNumbers(newVisible)
  }

  const handleRemoveAccount = (accountId: string, accountName: string) => {
    setAccountToDelete({ id: accountId, name: accountName })
    setShowDeleteModal(true)
  }

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return

    setRemovingAccount(accountToDelete.id)
    setShowDeleteModal(false)
    
    try {
      const response = await fetch('/api/accounts/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: accountToDelete.id }),
      })

      if (response.ok) {
        // Refresh the page to show updated accounts
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(`Failed to remove account: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error removing account:', error)
      alert('Failed to remove account. Please try again.')
    } finally {
      setRemovingAccount(null)
      setAccountToDelete(null)
    }
  }

  const cancelDeleteAccount = () => {
    setShowDeleteModal(false)
    setAccountToDelete(null)
  }

  const handleFetchLiabilities = async () => {
    setFetchingLiabilities(true)
    setLiabilitiesResult(null)

    try {
      const response = await fetch('/api/accounts/fetch-liabilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        setLiabilitiesResult({
          success: true,
          message: result.message
        })
        // Refresh the page to show updated data
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setLiabilitiesResult({
          success: false,
          message: result.error || 'Failed to fetch liability data'
        })
      }
    } catch (error) {
      setLiabilitiesResult({
        success: false,
        message: 'Network error while fetching liability data'
      })
    } finally {
      setFetchingLiabilities(false)
    }
  }

  const handlePayCreditCard = (creditCard: Account) => {
    setSelectedCreditCard(creditCard)
    setShowPaymentForm(true)
  }

  const handlePaymentSuccess = () => {
    // Refresh the page to show updated account balances
    router.refresh()
  }

  const handleClosePaymentForm = () => {
    setShowPaymentForm(false)
    setSelectedCreditCard(null)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showBalances ? 'Hide' : 'Show'} Balances
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchLiabilities}
            disabled={fetchingLiabilities}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {fetchingLiabilities ? 'Fetching...' : 'Update Credit Card Info'}
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConnectMore(!showConnectMore)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showConnectMore ? 'Hide' : 'Connect More'} Accounts
          </Button>
        </div>
      </div>

      {/* Liabilities Result */}
      {liabilitiesResult && (
        <div className={`p-4 border rounded-lg ${
          liabilitiesResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {liabilitiesResult.success ? (
              <>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium">Success</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium">Error</span>
              </>
            )}
          </div>
          <p className="text-sm mt-1">{liabilitiesResult.message}</p>
        </div>
      )}

      {/* Connect More Accounts */}
      {showConnectMore && (
        <div className="mb-6">
          <AccountConnection compact />
        </div>
      )}

      {/* Credit Cards */}
      {creditCards.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Credit Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((account) => {
              const Icon = getAccountIcon(account.type)
              return (
                <Card key={account.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAccountTypeBg(account.type)}`}>
                        <Icon className={`h-5 w-5 ${getAccountTypeColor(account.type)}`} />
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {account.subtype || account.type}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <span>{account.institutionName}</span>
                      <span className="font-mono">
                        {visibleAccountNumbers.has(account.id) 
                          ? generateFullAccountNumber(account.mask, account.id)
                          : `•••• ${account.mask}`
                        }
                      </span>
                      <button
                        onClick={() => toggleAccountNumberVisibility(account.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={visibleAccountNumbers.has(account.id) ? 'Hide account number' : 'Show full account number'}
                      >
                        {visibleAccountNumbers.has(account.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <EyeIcon className="h-3 w-3" />
                        )}
                      </button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Balance</span>
                        <span className={`font-semibold ${getAccountTypeColor(account.type)}`}>
                          {showBalances ? formatCurrency(account.currentBalance) : '••••'}
                        </span>
                      </div>
                      {account.availableBalance !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Available Credit</span>
                          <span className="font-semibold text-green-600">
                            {showBalances ? formatCurrency(account.availableBalance) : '••••'}
                          </span>
                        </div>
                      )}
                      
                      {/* Due Date and Minimum Payment */}
                      {editingCreditCard === account.id ? (
                        <div className="space-y-3 pt-2 border-t">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Payment Due Date
                            </label>
                            <input
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Minimum Payment
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={minimumPayment}
                              onChange={(e) => setMinimumPayment(e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateCreditCard(account.id)}
                              disabled={updatingCreditCard}
                              className="flex-1"
                            >
                              {updatingCreditCard ? 'Updating...' : 'Save'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Due Date</span>
                            <span className="text-sm font-medium">
                              {formatDate(account.dueDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Minimum Payment</span>
                            <span className="text-sm font-medium">
                              {account.minimumPayment ? formatCurrency(account.minimumPayment) : 'Not set'}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCreditCard(account)}
                            className="w-full mt-2"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Edit Payment Info
                          </Button>
                        </div>
                      )}
                    </div>
                           <div className="mt-4 space-y-2">
                             <div className="flex space-x-2">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="flex-1"
                                 onClick={() => handlePayCreditCard(account)}
                               >
                                 <DollarSign className="h-4 w-4 mr-2" />
                                 Pay
                               </Button>
                               <Button variant="outline" size="sm" className="flex-1">
                                 <Calendar className="h-4 w-4 mr-2" />
                                 Schedule
                               </Button>
                             </div>
                             <Button
                               variant="outline"
                               size="sm"
                               className="w-full"
                               onClick={() => handleShowAccountInfo(account)}
                             >
                               <Info className="h-4 w-4 mr-2" />
                               Account Info
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                               onClick={() => handleRemoveAccount(account.id, account.name)}
                               disabled={removingAccount === account.id}
                             >
                               <Trash2 className="h-4 w-4 mr-2" />
                               {removingAccount === account.id ? 'Removing...' : 'Remove Account'}
                             </Button>
                           </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Bank Accounts */}
      {bankAccounts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Bank Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((account) => {
              const Icon = getAccountIcon(account.type)
              return (
                <Card key={account.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAccountTypeBg(account.type)}`}>
                        <Icon className={`h-5 w-5 ${getAccountTypeColor(account.type)}`} />
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {account.subtype || account.type}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <span>{account.institutionName}</span>
                      <span className="font-mono">
                        {visibleAccountNumbers.has(account.id) 
                          ? generateFullAccountNumber(account.mask, account.id)
                          : `•••• ${account.mask}`
                        }
                      </span>
                      <button
                        onClick={() => toggleAccountNumberVisibility(account.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={visibleAccountNumbers.has(account.id) ? 'Hide account number' : 'Show full account number'}
                      >
                        {visibleAccountNumbers.has(account.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <EyeIcon className="h-3 w-3" />
                        )}
                      </button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Balance</span>
                        <span className={`font-semibold ${getAccountTypeColor(account.type)}`}>
                          {showBalances ? formatCurrency(account.currentBalance) : '••••'}
                        </span>
                      </div>
                      {account.availableBalance !== null && account.availableBalance !== account.currentBalance && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Available Balance</span>
                          <span className="font-semibold text-green-600">
                            {showBalances ? formatCurrency(account.availableBalance) : '••••'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleShowAccountInfo(account)}
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Account Info
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleRemoveAccount(account.id, account.name)}
                        disabled={removingAccount === account.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {removingAccount === account.id ? 'Removing...' : 'Remove Account'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your bank accounts and credit cards to get started
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>Connect Accounts</Button>
          </CardContent>
        </Card>
      )}

      {/* Account Info Modal */}
      {showAccountModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Account Information
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseAccountModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Account Header */}
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAccountTypeBg(selectedAccount.type)}`}>
                  {selectedAccount.type === 'credit' ? (
                    <CreditCard className={`h-6 w-6 ${getAccountTypeColor(selectedAccount.type)}`} />
                  ) : (
                    <Building2 className={`h-6 w-6 ${getAccountTypeColor(selectedAccount.type)}`} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedAccount.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedAccount.institutionName} • {selectedAccount.subtype || selectedAccount.type}
                  </p>
                </div>
              </div>

              {/* Account Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Basic Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 ">Account ID</span>
                      <span className="text-sm font-mono text-gray-900 ">
                        {selectedAccount.id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 ">Account Type</span>
                      <span className="text-sm text-gray-900  capitalize">
                        {selectedAccount.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 ">Subtype</span>
                      <span className="text-sm text-gray-900  capitalize">
                        {selectedAccount.subtype || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 ">Account Number</span>
                      <span className="text-sm font-mono text-gray-900 ">
                        •••• {selectedAccount.mask}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 ">Currency</span>
                      <span className="text-sm text-gray-900 ">
                        {selectedAccount.currencyCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Balance Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 ">Current Balance</span>
                      <span className={`text-sm font-semibold ${getAccountTypeColor(selectedAccount.type)}`}>
                        {showBalances ? formatCurrency(selectedAccount.currentBalance) : '••••'}
                      </span>
                    </div>
                    {selectedAccount.availableBalance !== null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 ">
                          {selectedAccount.type === 'credit' ? 'Available Credit' : 'Available Balance'}
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {showBalances ? formatCurrency(selectedAccount.availableBalance) : '••••'}
                        </span>
                      </div>
                    )}
                    {selectedAccount.type === 'credit' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 ">Due Date</span>
                          <span className="text-sm text-gray-900  flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(selectedAccount.dueDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 ">Minimum Payment</span>
                          <span className="text-sm text-gray-900 ">
                            {selectedAccount.minimumPayment ? formatCurrency(selectedAccount.minimumPayment) : 'Not set'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="border-t border-gray-200  pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 ">Account Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800  ">
                    Active
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200  pt-4">
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Toggle balance visibility
                      setShowBalances(!showBalances)
                    }}
                  >
                    {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showBalances ? 'Hide Balances' : 'Show Balances'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCloseAccountModal()}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && accountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white  rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100  rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600 " />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 ">
                    Remove Account
                  </h3>
                  <p className="text-sm text-gray-600 ">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 ">
                  Are you sure you want to remove <span className="font-semibold">"{accountToDelete.name}"</span>? 
                  This will permanently disconnect the account and remove all associated data.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteAccount}
                  className="flex-1"
                  disabled={removingAccount === accountToDelete.id}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteAccount}
                  className="flex-1"
                  disabled={removingAccount === accountToDelete.id}
                >
                  {removingAccount === accountToDelete.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && selectedCreditCard && (
        <PaymentForm
          creditCard={{
            id: selectedCreditCard.id,
            name: selectedCreditCard.name,
            subtype: selectedCreditCard.subtype,
            mask: selectedCreditCard.mask,
            institutionName: selectedCreditCard.institutionName,
            currentBalance: selectedCreditCard.currentBalance || 0,
            dueDate: selectedCreditCard.dueDate?.toISOString() || null,
            minimumPayment: selectedCreditCard.minimumPayment,
            daysUntilDue: selectedCreditCard.dueDate 
              ? Math.ceil((new Date(selectedCreditCard.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null,
          }}
          onClose={handleClosePaymentForm}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
