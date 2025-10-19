'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, Building2, DollarSign, Star, TrendingUp, Filter, Search } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  description: string
  category: string[]
  date: Date
  merchantName: string | null
}

interface CreditCard {
  id: string
  name: string
  issuer: string
  annualFee: number
  baseRewards: number
  categoryBonuses: { [key: string]: number }
  signUpBonus: string
  minSpend: number
  matchScore: number
  estimatedAnnualValue: number
  benefits: string[]
  image: string
}

interface SpendingAnalysis {
  totalSpending: number
  categorySpending: { [key: string]: number }
  topCategories: Array<{ category: string; amount: number; percentage: number }>
  monthlyAverage: number
}

export default function NewAccountsPage() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis | null>(null)
  const [recommendedCards, setRecommendedCards] = useState<CreditCard[]>([])
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Comprehensive credit card database
  const creditCards: CreditCard[] = [
    // CASH BACK CARDS
    {
      id: '1',
      name: 'Chase Freedom Unlimited',
      issuer: 'Chase',
      annualFee: 0,
      baseRewards: 1.5,
      categoryBonuses: {},
      signUpBonus: '20,000 points after $500 spend',
      minSpend: 500,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['No annual fee', '1.5% cash back on all purchases', '5% on travel through Chase'],
      image: '/cards/chase-freedom-unlimited.png'
    },
    {
      id: '2',
      name: 'Capital One SavorOne',
      issuer: 'Capital One',
      annualFee: 0,
      baseRewards: 1,
      categoryBonuses: { 'Dining': 3, 'Entertainment': 3, 'Groceries': 3 },
      signUpBonus: '$200 after $500 spend',
      minSpend: 500,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['No annual fee', '3% on dining, entertainment, groceries', '1% on everything else'],
      image: '/cards/capital-one-savorone.png'
    },
    {
      id: '3',
      name: 'American Express Blue Cash Preferred',
      issuer: 'American Express',
      annualFee: 95,
      baseRewards: 1,
      categoryBonuses: { 'Groceries': 6, 'Streaming': 6, 'Transit': 3 },
      signUpBonus: '$250 after $3,000 spend',
      minSpend: 3000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['6% on groceries', '6% on streaming', '3% on transit', '1% on everything else'],
      image: '/cards/amex-blue-cash-preferred.png'
    },
    {
      id: '4',
      name: 'Citi Double Cash',
      issuer: 'Citi',
      annualFee: 0,
      baseRewards: 2,
      categoryBonuses: {},
      signUpBonus: '$200 after $1,500 spend',
      minSpend: 1500,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['2% cash back on all purchases', '1% when you buy, 1% when you pay', 'No annual fee'],
      image: '/cards/citi-double-cash.png'
    },
    {
      id: '5',
      name: 'Citi Custom Cash',
      issuer: 'Citi',
      annualFee: 0,
      baseRewards: 1,
      categoryBonuses: { 'Top Category': 5 },
      signUpBonus: '$200 after $1,500 spend',
      minSpend: 1500,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['5% on top spending category', '1% on everything else', 'No annual fee'],
      image: '/cards/citi-custom-cash.png'
    },
    {
      id: '6',
      name: 'Wells Fargo Active Cash',
      issuer: 'Wells Fargo',
      annualFee: 0,
      baseRewards: 2,
      categoryBonuses: {},
      signUpBonus: '$200 after $1,000 spend',
      minSpend: 1000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['2% cash back on all purchases', 'No annual fee', 'Cell phone protection'],
      image: '/cards/wells-fargo-active-cash.png'
    },
    {
      id: '7',
      name: 'Discover it Cash Back',
      issuer: 'Discover',
      annualFee: 0,
      baseRewards: 1,
      categoryBonuses: { 'Rotating Categories': 5 },
      signUpBonus: 'Cashback Match after first year',
      minSpend: 0,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['5% on rotating categories', '1% on everything else', 'Cashback Match first year'],
      image: '/cards/discover-it-cash-back.png'
    },

    // TRAVEL CARDS
    {
      id: '8',
      name: 'Chase Sapphire Preferred',
      issuer: 'Chase',
      annualFee: 95,
      baseRewards: 1,
      categoryBonuses: { 'Travel': 2, 'Dining': 2 },
      signUpBonus: '60,000 points after $4,000 spend',
      minSpend: 4000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['2x points on travel and dining', '25% more value when redeeming for travel'],
      image: '/cards/chase-sapphire-preferred.png'
    },
    {
      id: '9',
      name: 'Chase Sapphire Reserve',
      issuer: 'Chase',
      annualFee: 550,
      baseRewards: 1,
      categoryBonuses: { 'Travel': 3, 'Dining': 3 },
      signUpBonus: '60,000 points after $4,000 spend',
      minSpend: 4000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['3x points on travel and dining', '50% more value when redeeming for travel', '$300 travel credit'],
      image: '/cards/chase-sapphire-reserve.png'
    },
    {
      id: '10',
      name: 'Capital One Venture X',
      issuer: 'Capital One',
      annualFee: 395,
      baseRewards: 2,
      categoryBonuses: { 'Travel': 2 },
      signUpBonus: '75,000 points after $4,000 spend',
      minSpend: 4000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['2x points on all purchases', '$300 travel credit', 'Priority Pass lounge access'],
      image: '/cards/capital-one-venture-x.png'
    },
    {
      id: '11',
      name: 'American Express Gold Card',
      issuer: 'American Express',
      annualFee: 250,
      baseRewards: 1,
      categoryBonuses: { 'Dining': 4, 'Groceries': 4, 'Airline': 3 },
      signUpBonus: '60,000 points after $4,000 spend',
      minSpend: 4000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['4x points on dining and groceries', '3x points on flights', '$120 dining credit'],
      image: '/cards/amex-gold-card.png'
    },
    {
      id: '12',
      name: 'American Express Platinum Card',
      issuer: 'American Express',
      annualFee: 695,
      baseRewards: 1,
      categoryBonuses: { 'Airline': 5, 'Hotel': 5 },
      signUpBonus: '80,000 points after $6,000 spend',
      minSpend: 6000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['5x points on flights and hotels', 'Centurion lounge access', '$200 airline credit'],
      image: '/cards/amex-platinum-card.png'
    },
    {
      id: '13',
      name: 'Chase Freedom Flex',
      issuer: 'Chase',
      annualFee: 0,
      baseRewards: 1,
      categoryBonuses: { 'Rotating Categories': 5, 'Dining': 3, 'Drugstores': 3 },
      signUpBonus: '20,000 points after $500 spend',
      minSpend: 500,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['5% on rotating categories', '3% on dining and drugstores', '1% on everything else'],
      image: '/cards/chase-freedom-flex.png'
    },

    // LUXURY CARDS
    {
      id: '14',
      name: 'Chase Sapphire Reserve',
      issuer: 'Chase',
      annualFee: 550,
      baseRewards: 1,
      categoryBonuses: { 'Travel': 3, 'Dining': 3 },
      signUpBonus: '60,000 points after $4,000 spend',
      minSpend: 4000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['3x points on travel and dining', '50% more value when redeeming for travel', '$300 travel credit'],
      image: '/cards/chase-sapphire-reserve.png'
    },
    {
      id: '15',
      name: 'American Express Platinum Card',
      issuer: 'American Express',
      annualFee: 695,
      baseRewards: 1,
      categoryBonuses: { 'Airline': 5, 'Hotel': 5 },
      signUpBonus: '80,000 points after $6,000 spend',
      minSpend: 6000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['5x points on flights and hotels', 'Centurion lounge access', '$200 airline credit'],
      image: '/cards/amex-platinum-card.png'
    },
    {
      id: '16',
      name: 'Capital One Venture X',
      issuer: 'Capital One',
      annualFee: 395,
      baseRewards: 2,
      categoryBonuses: { 'Travel': 2 },
      signUpBonus: '75,000 points after $4,000 spend',
      minSpend: 4000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['2x points on all purchases', '$300 travel credit', 'Priority Pass lounge access'],
      image: '/cards/capital-one-venture-x.png'
    },
    {
      id: '17',
      name: 'Chase Ink Business Preferred',
      issuer: 'Chase',
      annualFee: 95,
      baseRewards: 1,
      categoryBonuses: { 'Travel': 3, 'Shipping': 3, 'Advertising': 3, 'Internet': 3 },
      signUpBonus: '100,000 points after $15,000 spend',
      minSpend: 15000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['3x points on business categories', '25% more value when redeeming for travel'],
      image: '/cards/chase-ink-business-preferred.png'
    },

    // BALANCE TRANSFER CARDS
    {
      id: '18',
      name: 'Citi Simplicity',
      issuer: 'Citi',
      annualFee: 0,
      baseRewards: 0,
      categoryBonuses: {},
      signUpBonus: '0% APR for 21 months',
      minSpend: 0,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['0% intro APR for 21 months', 'No late fees', 'No annual fee'],
      image: '/cards/citi-simplicity.png'
    },
    {
      id: '19',
      name: 'Chase Slate Edge',
      issuer: 'Chase',
      annualFee: 0,
      baseRewards: 0,
      categoryBonuses: {},
      signUpBonus: '0% APR for 18 months',
      minSpend: 0,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['0% intro APR for 18 months', 'No annual fee', 'Credit limit increase opportunity'],
      image: '/cards/chase-slate-edge.png'
    },
    {
      id: '20',
      name: 'Wells Fargo Reflect',
      issuer: 'Wells Fargo',
      annualFee: 0,
      baseRewards: 0,
      categoryBonuses: {},
      signUpBonus: '0% APR for 21 months',
      minSpend: 0,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['0% intro APR for 21 months', 'No annual fee', 'Cell phone protection'],
      image: '/cards/wells-fargo-reflect.png'
    },
    {
      id: '21',
      name: 'Bank of America Customized Cash Rewards',
      issuer: 'Bank of America',
      annualFee: 0,
      baseRewards: 1,
      categoryBonuses: { 'Chosen Category': 3 },
      signUpBonus: '$200 after $1,000 spend',
      minSpend: 1000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['3% on chosen category', '2% on groceries and wholesale clubs', '1% on everything else'],
      image: '/cards/bank-of-america-customized-cash.png'
    },

    // STUDENT CARDS
    {
      id: '22',
      name: 'Discover it Student Cash Back',
      issuer: 'Discover',
      annualFee: 0,
      baseRewards: 1,
      categoryBonuses: { 'Rotating Categories': 5 },
      signUpBonus: 'Cashback Match after first year',
      minSpend: 0,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['5% on rotating categories', '1% on everything else', 'Good grades reward'],
      image: '/cards/discover-it-student.png'
    },
    {
      id: '23',
      name: 'Capital One Journey Student',
      issuer: 'Capital One',
      annualFee: 0,
      baseRewards: 1,
      categoryBonuses: { 'All Purchases': 1.25 },
      signUpBonus: '$50 after first purchase',
      minSpend: 0,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['1.25% cash back on all purchases', 'No annual fee', 'No foreign transaction fees'],
      image: '/cards/capital-one-journey-student.png'
    },

    // BUSINESS CARDS
    {
      id: '24',
      name: 'Chase Ink Business Cash',
      issuer: 'Chase',
      annualFee: 0,
      baseRewards: 1,
      categoryBonuses: { 'Office Supplies': 5, 'Internet': 5, 'Cable': 5, 'Phone': 5 },
      signUpBonus: '75,000 points after $7,500 spend',
      minSpend: 7500,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['5% on business categories', '2% on gas and dining', '1% on everything else'],
      image: '/cards/chase-ink-business-cash.png'
    },
    {
      id: '25',
      name: 'American Express Business Gold',
      issuer: 'American Express',
      annualFee: 295,
      baseRewards: 1,
      categoryBonuses: { 'Top 2 Categories': 4 },
      signUpBonus: '70,000 points after $10,000 spend',
      minSpend: 10000,
      matchScore: 0,
      estimatedAnnualValue: 0,
      benefits: ['4x points on top 2 categories', '1x points on everything else', 'Employee cards'],
      image: '/cards/amex-business-gold.png'
    }
  ]

  useEffect(() => {
    if (session?.user) {
      fetchTransactions()
    }
  }, [session])

  const fetchTransactions = async () => {
    try {
      console.log('Fetching transactions...')
      const response = await fetch('/api/transactions')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Transactions data:', data)
        setTransactions(data)
        analyzeSpending(data)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeSpending = (transactions: Transaction[]) => {
    console.log('Analyzing spending for transactions:', transactions.length)
    
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    
    const recentTransactions = transactions.filter(t => {
      const isWithinDateRange = new Date(t.date) >= oneYearAgo
      
      // Use same logic as analytics page for determining spending
      // For depository accounts: negative amounts are expenses (spending)
      // For credit accounts: positive amounts are charges (spending)
      const isSpending = (t.account?.type === 'depository' && t.amount < 0) || 
                        (t.account?.type === 'credit' && t.amount > 0)
      
      // Exclude payment transactions (payments from bank accounts to credit cards)
      const description = t.description.toLowerCase()
      const merchantName = t.merchantName?.toLowerCase() || ''
      const categories = t.category || []
      
      const isPayment = 
        description.includes('payment') ||
        description.includes('credit card payment') ||
        description.includes('card payment') ||
        description.includes('minimum payment') ||
        description.includes('balance payment') ||
        merchantName.includes('payment') ||
        merchantName.includes('credit card') ||
        merchantName.includes('card payment') ||
        categories.some(cat => 
          cat.toLowerCase().includes('payment') ||
          cat.toLowerCase().includes('transfer') ||
          cat.toLowerCase().includes('credit card')
        )
      
      return isWithinDateRange && isSpending && !isPayment
    })

    console.log('Recent transactions (last 12 months):', recentTransactions.length)
    
    // Debug: Show account type breakdown
    const accountTypeBreakdown = transactions.reduce((acc, t) => {
      const accountType = t.account?.type || 'unknown'
      acc[accountType] = (acc[accountType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Account type breakdown:', accountTypeBreakdown)
    
    // Debug: Show sample transactions with account types
    console.log('Sample transactions with account info:', transactions.slice(0, 5).map(t => ({
      description: t.description,
      amount: t.amount,
      accountType: t.account?.type,
      accountName: t.account?.name,
      merchantName: t.merchantName
    })))
    
    // Debug: Show filtered out payment transactions
    const paymentTransactions = transactions.filter(t => {
      const isWithinDateRange = new Date(t.date) >= oneYearAgo
      const isSpending = (t.account?.type === 'depository' && t.amount < 0) || 
                        (t.account?.type === 'credit' && t.amount > 0)
      
      const description = t.description.toLowerCase()
      const merchantName = t.merchantName?.toLowerCase() || ''
      const categories = t.category || []
      
      const isPayment = 
        description.includes('payment') ||
        description.includes('credit card payment') ||
        description.includes('card payment') ||
        description.includes('minimum payment') ||
        description.includes('balance payment') ||
        merchantName.includes('payment') ||
        merchantName.includes('credit card') ||
        merchantName.includes('card payment') ||
        categories.some(cat => 
          cat.toLowerCase().includes('payment') ||
          cat.toLowerCase().includes('transfer') ||
          cat.toLowerCase().includes('credit card')
        )
      
      return isWithinDateRange && isSpending && isPayment
    })
    
    console.log('Filtered out payment transactions:', paymentTransactions.length)
    if (paymentTransactions.length > 0) {
      console.log('Sample payment transactions:', paymentTransactions.slice(0, 3).map(t => ({
        description: t.description,
        merchantName: t.merchantName,
        amount: t.amount,
        category: t.category
      })))
    }
    
    // Debug: Show what transactions are considered spending
    console.log('Sample spending transactions:', recentTransactions.slice(0, 5).map(t => ({
      description: t.description,
      amount: t.amount,
      accountType: t.account?.type,
      accountName: t.account?.name,
      merchantName: t.merchantName
    })))

    const categorySpending: { [key: string]: number } = {}
    let totalSpending = 0
    const excludedSpending: { [key: string]: number } = {}

    recentTransactions.forEach(transaction => {
      const category = transaction.category[0] || 'Other'
      const amount = Math.abs(transaction.amount)
      
      // Exclude categories that can't be paid with credit cards
      const excludedCategories = [
        'Other',
        'Bills & Services', 
        'Payment',
        'Transfer',
        'Deposit',
        'Withdrawal',
        'Interest',
        'Credit Card',
        'Service',
        'Insurance',
        'Utilities'
      ]
      
      const isExcludedCategory = excludedCategories.some(excluded => 
        category.toLowerCase().includes(excluded.toLowerCase())
      )
      
      if (!isExcludedCategory) {
        categorySpending[category] = (categorySpending[category] || 0) + amount
        totalSpending += amount
      } else {
        excludedSpending[category] = (excludedSpending[category] || 0) + amount
      }
    })

    console.log('Category spending (credit card eligible):', categorySpending)
    console.log('Excluded spending (not credit card eligible):', excludedSpending)
    console.log('Total spending (credit card eligible):', totalSpending)

    const topCategories = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpending) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Calculate monthly average from 12 months of data
    const monthlyAverage = totalSpending / 12

    const analysis: SpendingAnalysis = {
      totalSpending,
      categorySpending,
      topCategories,
      monthlyAverage: monthlyAverage
    }

    setSpendingAnalysis(analysis)
    calculateCardMatches(analysis)
    
    console.log('Spending analysis completed:', analysis)
  }

  const calculateCardMatches = (analysis: SpendingAnalysis) => {
    console.log('Calculating card matches for analysis:', analysis)
    
    const matchedCards = creditCards.map(card => {
      let estimatedValue = 0
      let categoryAlignment = 0

      // Calculate rewards based on spending (analysis.categorySpending is already annual totals)
      Object.entries(analysis.categorySpending).forEach(([category, amount]) => {
        // amount is already annual total from 12 months of data
        const annualAmount = amount

        // Check if category has bonus rewards
        const bonusRate = card.categoryBonuses[category] || card.baseRewards
        const baseRate = card.baseRewards

        const bonusRewards = (annualAmount * bonusRate) / 100
        const baseRewards = (annualAmount * baseRate) / 100
        const totalRewards = Math.max(bonusRewards, baseRewards)

        estimatedValue += totalRewards

        // Calculate category alignment for bonus
        if (card.categoryBonuses[category]) {
          categoryAlignment += (amount / analysis.totalSpending) * 100
        }
      })

      // Adjust for annual fee
      const netValue = estimatedValue - card.annualFee
      estimatedValue = Math.max(0, netValue)

      // New match score calculation: directly based on estimated value
      // Scale to make match scores more appealing (60-100% range)
      const valueScore = Math.min(estimatedValue * 0.2, 80) // $400 = 80% match
      
      // Category alignment bonus: 0-15 points (moderate bonus)
      const categoryScore = Math.min(categoryAlignment * 0.15, 15)
      
      // Base score for all cards (minimum 60% to look appealing)
      const baseScore = 60
      
      const matchScore = valueScore + categoryScore + baseScore

      console.log(`Card ${card.name}: valueScore=${valueScore.toFixed(1)}, categoryScore=${categoryScore.toFixed(1)}, matchScore=${Math.round(matchScore)}, estimatedValue=${Math.round(estimatedValue)}`)
      console.log(`  - Category alignment: ${categoryAlignment.toFixed(1)}%`)
      console.log(`  - Value scaling: ${estimatedValue} * 0.2 = ${valueScore.toFixed(1)}`)

      return {
        ...card,
        matchScore: Math.round(matchScore),
        estimatedAnnualValue: Math.round(estimatedValue)
      }
    })

    // Sort by match score and estimated value
    const sortedCards = matchedCards
      .sort((a, b) => {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore
        }
        return b.estimatedAnnualValue - a.estimatedAnnualValue
      })

    console.log('Sorted cards (final order):')
    sortedCards.forEach((card, index) => {
      console.log(`${index + 1}. ${card.name}: matchScore=${card.matchScore}%, estimatedValue=$${card.estimatedAnnualValue}`)
    })
    setRecommendedCards(sortedCards)
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dining':
      case 'restaurants':
      case 'food and dining':
        return '🍽️'
      case 'groceries':
      case 'food':
        return '🛒'
      case 'travel':
      case 'transportation':
      case 'airline':
        return '✈️'
      case 'entertainment':
      case 'recreation':
      case 'sports':
        return '🎬'
      case 'gas':
      case 'fuel':
        return '⛽'
      case 'shopping':
      case 'retail':
      case 'general merchandise':
        return '🛍️'
      case 'utilities':
      case 'electric':
      case 'water':
      case 'internet':
      case 'phone':
      case 'cable':
        return '⚡'
      case 'healthcare':
      case 'medical':
      case 'pharmacy':
      case 'dental':
      case 'vision':
        return '🏥'
      case 'insurance':
      case 'auto insurance':
      case 'health insurance':
      case 'life insurance':
        return '🛡️'
      case 'education':
      case 'tuition':
      case 'books':
      case 'school':
        return '🎓'
      case 'housing':
      case 'rent':
      case 'mortgage':
      case 'property management':
      case 'real estate':
        return '🏠'
      case 'transportation':
      case 'uber':
      case 'lyft':
      case 'taxi':
        return '🚗'
      case 'gym':
      case 'fitness':
        return '💪'
      case 'movies':
      case 'theater':
        return '🎭'
      case 'clothing':
      case 'apparel':
        return '👕'
      case 'electronics':
        return '📱'
      case 'personal care':
        return '💄'
      case 'business services':
        return '💼'
      case 'service':
        return '🔧'
      case 'payment':
        return '💳'
      case 'interest':
        return '💰'
      case 'transfer':
        return '🔄'
      case 'deposit':
        return '📈'
      case 'withdrawal':
        return '📉'
      case 'other':
      case 'miscellaneous':
        return '📦'
      default:
        return '💳'
    }
  }

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Credit Card</h1>
          <p className="text-gray-600">Based on your spending patterns, we've found the best credit cards for you</p>
        </div>

        {/* Spending Analysis */}
        {spendingAnalysis && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Your Spending Analysis (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Spending</p>
                  <p className="text-2xl font-bold text-gray-900">${spendingAnalysis.totalSpending.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Average</p>
                  <p className="text-2xl font-bold text-gray-900">${spendingAnalysis.monthlyAverage.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Category</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {spendingAnalysis.topCategories[0]?.category || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-900 mb-3">Spending by Category</p>
                <div className="space-y-2">
                  {spendingAnalysis.topCategories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(category.category)}</span>
                        <span className="text-sm text-gray-700">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          ${category.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All Cards' },
              { id: 'no-fee', label: 'No Annual Fee' },
              { id: 'cashback', label: 'Cash Back' },
              { id: 'travel', label: 'Travel' },
              { id: 'luxury', label: 'Luxury' },
              { id: 'balance-transfer', label: 'Balance Transfer' },
              { id: 'student', label: 'Student' },
              { id: 'business', label: 'Business' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Credit Card Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedCards
            .filter(card => {
              if (selectedFilter === 'all') return true
              if (selectedFilter === 'no-fee') return card.annualFee === 0
              if (selectedFilter === 'cashback') return card.name.toLowerCase().includes('cash') || card.name.toLowerCase().includes('double cash') || card.name.toLowerCase().includes('active cash')
              if (selectedFilter === 'travel') return card.name.toLowerCase().includes('travel') || card.name.toLowerCase().includes('sapphire') || card.name.toLowerCase().includes('venture') || card.name.toLowerCase().includes('platinum')
              if (selectedFilter === 'luxury') return card.annualFee >= 250 || card.name.toLowerCase().includes('reserve') || card.name.toLowerCase().includes('platinum')
              if (selectedFilter === 'balance-transfer') return card.name.toLowerCase().includes('simplicity') || card.name.toLowerCase().includes('slate') || card.name.toLowerCase().includes('reflect') || card.signUpBonus.toLowerCase().includes('apr')
              if (selectedFilter === 'student') return card.name.toLowerCase().includes('student') || card.name.toLowerCase().includes('journey')
              if (selectedFilter === 'business') return card.name.toLowerCase().includes('business') || card.name.toLowerCase().includes('ink')
              return true
            })
            .map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {card.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {card.issuer}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getMatchColor(card.matchScore)}`}>
                      {card.matchScore}% match
                    </div>
                    <div className="text-xs text-gray-500">Best for you</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Rewards Structure */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Base Rewards</span>
                    <span className="text-sm font-bold text-gray-900">{card.baseRewards}%</span>
                  </div>
                  
                  {Object.entries(card.categoryBonuses).map(([category, rate]) => (
                    <div key={category} className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{category}</span>
                      <span className="text-sm font-medium text-green-600">{rate}%</span>
                    </div>
                  ))}
                </div>

                {/* Annual Fee */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-700">Annual Fee</span>
                  <span className={`text-sm font-bold ${card.annualFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {card.annualFee === 0 ? 'No Fee' : `$${card.annualFee}`}
                  </span>
                </div>

                {/* Estimated Annual Value */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Estimated Annual Value</span>
                    <span className="text-lg font-bold text-blue-900">
                      ${card.estimatedAnnualValue}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Based on your spending patterns
                  </p>
                </div>

                {/* Sign-up Bonus */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium text-gray-700">Sign-up Bonus</span>
                  </div>
                  <p className="text-sm text-gray-600">{card.signUpBonus}</p>
                </div>

                {/* Key Benefits */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Benefits</p>
                  <ul className="space-y-1">
                    {card.benefits.slice(0, 3).map((benefit, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="text-green-500 mr-1">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Apply Button */}
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Recommendations are based on your spending patterns and may not reflect all available offers.
            <br />
            Terms and conditions apply. Credit approval required.
          </p>
        </div>
      </div>
    </div>
  )
}
