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
    const { categoryOrder, categoryBudgets, categoryColors } = body

    // Store user preferences in database
    await prisma.userPreferences.upsert({
      where: { userId: userId },
      update: {
        budgetCategoryOrder: categoryOrder,
        budgetCategoryBudgets: categoryBudgets,
        budgetCategoryColors: categoryColors,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        budgetCategoryOrder: categoryOrder,
        budgetCategoryBudgets: categoryBudgets,
        budgetCategoryColors: categoryColors
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving budget preferences:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
