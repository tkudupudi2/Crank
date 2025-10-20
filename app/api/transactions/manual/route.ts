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

    const userId = (session.user as any).id
    const body = await request.json()
    
    const {
      description,
      amount,
      date,
      categories,
      accountType,
      accountId,
      customAccountName
    } = body

    // Validate required fields
    if (!description || !amount || !date || !categories || !accountType) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Validate categories
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ 
        error: 'At least one category is required' 
      }, { status: 400 })
    }

    // Validate amount
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount === 0) {
      return NextResponse.json({ 
        error: 'Amount must be a valid number greater than 0' 
      }, { status: 400 })
    }

    let targetAccountId: string | null = null

    // Handle different account types
    if (accountType === 'existing') {
      if (!accountId) {
        return NextResponse.json({ 
          error: 'Account ID is required for existing accounts' 
        }, { status: 400 })
      }

      // Verify the account belongs to the user
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: userId
        }
      })

      if (!account) {
        return NextResponse.json({ 
          error: 'Account not found or does not belong to user' 
        }, { status: 404 })
      }

      targetAccountId = accountId
    } else if (accountType === 'cash' || accountType === 'other') {
      // For cash or other accounts, we'll create a virtual account
      const accountName = accountType === 'cash' ? 'Cash' : customAccountName
      
      if (!accountName) {
        return NextResponse.json({ 
          error: 'Account name is required for cash/other accounts' 
        }, { status: 400 })
      }

      // Check if a virtual account already exists for this user
      let virtualAccount = await prisma.account.findFirst({
        where: {
          userId: userId,
          name: accountName,
          type: accountType === 'cash' ? 'depository' : 'other',
          isVirtual: true
        }
      })

      // Create virtual account if it doesn't exist
      if (!virtualAccount) {
        virtualAccount = await prisma.account.create({
          data: {
            userId: userId,
            name: accountName,
            type: accountType === 'cash' ? 'depository' : 'other',
            subtype: accountType === 'cash' ? 'cash' : 'other',
            institutionName: accountType === 'cash' ? 'Cash' : 'Manual Entry',
            isVirtual: true,
            isActive: true,
            currentBalance: 0,
            availableBalance: 0,
            mask: null,
            plaidAccountId: null,
            plaidItemId: null,
            institutionId: 'virtual'
          }
        })
      }

      targetAccountId = virtualAccount.id
    }

    if (!targetAccountId) {
      return NextResponse.json({ 
        error: 'Failed to determine target account' 
      }, { status: 500 })
    }

        // Create the manual transaction (amount should be negative for expenses)
        const transaction = await prisma.transaction.create({
          data: {
            userId: userId,
            accountId: targetAccountId,
            plaidTransactionId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: -Math.abs(numericAmount), // Always negative for expenses
            description: description,
            merchantName: null,
            category: categories,
            subcategory: null,
            date: new Date(date),
            pending: false,
            accountOwner: null,
            isManual: true,
            // Location fields for manual transactions (null by default)
            address: null,
            city: null,
            region: null,
            postalCode: null,
            country: null,
            storeNumber: null
          }
        })

    // Update account balance if it's a virtual account (subtract the amount)
    if (accountType === 'cash' || accountType === 'other') {
      const account = await prisma.account.findUnique({
        where: { id: targetAccountId }
      })

      if (account) {
        const newBalance = (account.currentBalance || 0) - Math.abs(numericAmount)
        await prisma.account.update({
          where: { id: targetAccountId },
          data: {
            currentBalance: newBalance,
            availableBalance: newBalance
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date
      }
    })

  } catch (error) {
    console.error('Error creating manual transaction:', error)
    return NextResponse.json({ 
      error: 'Failed to create transaction' 
    }, { status: 500 })
  }
}
