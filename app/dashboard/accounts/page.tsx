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
    where: { 
      userId: (session?.user as any)?.id, 
      isActive: true,
      isVirtual: false // Exclude virtual/manual accounts
    } as any,
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
          dueDate: (account as any).dueDate?.toISOString() || null,
          lastPaymentDate: (account as any).lastPaymentDate?.toISOString() || null,
          maturityDate: (account as any).maturityDate?.toISOString() || null,
          originationDate: (account as any).originationDate?.toISOString() || null,
          aprs: (account as any).aprs,
        }))}
        creditCards={creditCards.map(account => ({
          ...account,
          dueDate: (account as any).dueDate?.toISOString() || null,
          lastPaymentDate: (account as any).lastPaymentDate?.toISOString() || null,
          maturityDate: (account as any).maturityDate?.toISOString() || null,
          originationDate: (account as any).originationDate?.toISOString() || null,
          aprs: (account as any).aprs,
        }))}
        bankAccounts={bankAccounts.map(account => ({
          ...account,
          dueDate: (account as any).dueDate?.toISOString() || null,
          lastPaymentDate: (account as any).lastPaymentDate?.toISOString() || null,
          maturityDate: (account as any).maturityDate?.toISOString() || null,
          originationDate: (account as any).originationDate?.toISOString() || null,
          aprs: (account as any).aprs,
        }))}
        mortgages={mortgages.map(account => ({
          ...account,
          dueDate: (account as any).dueDate?.toISOString() || null,
          lastPaymentDate: (account as any).lastPaymentDate?.toISOString() || null,
          maturityDate: (account as any).maturityDate?.toISOString() || null,
          originationDate: (account as any).originationDate?.toISOString() || null,
          aprs: (account as any).aprs,
        }))}
        studentLoans={studentLoans.map(account => ({
          ...account,
          dueDate: (account as any).dueDate?.toISOString() || null,
          lastPaymentDate: (account as any).lastPaymentDate?.toISOString() || null,
          maturityDate: (account as any).maturityDate?.toISOString() || null,
          originationDate: (account as any).originationDate?.toISOString() || null,
          aprs: (account as any).aprs,
        }))}
      />
    </div>
  )
}
