import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AnalyticsContent from '@/components/dashboard/AnalyticsContent'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as any)?.id) {
    redirect('/auth/signin')
  }

  const userId = (session?.user as any)?.id

  // Get user's accounts
  const accounts = await prisma.account.findMany({
    where: { userId: userId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  // Get transactions for analytics (last 90 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)

  const transactions = await prisma.transaction.findMany({
    where: { 
      userId: userId,
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: { account: true },
    orderBy: { date: 'desc' },
  })

  // Get monthly transaction data for trends (extend to include more months)
  const monthlyTransactions = await prisma.transaction.findMany({
    where: { 
      userId: userId,
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth() - 12, 1), // Last 12 months to ensure we get October 2025
      }
    },
    include: { account: true },
    orderBy: { date: 'desc' },
  })

  if (!accounts.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Financial insights and spending analysis</p>
        </div>
        
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No Analytics Available</h3>
            <p className="mb-4">Connect your accounts and sync transactions to see financial insights.</p>
            <a 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              Connect Accounts
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Financial insights and spending analysis</p>
      </div>

      <AnalyticsContent 
        accounts={accounts}
        transactions={transactions}
        monthlyTransactions={monthlyTransactions}
      />
    </div>
  )
}
