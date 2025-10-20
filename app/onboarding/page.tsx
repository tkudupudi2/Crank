import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/')
  }

  // Check if user has already completed onboarding
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { firstName: true, lastName: true, onboardingCompleted: true }
  })

  if (user?.onboardingCompleted) {
    redirect('/dashboard')
  }

  return <OnboardingForm />
}
