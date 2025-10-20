import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import AnalyticsBlurb from '@/components/dashboard/AnalyticsBlurb'
import AccountConnection from '@/components/dashboard/AccountConnection'
import { redirect } from 'next/navigation'

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 3 && hour < 12) {
    return 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon'
  } else {
    return 'Good evening'
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as any)?.id) {
    redirect('/auth/signin')
  }

  const userId = (session?.user as any)?.id

  // Check if user has completed onboarding and get firstName
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      onboardingCompleted: true,
      firstName: true
    }
  })

  if (!user?.onboardingCompleted) {
    redirect('/onboarding')
  }

  // Get all user's accounts for accurate counts (exclude virtual accounts)
  const allAccounts = await prisma.account.findMany({
    where: { 
      userId: userId, 
      isActive: true,
      isVirtual: false // Exclude virtual/manual accounts
    } as any,
    orderBy: { createdAt: 'desc' },
  })

  // Get recent transactions (limit to 6 for dashboard display, exclude virtual accounts)
  const recentTransactions = await prisma.transaction.findMany({
    where: { 
      userId: userId,
      account: {
        isVirtual: false // Exclude transactions from virtual accounts
      } as any
    },
    include: { account: true },
    orderBy: { date: 'desc' },
    take: 6,
  })

  // Get all transactions for analytics (last 90 days, include manual transactions for spending analysis)
  const allTransactions = await prisma.transaction.findMany({
    where: { 
      userId: userId,
      date: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      }
      // Include both real accounts and manual transactions for spending analysis
    },
    include: { account: true },
    orderBy: { date: 'desc' },
  })

  // Calculate net worth (assets minus debts)
  const bankAccounts = allAccounts.filter((account: any) => account.type === 'depository')
  const creditCards = allAccounts.filter((account: any) => account.type === 'credit')
  
  // Limit accounts for display (first 5)
  const accounts = allAccounts.slice(0, 5)
  
  const bankAccountBalance = bankAccounts.reduce((sum: number, account: any) => {
    return sum + (account.currentBalance || 0)
  }, 0)
  
  const creditCardDebt = creditCards.reduce((sum: number, account: any) => {
    return sum + (account.currentBalance || 0)
  }, 0)
  
  const netWorth = bankAccountBalance - creditCardDebt

  const greeting = getTimeBasedGreeting()
  const displayName = user?.firstName || (session?.user as any)?.name || 'there'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">{greeting}, {displayName}!</p>
      </div>

      {accounts.length === 0 ? (
        <AccountConnection />
      ) : (
        <>
      <DashboardOverview
        accounts={accounts}
        netWorth={netWorth}
        creditCards={creditCards}
        bankAccounts={bankAccounts}
        recentTransactions={recentTransactions}
      />
          
          {/* Analytics Blurb */}
          {allTransactions.length > 0 && (
            <AnalyticsBlurb 
              transactions={allTransactions}
              accounts={allAccounts}
            />
          )}
        </>
      )}
    </div>
  )
}
