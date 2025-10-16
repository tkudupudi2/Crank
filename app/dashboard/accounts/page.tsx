import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AccountsList from '@/components/dashboard/AccountsList'
import { redirect } from 'next/navigation'

export default async function AccountsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  const creditCards = accounts.filter(account => account.type === 'credit')
  const bankAccounts = accounts.filter(account => account.type === 'depository')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your connected accounts</p>
      </div>

      <AccountsList
        accounts={accounts}
        creditCards={creditCards}
        bankAccounts={bankAccounts}
      />
    </div>
  )
}
