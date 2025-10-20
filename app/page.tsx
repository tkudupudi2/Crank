import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LandingPage from '@/components/landing/LandingPage'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    // Check if user has completed onboarding
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { onboardingCompleted: true }
    })

    if (user?.onboardingCompleted) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  return <LandingPage />
}
