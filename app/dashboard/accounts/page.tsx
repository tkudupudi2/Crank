import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AccountsList from '@/components/dashboard/AccountsList'
import { redirect } from 'next/navigation'

export default async function AccountsPage() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as any)?.id) {
    redirect('/auth/signin')
  }

  const accounts = await prisma.account.findMany({
    where: { userId: (session?.user as any)?.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  const creditCards = accounts.filter(account => account.type === 'credit')
  const bankAccounts = accounts.filter(account => account.type === 'depository')
  const mortgages = accounts.filter(account => account.subtype === 'mortgage')
  const studentLoans = accounts.filter(account => account.subtype === 'student')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
        <p className="text-gray-600">Manage your connected accounts</p>
      </div>

      <AccountsList
        accounts={accounts.map(account => ({
          ...account,
          dueDate: account.dueDate?.toISOString() || null,
          lastPaymentDate: account.lastPaymentDate?.toISOString() || null,
          maturityDate: account.maturityDate?.toISOString() || null,
          originationDate: account.originationDate?.toISOString() || null,
          aprs: account.aprs as any,
        }))}
        creditCards={creditCards.map(account => ({
          ...account,
          dueDate: account.dueDate?.toISOString() || null,
          lastPaymentDate: account.lastPaymentDate?.toISOString() || null,
          maturityDate: account.maturityDate?.toISOString() || null,
          originationDate: account.originationDate?.toISOString() || null,
          aprs: account.aprs as any,
        }))}
        bankAccounts={bankAccounts.map(account => ({
          ...account,
          dueDate: account.dueDate?.toISOString() || null,
          lastPaymentDate: account.lastPaymentDate?.toISOString() || null,
          maturityDate: account.maturityDate?.toISOString() || null,
          originationDate: account.originationDate?.toISOString() || null,
          aprs: account.aprs as any,
        }))}
        mortgages={mortgages.map(account => ({
          ...account,
          dueDate: account.dueDate?.toISOString() || null,
          lastPaymentDate: account.lastPaymentDate?.toISOString() || null,
          maturityDate: account.maturityDate?.toISOString() || null,
          originationDate: account.originationDate?.toISOString() || null,
          aprs: account.aprs as any,
        }))}
        studentLoans={studentLoans.map(account => ({
          ...account,
          dueDate: account.dueDate?.toISOString() || null,
          lastPaymentDate: account.lastPaymentDate?.toISOString() || null,
          maturityDate: account.maturityDate?.toISOString() || null,
          originationDate: account.originationDate?.toISOString() || null,
          aprs: account.aprs as any,
        }))}
      />
    </div>
  )
}
