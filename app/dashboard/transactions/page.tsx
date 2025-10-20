import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { plaidClient } from '@/lib/plaid'
import TransactionsList from '@/components/dashboard/TransactionsList'
import { redirect } from 'next/navigation'

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

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as any)?.id) {
    redirect('/auth/signin')
  }

  const userId = (session?.user as any)?.id

  // Check if user has initial sync
  const syncStatus = await prisma.syncStatus.findUnique({
    where: { userId: userId },
  })

  // Only auto-sync if user hasn't had initial sync yet
  let syncResult = null
  if (!syncStatus?.hasInitialSync) {
    try {
      console.log('Performing initial sync for user')
      
      // Get user's Plaid items
      const plaidItems = await prisma.plaidItem.findMany({
        where: { userId: userId },
      })

      if (plaidItems.length > 0) {
        console.log(`Initial sync for ${plaidItems.length} Plaid items`)
      
        let totalTransactions = 0
        const errors = []

        // Sync transactions for each Plaid item (last 90 days for initial sync)
        for (const item of plaidItems) {
          try {
            // Get transactions from the last 90 days for initial sync
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 90)

            // Format dates as YYYY-MM-DD strings
            const formatDate = (date: Date) => date.toISOString().split('T')[0]

            const response = await plaidClient.transactionsGet({
              access_token: item.accessToken,
              start_date: formatDate(startDate),
              end_date: formatDate(endDate),
            })

            const transactions = response.data.transactions

            console.log(`Sample transaction from ${item.institutionName}:`, {
              name: transactions[0]?.name,
              amount: transactions[0]?.amount,
              category: transactions[0]?.category,
              merchant_name: transactions[0]?.merchant_name
            })

            // Store transactions in database
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
                    } else {
                      correctedAmount = -Math.abs(transaction.amount) // Regular expense
                    }
                  } else if (transactionDirection === 'INFLOW') {
                    // Money coming in (income/refund) should be positive
                    correctedAmount = Math.abs(transaction.amount)
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
                  }
                }

                // Get categories from Plaid or use fallback mapping
                let categories = transaction.category || []
                
                // If no categories from Plaid, use merchant-based mapping
                if (categories.length === 0) {
                  const merchantName = transaction.merchant_name || transaction.name
                  categories = getCategoryFromMerchant(merchantName)
                }

                await prisma.transaction.upsert({
                  where: { plaidTransactionId: transaction.transaction_id },
                  update: {
                    amount: correctedAmount,
                    description: transaction.name,
                    merchantName: transaction.merchant_name,
                    category: categories,
                    subcategory: (transaction as any).subcategory,
                    date: new Date(transaction.date),
                    pending: transaction.pending,
                    // Location data
                    address: transaction.location?.address || null,
                    city: transaction.location?.city || null,
                    region: transaction.location?.region || null,
                    postalCode: transaction.location?.postal_code || null,
                    country: transaction.location?.country || null,
                    storeNumber: (transaction as any).store_number || null,
                  } as any,
                  create: {
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
                    // Location data
                    address: transaction.location?.address || null,
                    city: transaction.location?.city || null,
                    region: transaction.location?.region || null,
                    postalCode: transaction.location?.postal_code || null,
                    country: transaction.location?.country || null,
                    storeNumber: (transaction as any).store_number || null,
                  } as any,
                })
                totalTransactions++
              }
            }

            // Update PlaidItem lastSyncAt
            await prisma.plaidItem.update({
              where: { id: item.id },
              data: { lastSyncAt: new Date() },
            })

            console.log(`Initial sync completed for ${item.institutionName}: ${transactions.length} transactions`)
          } catch (error) {
            console.error(`Error in initial sync for item ${item.id}:`, error)
            errors.push(`Failed to sync transactions for ${item.institutionName}`)
          }
        }

        // Mark initial sync as complete
        await prisma.syncStatus.upsert({
          where: { userId: userId },
          update: {
            hasInitialSync: true,
            lastSyncAt: new Date(),
          },
          create: {
            userId: userId,
            hasInitialSync: true,
            lastSyncAt: new Date(),
          },
        })

        syncResult = {
          success: true,
          totalTransactions,
          errors: errors.length > 0 ? errors : undefined,
          isInitialSync: true
        }
        
        console.log(`Initial sync complete: ${totalTransactions} transactions processed`)
      } else {
        console.log('No Plaid items found for user')
      }
    } catch (error) {
      console.error('Error in initial sync:', error)
      syncResult = {
        success: false,
        error: 'Failed to sync transactions'
      }
    }
  } else {
    console.log('Initial sync already completed, skipping auto-sync')
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: userId },
    include: { account: true },
    orderBy: { date: 'desc' },
    take: 100,
  })

  const accounts = await prisma.account.findMany({
    where: { userId: userId, isActive: true },
    orderBy: [
      { name: 'asc' }
    ]
  })

         return (
           <div className="space-y-6">
                 <div>
                   <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
                   <p className="text-gray-600">View and manage your transaction history</p>
               {syncResult && syncResult.isInitialSync && (
                 <div className={`mt-2 p-3 rounded-lg text-sm ${
                   syncResult.success 
                     ? 'bg-green-50 text-green-800 border border-green-200' 
                     : 'bg-red-50 text-red-800 border border-red-200'
                 }`}>
                   {syncResult.success ? (
                     <span>✅ Initial sync completed: {syncResult.totalTransactions} transactions loaded</span>
                   ) : (
                     <span>❌ Initial sync failed: {syncResult.error}</span>
                   )}
                 </div>
               )}
             </div>

             <TransactionsList transactions={transactions as any} accounts={accounts} />
           </div>
         )
}
