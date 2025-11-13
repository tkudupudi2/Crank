import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PaymentsContent from '@/components/dashboard/PaymentsContent'
import { APP_SIDE_COMPUTE } from '@/lib/config'

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as any)?.id) {
    redirect('/auth/signin')
  }

  const userId = (session?.user as any)?.id

  // Get all transactions for payment analysis
  const transactionsRaw = await prisma.transaction.findMany({
    where: { userId: userId },
    include: { account: true },
    take: 500,
  })
  const transactions = APP_SIDE_COMPUTE
    ? transactionsRaw.slice().sort((a: any, b: any) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime())
    : transactionsRaw

  // Get liability accounts for future payments
  const liabilityAccounts = await prisma.account.findMany({
    where: { 
      userId: userId, 
      isActive: true,
      type: { in: ['credit', 'loan'] }
    } as any,
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage your payment history, recurring payments, and upcoming bills</p>
      </div>

      <PaymentsContent 
        transactions={transactions as any} 
        liabilityAccounts={liabilityAccounts as any} 
      />
    </div>
  )
}