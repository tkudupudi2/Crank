'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreditCard, Building2, Shield, CheckCircle, AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    Plaid: any
  }
}

interface AccountConnectionProps {
  compact?: boolean
}

export default function AccountConnection({ compact = false }: AccountConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')
  const [connectedInstitutions, setConnectedInstitutions] = useState<string[]>([])
  const router = useRouter()

  // Fetch connected institutions
  useEffect(() => {
    const fetchConnectedInstitutions = async () => {
      try {
        const response = await fetch('/api/accounts/institutions')
        if (response.ok) {
          const data = await response.json()
          setConnectedInstitutions(data.institutions || [])
        }
      } catch (error) {
        console.error('Error fetching connected institutions:', error)
      }
    }

    fetchConnectedInstitutions()
  }, [])

  useEffect(() => {
    // Load Plaid Link script
    const script = document.createElement('script')
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
    script.async = true
    script.onload = () => {
      console.log('Plaid Link script loaded')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  const handleConnectAccounts = async () => {
    setIsConnecting(true)
    setError('')
    
    try {
      // Create link token
      const response = await fetch('/api/plaid/link_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create link token')
      }

      const { link_token } = await response.json()
      console.log('Link token created:', link_token)

      // Check if Plaid is available
      if (!window.Plaid) {
        throw new Error('Plaid Link is not loaded. Please refresh the page.')
      }

      // Initialize Plaid Link
      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token: string, metadata: any) => {
          console.log('Plaid Link success:', { public_token, metadata })
          
          try {
            // Exchange public token for access token
            const exchangeResponse = await fetch('/api/plaid/exchange_token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ public_token }),
            })

            if (exchangeResponse.ok) {
              const successData = await exchangeResponse.json()
              console.log('Account connection success:', successData)
              
              // Show success message
              if (successData.newAccountsCount > 0) {
                setError(`✅ ${successData.message}`)
                setTimeout(() => {
                  router.refresh()
                }, 2000)
              } else {
                // No new accounts, just refresh
                router.refresh()
              }
            } else {
              const errorData = await exchangeResponse.json()
              setError(errorData.error || 'Failed to connect accounts')
            }
          } catch (error) {
            console.error('Error exchanging token:', error)
            setError('Failed to connect accounts')
          }
          
          setIsConnecting(false)
        },
        onExit: (err: any, metadata: any) => {
          console.log('Plaid Link exit:', { err, metadata })
          setIsConnecting(false)
          if (err) {
            setError(err.error_message || 'Connection cancelled')
          }
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('Plaid Link event:', eventName, metadata)
        },
      })

      // Open Plaid Link
      handler.open()
      
    } catch (error) {
      console.error('Error connecting accounts:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect accounts')
      setIsConnecting(false)
    }
  }

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Connect More Accounts
          </CardTitle>
          <CardDescription>
            Add additional bank accounts and credit cards to your dashboard
          </CardDescription>
          {connectedInstitutions.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                Already connected: {connectedInstitutions.join(', ')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You can add additional accounts from these institutions or connect new ones.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleConnectAccounts}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : 'Connect New Account'}
          </Button>
          
          {error && (
            <div className={`p-3 border rounded-lg ${
              error.includes('✅') 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`flex items-center space-x-2 ${
                error.includes('✅') 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                {error.includes('✅') ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {error.includes('✅') ? 'Success' : 'Connection Error'}
                </span>
              </div>
              <p className={`text-xs mt-1 ${
                error.includes('✅') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Your Accounts</CardTitle>
          <CardDescription className="text-lg">
            Link your bank accounts and credit cards to get started with Crank
          </CardDescription>
          {connectedInstitutions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Already connected:</strong> {connectedInstitutions.join(', ')}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                You can connect additional accounts from the same institution or add new institutions.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Connect Banks</h3>
              <p className="text-sm text-muted-foreground">
                Link all your checking, savings, and investment accounts
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Credit Cards</h3>
              <p className="text-sm text-muted-foreground">
                Track all your credit cards and manage payments
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Secure</h3>
              <p className="text-sm text-muted-foreground">
                Bank-level security with 256-bit encryption
              </p>
            </div>
          </div>

          {/* Supported Institutions */}
          <div>
            <h3 className="font-semibold mb-4">Supported Financial Institutions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'Chase', 'Bank of America', 'Wells Fargo', 'Citibank',
                'Capital One', 'US Bank', 'PNC', 'TD Bank'
              ].map((bank) => (
                <div key={bank} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{bank}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connect Button */}
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={handleConnectAccounts}
              disabled={isConnecting}
              className="text-lg px-8 py-3"
            >
              {isConnecting ? 'Connecting...' : 'Connect Your Accounts'}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              You'll be redirected to securely connect your accounts using Plaid
            </p>
            
            {error && (
              <div className={`mt-4 p-4 border rounded-lg ${
                error.includes('✅') 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className={`flex items-center space-x-2 ${
                  error.includes('✅') 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }`}>
                  {error.includes('✅') ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {error.includes('✅') ? 'Success' : 'Connection Error'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  error.includes('✅') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
