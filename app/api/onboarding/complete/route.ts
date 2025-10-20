import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName } = await request.json()

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json({ 
        error: 'First name and last name are required' 
      }, { status: 400 })
    }

    if (typeof firstName !== 'string' || typeof lastName !== 'string') {
      return NextResponse.json({ 
        error: 'First name and last name must be strings' 
      }, { status: 400 })
    }

    if (firstName.trim().length === 0 || lastName.trim().length === 0) {
      return NextResponse.json({ 
        error: 'First name and last name cannot be empty' 
      }, { status: 400 })
    }

    // Update user with onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        onboardingCompleted: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        onboardingCompleted: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    })

  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
