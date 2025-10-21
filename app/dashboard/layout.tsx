import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardNav from '@/components/dashboard/DashboardNav'
import BetaFeedbackWrapper from '@/components/dashboard/BetaFeedbackWrapper'
import ChatWidget from '@/components/chat/ChatWidget'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user has completed onboarding
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { onboardingCompleted: true }
  })

  if (!user?.onboardingCompleted) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="p-6">
        {children}
      </main>
      <BetaFeedbackWrapper />
      <ChatWidget />
    </div>
  )
}
