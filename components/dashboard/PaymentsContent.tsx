'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  CreditCard, 
  Calendar, 
  Repeat, 
  DollarSign, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { format, isAfter, isBefore, addMonths, subMonths } from 'date-fns'

interface Transaction {
  id: string
  amount: number
  description: string
  merchantName: string | null
  category: string[]
  date: Date
  isManual: boolean
  account: {
    id: string
    name: string
    type: string
    institutionName: string
  }
}

interface LiabilityAccount {
  id: string
  name: string
  type: string
  institutionName: string
  currentBalance: number | null
  minimumPayment: number | null
  dueDate: Date | null
  creditLimit: number | null
}

interface RecurringPayment {
  id: string
  merchantName: string
  description: string
  amount: number
  frequency: 'monthly' | 'weekly' | 'yearly'
  nextDue: Date
  lastPayment: Date
  account: string
  category: string[]
  isEstimated?: boolean
}

export default function PaymentsContent({ 
  transactions, 
  liabilityAccounts 
}: { 
  transactions: Transaction[]
  liabilityAccounts: LiabilityAccount[]
}) {
  const [activeTab, setActiveTab] = useState<'history' | 'future' | 'recurring'>('history')

  // Smart payment detection logic
  const paymentTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const description = transaction.description.toLowerCase()
      const merchantName = transaction.merchantName?.toLowerCase() || ''
      const categories = transaction.category.map(c => c.toLowerCase())
      
      // Exclude regular purchases first
      const isRegularPurchase = categories.some(cat => 
        cat.includes('food') || 
        cat.includes('drink') || 
        cat.includes('restaurant') ||
        cat.includes('grocery') ||
        cat.includes('shopping') ||
        cat.includes('retail') ||
        cat.includes('entertainment') ||
        cat.includes('recreation')
      )
      
      if (isRegularPurchase) return false
      
      // Specific payment indicators - must be more explicit
      const explicitPaymentKeywords = [
        'payment', 'bill', 'subscription', 'recurring', 'monthly payment',
        'annual payment', 'premium', 'plan', 'service fee', 'membership fee',
        'insurance', 'rent', 'mortgage', 'loan payment', 'credit card payment',
        'utility', 'electric', 'water', 'gas', 'internet', 'phone bill',
        'netflix', 'spotify', 'amazon prime', 'adobe', 'microsoft',
        'gym membership', 'fitness membership', 'dues'
      ]
      
      // Check for explicit payment keywords in description
      const hasExplicitPayment = explicitPaymentKeywords.some(keyword => 
        description.includes(keyword)
      )
      
      // Check for known subscription services
      const knownSubscriptions = [
        'netflix', 'spotify', 'amazon prime', 'adobe', 'microsoft',
        'apple music', 'youtube premium', 'hulu', 'disney', 'hbo',
        'dropbox', 'slack', 'zoom', 'canva', 'figma'
      ]
      
      const isKnownSubscription = knownSubscriptions.some(service => 
        merchantName.includes(service) || description.includes(service)
      )
      
      // Check for transfers and autopay
      const isTransfer = description.includes('transfer') || 
                        description.includes('payment to') ||
                        description.includes('autopay') ||
                        description.includes('automatic payment')
      
      // Check for bill-related categories
      const isBillCategory = categories.some(cat => 
        cat.includes('utilities') || 
        cat.includes('insurance') ||
        cat.includes('rent') ||
        cat.includes('mortgage') ||
        cat.includes('loan') ||
        cat.includes('subscription')
      )
      
      return hasExplicitPayment || isKnownSubscription || isTransfer || isBillCategory
    })
  }, [transactions])

  // Detect recurring payments
  const recurringPayments = useMemo(() => {
    const recurring: RecurringPayment[] = []
    const merchantGroups: { [key: string]: Transaction[] } = {}
    
    // Group transactions by merchant
    paymentTransactions.forEach(transaction => {
      const merchant = transaction.merchantName || transaction.description
      if (!merchantGroups[merchant]) {
        merchantGroups[merchant] = []
      }
      merchantGroups[merchant].push(transaction)
    })
    
    // Known recurring services that should be detected even with single transactions
    const knownRecurringServices = [
      'netflix', 'spotify', 'amazon prime', 'adobe', 'microsoft',
      'apple music', 'youtube premium', 'hulu', 'disney', 'hbo',
      'dropbox', 'slack', 'zoom', 'canva', 'figma', 'notion',
      'github', 'aws', 'google cloud', 'salesforce', 'hubspot',
      'mailchimp', 'stripe', 'paypal', 'shopify', 'squarespace',
      'wix', 'wordpress', 'godaddy', 'namecheap', 'cloudflare',
      'vercel', 'netlify', 'heroku', 'digitalocean', 'linode',
      'grammarly', 'lastpass', '1password', 'dashlane', 'bitwarden',
      'expressvpn', 'nordvpn', 'surfshark', 'protonvpn', 'cyberghost',
      'audible', 'kindle unlimited', 'scribd', 'masterclass', 'skillshare',
      'linkedin premium', 'glassdoor', 'indeed', 'monster', 'ziprecruiter',
      'tinder', 'bumble', 'hinge', 'match', 'eharmony', 'okcupid',
      'uber eats', 'doordash', 'grubhub', 'postmates', 'instacart',
      'blue apron', 'hello fresh', 'sunbasket', 'purple carrot', 'green chef',
      'peloton', 'classpass', 'mindbody', 'glofox', 'zenplanner',
      'calm', 'headspace', 'insight timer', 'ten percent happier', 'waking up',
      'roku', 'fire tv', 'apple tv', 'chromecast', 'nvidia shield',
      'twitch', 'patreon', 'onlyfans', 'fanhouse', 'ko-fi',
      'medium', 'substack', 'ghost', 'beehiiv', 'convertkit',
      'mailgun', 'sendgrid', 'postmark', 'mandrill', 'sparkpost',
      'intercom', 'zendesk', 'freshdesk', 'helpscout', 'crisp',
      'hotjar', 'fullstory', 'logrocket', 'mixpanel', 'amplitude',
      'segment', 'monday', 'asana', 'trello', 'clickup', 'notion',
      'airtable', 'smartsheet', 'monday.com', 'wrike', 'basecamp',
      'slack', 'microsoft teams', 'discord', 'zoom', 'webex',
      'go to meeting', 'bluejeans', 'jitsi', 'whereby', 'appear.in'
    ]

    // Analyze each merchant group for recurring patterns
    Object.entries(merchantGroups).forEach(([merchant, txs]) => {
      // Sort by date
      const sortedTxs = txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      // Check if this is a known recurring service (even with single transaction)
      const isKnownRecurring = knownRecurringServices.some(service => {
        const merchantMatch = merchant.toLowerCase().includes(service)
        const descriptionMatch = sortedTxs[0].description.toLowerCase().includes(service)
        return merchantMatch || descriptionMatch
      })
      
      if (isKnownRecurring && txs.length === 1) {
        // For known recurring services with single transaction, estimate next due date
        const lastPayment = new Date(sortedTxs[0].date)
        const nextDue = new Date(lastPayment)
        nextDue.setMonth(nextDue.getMonth() + 1) // Assume monthly
        
        recurring.push({
          id: `recurring_${merchant}_${Date.now()}`,
          merchantName: merchant,
          description: sortedTxs[0].description,
          amount: Math.abs(sortedTxs[0].amount),
          frequency: 'monthly',
          nextDue: nextDue,
          lastPayment: lastPayment,
          account: sortedTxs[0].account.name,
          category: sortedTxs[0].category,
          isEstimated: true // Mark as estimated since we only have one transaction
        })
      } else if (txs.length >= 2) {
        // Check for monthly pattern with multiple transactions
        const monthlyPattern = checkMonthlyPattern(sortedTxs)
        if (monthlyPattern) {
          recurring.push({
            id: `recurring_${merchant}_${Date.now()}`,
            merchantName: merchant,
            description: sortedTxs[0].description,
            amount: monthlyPattern.averageAmount,
            frequency: 'monthly',
            nextDue: monthlyPattern.nextDue,
            lastPayment: new Date(sortedTxs[sortedTxs.length - 1].date),
            account: sortedTxs[0].account.name,
            category: sortedTxs[0].category,
            isEstimated: false
          })
        }
      }
    })
    
    return recurring.sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime())
  }, [paymentTransactions])

  // Future payments from liability accounts
  const futurePayments = useMemo(() => {
    return liabilityAccounts
      .filter(account => {
        // For credit cards, require both dueDate and minimumPayment
        if (account.type === 'credit') {
          return account.dueDate && account.minimumPayment
        }
        // For loans (including student loans), be more flexible
        // Student loans might not have minimumPayment but should still show if they have dueDate
        if (account.type === 'loan') {
          return account.dueDate && (account.minimumPayment || account.currentBalance)
        }
        return false
      })
      .map(account => ({
        id: `future_${account.id}`,
        accountName: account.name,
        institutionName: account.institutionName,
        amount: account.minimumPayment || (account.currentBalance ? Math.max(account.currentBalance * 0.02, 25) : 0), // Default to 2% of balance or $25 minimum
        dueDate: account.dueDate!,
        currentBalance: account.currentBalance || 0,
        creditLimit: account.creditLimit,
        type: account.type,
        isEstimated: !account.minimumPayment // Mark if amount is estimated
      }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }, [liabilityAccounts])

  // Helper function to check for monthly patterns
  function checkMonthlyPattern(transactions: Transaction[]): { averageAmount: number, nextDue: Date } | null {
    if (transactions.length < 2) return null
    
    const amounts = transactions.map(t => Math.abs(t.amount))
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    
    // Check if amounts are similar (within 20% variance)
    const variance = amounts.every(amount => 
      Math.abs(amount - averageAmount) / averageAmount < 0.2
    )
    
    if (!variance) return null
    
    // Check if dates are roughly monthly apart
    const dates = transactions.map(t => new Date(t.date))
    const intervals = []
    
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i-1].getTime()
      const daysDiff = diff / (1000 * 60 * 60 * 24)
      intervals.push(daysDiff)
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    
    // Check if average interval is between 25-35 days (roughly monthly)
    if (avgInterval < 25 || avgInterval > 35) return null
    
    // Calculate next due date
    const lastDate = dates[dates.length - 1]
    const nextDue = addMonths(lastDate, 1)
    
    return { averageAmount, nextDue }
  }

  const tabs = [
    { id: 'history', label: 'Payment History', icon: Clock, count: paymentTransactions.length },
    { id: 'future', label: 'Future Payments', icon: Calendar, count: futurePayments.length },
    { id: 'recurring', label: 'Recurring', icon: Repeat, count: recurringPayments.length }
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Payments</h2>
            <p className="text-sm text-gray-500">
              Smart detection of subscription, bill, and recurring payments
            </p>
          </div>
          
          <div className="grid gap-4">
            {paymentTransactions.slice(0, 20).map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.merchantName || transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.account.institutionName} • {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {transaction.category.map((cat, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.amount < 0 ? 'Payment' : 'Credit'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Future Payments Tab */}
      {activeTab === 'future' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming Payments</h2>
            <p className="text-sm text-gray-500">
              Based on your liability accounts and due dates
            </p>
          </div>
          
          {futurePayments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Payments</h3>
                <p className="text-gray-500">
                  No liability accounts with upcoming due dates found.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {futurePayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-orange-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.accountName}</p>
                          <p className="text-sm text-gray-500">
                            {payment.institutionName} • Due {format(payment.dueDate, 'MMM d, yyyy')}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              Balance: ${payment.currentBalance.toFixed(2)}
                            </span>
                            {payment.creditLimit && (
                              <span className="text-sm text-gray-500">
                                Limit: ${payment.creditLimit.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">
                          ${payment.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.isEstimated ? 'Estimated Payment' : 'Minimum Payment'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recurring Payments Tab */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recurring Payments</h2>
            <p className="text-sm text-gray-500">
              Automatically detected from your transaction patterns and known recurring services
            </p>
          </div>
          
          {recurringPayments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recurring Payments Detected</h3>
                <p className="text-gray-500">
                  We'll automatically detect recurring payments as more transaction data becomes available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recurringPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Repeat className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.merchantName}</p>
                          <p className="text-sm text-gray-500">
                            {payment.account} • Next due {format(payment.nextDue, 'MMM d, yyyy')}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {payment.frequency}
                            </Badge>
                            {payment.isEstimated && (
                              <Badge variant="secondary" className="text-xs">
                                Estimated
                              </Badge>
                            )}
                            {payment.category.map((cat, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Last: {format(payment.lastPayment, 'MMM d')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
