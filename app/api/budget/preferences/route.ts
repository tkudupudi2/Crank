import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session?.user as any)?.id

  try {
    const body = await request.json()
    const { totalBudget, duration, customStartDate, customEndDate } = body

    // Get existing preferences to preserve other fields
    const existingPrefs = await prisma.userPreferences.findUnique({
      where: { userId: userId }
    })

    // Store budget preferences in database
    await prisma.userPreferences.upsert({
      where: { userId: userId },
      update: {
        budgetPreferences: {
          totalBudget,
          duration,
          customStartDate,
          customEndDate
        },
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        budgetCategoryOrder: [],
        budgetCategoryBudgets: {},
        budgetCategoryColors: {},
        budgetPreferences: {
          totalBudget,
          duration,
          customStartDate,
          customEndDate
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving budget preferences:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
