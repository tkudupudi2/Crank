'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  User, 
  Mail, 
  Shield, 
  CreditCard, 
  Bell, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff,
  Check,
  AlertTriangle,
  Settings as SettingsIcon,
  Database,
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

interface ConnectedAccount {
  id: string
  name: string
  institutionName: string
  type: string
  mask: string | null
  isActive: boolean
  createdAt: Date
}

interface PlaidItem {
  id: string
  institutionName: string
  status: string
  createdAt: Date
}

interface SettingsContentProps {
  user: User
  connectedAccounts: ConnectedAccount[]
  plaidItems: PlaidItem[]
}

export default function SettingsContent({ user, connectedAccounts, plaidItems }: SettingsContentProps) {
  const [showBalances, setShowBalances] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [transactionAlerts, setTransactionAlerts] = useState(true)
  const [paymentReminders, setPaymentReminders] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSaveSettings = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      // Here you would typically save settings to your database
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      // Create a data export
      const exportData = {
        user: {
          name: user.name,
          email: user.email,
          memberSince: user.createdAt,
        },
        accounts: connectedAccounts.map(account => ({
          name: account.name,
          institution: account.institutionName,
          type: account.type,
          mask: account.mask,
          connected: account.createdAt,
        })),
        exportDate: new Date().toISOString(),
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setMessage('Data exported successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to export data. Please try again.')
    }
  }

  const handleDisconnectAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to disconnect "${accountName}"? This will remove all associated data.`)) {
      return
    }

    try {
      const response = await fetch('/api/accounts/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      })

      if (response.ok) {
        setMessage(`${accountName} disconnected successfully!`)
        setTimeout(() => window.location.reload(), 2000)
      } else {
        const errorData = await response.json()
        setMessage(`Failed to disconnect: ${errorData.error}`)
      }
    } catch (error) {
      setMessage('Failed to disconnect account. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.includes('success') || message.includes('exported') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.includes('success') || message.includes('exported') ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
          <CardDescription>
            Your personal account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <Input 
                value={user.name || ''} 
                disabled 
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <Input 
                value={user.email} 
                disabled 
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Member Since</label>
            <Input 
              value={new Date(user.createdAt).toLocaleDateString()} 
              disabled 
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy & Security</span>
          </CardTitle>
          <CardDescription>
            Control how your financial data is displayed and accessed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Show Account Balances</h4>
              <p className="text-sm text-gray-600 ">Display account balances by default</p>
            </div>
            <Button
              variant={showBalances ? "default" : "outline"}
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showBalances ? 'Visible' : 'Hidden'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Connected Accounts</span>
          </CardTitle>
          <CardDescription>
            Manage your connected bank accounts and credit cards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectedAccounts.length > 0 ? (
            <div className="space-y-3">
              {connectedAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{account.name}</h4>
                    <p className="text-sm text-gray-600">
                      {account.institutionName} •••• {account.mask} • {account.type}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectAccount(account.id, account.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No accounts connected yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </CardTitle>
          <CardDescription>
            Choose what notifications you'd like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <Button
              variant={emailNotifications ? "default" : "outline"}
              size="sm"
              onClick={() => setEmailNotifications(!emailNotifications)}
            >
              {emailNotifications ? 'On' : 'Off'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Transaction Alerts</h4>
              <p className="text-sm text-gray-600">Get notified about new transactions</p>
            </div>
            <Button
              variant={transactionAlerts ? "default" : "outline"}
              size="sm"
              onClick={() => setTransactionAlerts(!transactionAlerts)}
            >
              {transactionAlerts ? 'On' : 'Off'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Payment Reminders</h4>
              <p className="text-sm text-gray-600">Reminders for upcoming payments</p>
            </div>
            <Button
              variant={paymentReminders ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentReminders(!paymentReminders)}
            >
              {paymentReminders ? 'On' : 'Off'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>
            Export your data or manage your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-gray-600">Download a copy of your financial data</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-600">Delete Account</h4>
                <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => alert('Account deletion not implemented yet. Please contact support.')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-8"
        >
          <SettingsIcon className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
