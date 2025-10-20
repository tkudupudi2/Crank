import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SettingsContent from '@/components/dashboard/SettingsContent'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !(session.user as any).id) {
    redirect('/auth/signin')
  }

  // Get user data and connected accounts
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  })

  const connectedAccounts = await prisma.account.findMany({
    where: { userId: (session.user as any).id, isActive: true },
    include: {
      user: {
        select: { email: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  const plaidItems = await prisma.plaidItem.findMany({
    where: { userId: (session.user as any).id },
    select: {
      id: true,
      institutionName: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and connected services</p>
      </div>

      <SettingsContent 
        user={user}
        connectedAccounts={connectedAccounts}
        plaidItems={plaidItems}
      />
    </div>
  )
}
