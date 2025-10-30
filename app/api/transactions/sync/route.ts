import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { plaidClient } from '@/lib/plaid'

// Merchant to category mapping for fallback when Plaid doesn't provide categories
function getCategoryFromMerchant(merchantName: string): string[] {
  const name = merchantName.toLowerCase()
  
  // Food and Dining
  if (name.includes('mcdonald') || name.includes('kfc') || name.includes('starbucks') || 
      name.includes('restaurant') || name.includes('cafe') || name.includes('food')) {
    return ['Food and Dining']
  }
  
  // Transportation
  if (name.includes('uber') || name.includes('lyft') || name.includes('taxi') || 
      name.includes('gas') || name.includes('fuel') || name.includes('airline') ||
      name.includes('united') || name.includes('delta') || name.includes('southwest')) {
    return ['Transportation']
  }
  
  // Entertainment
  if (name.includes('climbing') || name.includes('gym') || name.includes('fitness') ||
      name.includes('movie') || name.includes('theater') || name.includes('fun')) {
    return ['Entertainment']
  }
  
  // Shopping
  if (name.includes('shop') || name.includes('store') || name.includes('retail') ||
      name.includes('bicycle') || name.includes('madison')) {
    return ['Shopping']
  }
  
  // Payments and Transfers
  if (name.includes('payment') || name.includes('transfer') || name.includes('credit card') ||
      name.includes('automatic')) {
    return ['Payment']
  }
  
  // Interest and Banking
  if (name.includes('interest') || name.includes('intrst') || name.includes('pymnt')) {
    return ['Interest']
  }
  
  // Business/Professional
  if (name.includes('tectra') || name.includes('inc') || name.includes('corp')) {
    return ['Business Services']
  }
  
  // Default category
  return ['Other']
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get or create sync status for user
    let syncStatus = await prisma.syncStatus.findUnique({
      where: { userId: userId },
    })

    if (!syncStatus) {
      syncStatus = await prisma.syncStatus.create({
        data: {
          userId: userId,
          hasInitialSync: false,
        },
      })
    }

    // Get user's Plaid items
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: userId },
    })

    if (plaidItems.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No accounts connected',
        newTransactions: 0,
        updatedTransactions: 0
      })
    }

    console.log(`Manual syncing transactions for ${plaidItems.length} Plaid items`)
    
    let totalNewTransactions = 0
    let totalUpdatedTransactions = 0
    const errors = []

    // Sync transactions for each Plaid item
    for (const item of plaidItems) {
      try {
        // Determine sync period based on whether this is initial sync or update
        const endDate = new Date()
        let startDate = new Date()
        
        if (syncStatus.hasInitialSync && item.lastSyncAt) {
          // For updates, sync from last sync time
          startDate = new Date(item.lastSyncAt)
          console.log(`Incremental sync for ${item.institutionName} from ${startDate.toISOString()}`)
        } else {
          // For initial sync, get last 180 days
          startDate.setDate(startDate.getDate() - 180)
          console.log(`Initial sync for ${item.institutionName} from last 180 days`)
        }

        // Format dates as YYYY-MM-DD strings
        const formatDate = (date: Date) => date.toISOString().split('T')[0]

        // Get transactions
        const response = await plaidClient.transactionsGet({
          access_token: item.accessToken,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        })

        // Skip liabilities fetch since we're not requesting the liabilities product
        // This prevents errors when syncing accounts from institutions that don't support liabilities
        let liabilitiesData = null
        console.log(`Skipping liabilities fetch for ${item.institutionName} - not requested in link token to avoid compatibility issues`)

        const transactions = response.data.transactions
        console.log(`Fetched ${transactions.length} transactions from ${item.institutionName}`)

        // Store transactions in database
        let newCount = 0
        let updatedCount = 0
        
        for (const transaction of transactions) {
          const account = await prisma.account.findFirst({
            where: { plaidAccountId: transaction.account_id },
          })

          if (account) {
            // Determine correct amount based on transaction direction and type
            let correctedAmount = transaction.amount

            // Check if this is an interest payment
            const isInterestPayment = (transaction.name && transaction.name.toLowerCase().includes('intrst')) ||
                                     (transaction.merchant_name && transaction.merchant_name.toLowerCase().includes('intrst'))

            // If direction is available, use it to determine correct polarity
            const transactionDirection = (transaction as any).direction
            if (transactionDirection) {
              if (transactionDirection === 'OUTFLOW') {
                // For savings accounts, interest payments should be positive even if marked as OUTFLOW
                if (account.type === 'depository' && isInterestPayment) {
                  correctedAmount = Math.abs(transaction.amount) // Interest is income for savings
                } else if (account.type === 'credit') {
                  // For credit cards, OUTFLOW could be either charges or payments
                  const isPaymentTransaction = transaction.name.toLowerCase().includes('payment') ||
                                             transaction.name.toLowerCase().includes('thank')
                  if (isPaymentTransaction) {
                    // Credit card payments should be negative (reduce debt)
                    correctedAmount = -Math.abs(transaction.amount)
                  } else {
                    // Credit card charges should be positive (increase debt)
                    correctedAmount = Math.abs(transaction.amount)
                  }
                } else {
                  correctedAmount = -Math.abs(transaction.amount) // Regular expense
                }
              } else if (transactionDirection === 'INFLOW') {
                // For credit cards, INFLOW could be payments (which should be negative)
                if (account.type === 'credit') {
                  const isPaymentTransaction = transaction.name.toLowerCase().includes('payment') ||
                                             transaction.name.toLowerCase().includes('thank')
                  if (isPaymentTransaction) {
                    // Credit card payments should be negative (reduce debt)
                    correctedAmount = -Math.abs(transaction.amount)
                  } else {
                    // Credit card refunds should be negative (reduce debt)
                    correctedAmount = -Math.abs(transaction.amount)
                  }
                } else {
                  // Money coming in (income/refund) should be positive
                  correctedAmount = Math.abs(transaction.amount)
                }
              }
            } else {
              // Fallback logic for accounts without direction field
              if (account.type === 'depository') {
                // For savings accounts, interest payments should be positive
                if (isInterestPayment) {
                  correctedAmount = Math.abs(transaction.amount)
                } else {
                  correctedAmount = -Math.abs(transaction.amount)
                }
              } else if (account.type === 'credit') {
                // For credit accounts, handle payments specially
                const isPaymentTransaction = transaction.name.toLowerCase().includes('payment') ||
                                           transaction.name.toLowerCase().includes('thank')
                
                if (isPaymentTransaction) {
                  // Credit card payments should always be negative (reduce debt)
                  correctedAmount = -Math.abs(transaction.amount)
                } else {
                  // Credit card charges should be positive (increase debt)
                  correctedAmount = Math.abs(transaction.amount)
                }
              }
            }

            // Get categories from Plaid or use fallback mapping
            let categories = transaction.category || []
            
            // If no categories from Plaid, use merchant-based mapping
            if (categories.length === 0) {
              const merchantName = transaction.merchant_name || transaction.name
              categories = getCategoryFromMerchant(merchantName)
            }

            const existingTransaction = await prisma.transaction.findUnique({
              where: { plaidTransactionId: transaction.transaction_id },
            })

            if (existingTransaction) {
              // Update existing transaction
              await prisma.transaction.update({
                where: { plaidTransactionId: transaction.transaction_id },
                data: {
                  amount: correctedAmount,
                  description: transaction.name,
                  merchantName: transaction.merchant_name,
                  category: categories,
                  subcategory: (transaction as any).subcategory,
                  date: new Date(transaction.date),
                  pending: transaction.pending,
                },
              })
              updatedCount++
            } else {
              // Create new transaction
              await prisma.transaction.create({
                data: {
                  userId: userId,
                  accountId: account.id,
                  plaidTransactionId: transaction.transaction_id,
                  amount: correctedAmount,
                  description: transaction.name,
                  merchantName: transaction.merchant_name,
                  category: categories,
                  subcategory: (transaction as any).subcategory,
                  date: new Date(transaction.date),
                  pending: transaction.pending,
                  accountOwner: transaction.account_owner,
                },
              })
              newCount++
            }
          }
        }

        // Update account liabilities information for credit cards
        if (liabilitiesData && (liabilitiesData as any).credit) {
          for (const creditLiability of (liabilitiesData as any).credit) {
            const account = await prisma.account.findFirst({
              where: { plaidAccountId: creditLiability.account_id },
            })
            
            if (account && account.type === 'credit') {
              const dueDate = creditLiability.next_payment_due_date 
                ? new Date(creditLiability.next_payment_due_date) 
                : null
              const minimumPayment = creditLiability.minimum_payment_amount || null
              
              await prisma.account.update({
                where: { id: account.id },
                data: {
                  dueDate: dueDate,
                  minimumPayment: minimumPayment,
                },
              })
              
              console.log(`Updated liabilities for ${account.name}: due ${dueDate}, min payment ${minimumPayment}`)
            }
          }
        }

        // Update PlaidItem lastSyncAt
        await prisma.plaidItem.update({
          where: { id: item.id },
          data: { lastSyncAt: new Date() },
        })

        totalNewTransactions += newCount
        totalUpdatedTransactions += updatedCount
        
        console.log(`Synced ${item.institutionName}: ${newCount} new, ${updatedCount} updated`)
      } catch (error) {
        console.error(`Error syncing transactions for item ${item.id}:`, error)
        errors.push(`Failed to sync transactions for ${item.institutionName}`)
      }
    }

    // Update sync status
    await prisma.syncStatus.update({
      where: { userId: userId },
      data: {
        hasInitialSync: true,
        lastSyncAt: new Date(),
      },
    })

    const result = {
      success: true,
      message: `Synced ${totalNewTransactions} new transactions and updated ${totalUpdatedTransactions} existing transactions`,
      newTransactions: totalNewTransactions,
      updatedTransactions: totalUpdatedTransactions,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log(`Manual sync complete:`, result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in manual sync:', error)
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    const syncStatus = await prisma.syncStatus.findUnique({
      where: { userId: userId },
    })

    return NextResponse.json({
      hasInitialSync: syncStatus?.hasInitialSync || false,
      lastSyncAt: syncStatus?.lastSyncAt || null,
    })

  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    )
  }
}
