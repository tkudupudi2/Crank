import { NextRequest, NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.PLAID_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('PLAID_WEBHOOK_SECRET not configured')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Idempotency protection
const processedWebhooks = new Set<string>()

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let webhookId: string | null = null
  
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('plaid-verification')
    
    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && signature) {
      if (!verifyWebhookSignature(rawBody, signature)) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)
    const { webhook_type, webhook_code, item_id, webhook_id } = body

    // Generate webhook ID for idempotency
    webhookId = webhook_id || `${webhook_type}_${webhook_code}_${item_id}_${Date.now()}`

    // Check if webhook was already processed (idempotency)
    if (processedWebhooks.has(webhookId)) {
      console.log(`Webhook ${webhookId} already processed, skipping`)
      return NextResponse.json({ status: 'ok', message: 'Already processed' })
    }

    // Log webhook event
    console.log(`[WEBHOOK] ${webhook_type}:${webhook_code} for item ${item_id} (ID: ${webhookId})`)

    // Store webhook event for monitoring
    await prisma.webhookEvent.create({
      data: {
        webhookId,
        webhookType: webhook_type,
        webhookCode: webhook_code,
        itemId: item_id,
        processed: false,
        payload: body,
      },
    })

    let success = false
    let error: string | null = null

    try {
      switch (webhook_type) {
        case 'TRANSACTIONS':
          if (['INITIAL_UPDATE', 'HISTORICAL_UPDATE', 'DEFAULT_UPDATE', 'TRANSACTIONS_REMOVED'].includes(webhook_code)) {
            await fetchTransactionsForItem(item_id, webhook_code)
            success = true
          }
          break

        case 'ACCOUNTS':
          if (webhook_code === 'BALANCE') {
            await updateAccountBalances(item_id)
            success = true
          }
          break

        case 'ITEM':
          if (webhook_code === 'ERROR') {
            await handleItemError(item_id, body.error)
            success = true
          } else if (webhook_code === 'NEW_ACCOUNTS_AVAILABLE') {
            await handleNewAccountsAvailable(item_id)
            success = true
          }
          break

        case 'LIABILITIES':
          if (webhook_code === 'LIABILITIES_UPDATE') {
            await updateLiabilities(item_id)
            success = true
          }
          break

        default:
          console.log(`Unhandled webhook type: ${webhook_type}`)
          success = true // Don't fail for unknown webhook types
      }

      // Mark webhook as processed
      processedWebhooks.add(webhookId)
      
      // Clean up old processed webhooks (keep last 1000)
      if (processedWebhooks.size > 1000) {
        const toDelete = Array.from(processedWebhooks).slice(0, 100)
        toDelete.forEach(id => processedWebhooks.delete(id))
      }

    } catch (processingError) {
      error = processingError instanceof Error ? processingError.message : 'Unknown error'
      console.error(`Error processing webhook ${webhookId}:`, processingError)
    }

    // Update webhook event status
    await prisma.webhookEvent.updateMany({
      where: { webhookId },
      data: {
        processed: success,
        error,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
    })

    if (success) {
      console.log(`[WEBHOOK] Successfully processed ${webhookId} in ${Date.now() - startTime}ms`)
      return NextResponse.json({ status: 'ok', webhookId })
    } else {
      console.error(`[WEBHOOK] Failed to process ${webhookId}: ${error}`)
      return NextResponse.json(
        { error: 'Webhook processing failed', webhookId, details: error },
        { status: 500 }
      )
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[WEBHOOK] Fatal error processing webhook:`, error)

    // Update webhook event if we have an ID
    if (webhookId) {
      await prisma.webhookEvent.updateMany({
        where: { webhookId },
        data: {
          processed: false,
          error: errorMessage,
          processedAt: new Date(),
          processingTimeMs: Date.now() - startTime,
        },
      })
    }

    return NextResponse.json(
      { error: 'Webhook processing failed', webhookId, details: errorMessage },
      { status: 500 }
    )
  }
}

async function fetchTransactionsForItem(itemId: string, webhookCode: string) {
  try {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { plaidItemId: itemId },
      include: { user: true },
    })

    if (!plaidItem) {
      console.error('Plaid item not found:', itemId)
      return
    }

    // Get transactions from the last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Format dates as YYYY-MM-DD strings
    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    const response = await plaidClient.transactionsGet({
      access_token: plaidItem.accessToken,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    })

    const transactions = response.data.transactions
    let processedCount = 0
    let errorCount = 0

    // Process each transaction
    for (const transaction of transactions) {
      try {
        const account = await prisma.account.findFirst({
          where: { plaidAccountId: transaction.account_id },
        })

        if (!account) {
          console.warn(`Account not found for transaction ${transaction.transaction_id}`)
          continue
        }

        // Determine correct amount based on transaction direction
        let correctedAmount = transaction.amount
        
        // If direction is available, use it to determine correct polarity
        if (transaction.direction) {
          if (transaction.direction === 'OUTFLOW') {
            if (account.type === 'credit') {
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
              // Money going out (expense) should be negative
              correctedAmount = -Math.abs(transaction.amount)
            }
          } else if (transaction.direction === 'INFLOW') {
            if (account.type === 'credit') {
              // For credit cards, INFLOW could be payments (which should be negative)
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
            // For checking/savings accounts, positive amounts are typically expenses (should be negative)
            correctedAmount = -Math.abs(transaction.amount)
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

        await prisma.transaction.upsert({
          where: { plaidTransactionId: transaction.transaction_id },
          update: {
            amount: correctedAmount,
            description: transaction.name,
            merchantName: transaction.merchant_name,
            category: transaction.category || [],
            subcategory: transaction.subcategory,
            date: new Date(transaction.date),
            pending: transaction.pending,
          },
          create: {
            userId: plaidItem.userId,
            accountId: account.id,
            plaidTransactionId: transaction.transaction_id,
            amount: correctedAmount,
            description: transaction.name,
            merchantName: transaction.merchant_name,
            category: transaction.category || [],
            subcategory: transaction.subcategory,
            date: new Date(transaction.date),
            pending: transaction.pending,
            accountOwner: transaction.account_owner,
          },
        })

        processedCount++
      } catch (transactionError) {
        errorCount++
        console.error(`Error processing transaction ${transaction.transaction_id}:`, transactionError)
      }
    }

    console.log(`[WEBHOOK] Processed ${processedCount} transactions for item ${itemId} (${errorCount} errors)`)
  } catch (error) {
    console.error(`[WEBHOOK] Error fetching transactions for item ${itemId}:`, error)
    throw error
  }
}

async function updateAccountBalances(itemId: string) {
  try {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { plaidItemId: itemId },
    })

    if (!plaidItem) {
      console.error('Plaid item not found:', itemId)
      return
    }

    const response = await plaidClient.accountsGet({
      access_token: plaidItem.accessToken,
    })

    let updatedCount = 0

    // Update account balances
    for (const account of response.data.accounts) {
      await prisma.account.updateMany({
        where: { plaidAccountId: account.account_id },
        data: {
          currentBalance: account.balances.current,
          availableBalance: account.balances.available,
          lastUpdated: new Date(),
        },
      })
      updatedCount++
    }

    console.log(`[WEBHOOK] Updated ${updatedCount} account balances for item ${itemId}`)
  } catch (error) {
    console.error(`[WEBHOOK] Error updating balances for item ${itemId}:`, error)
    throw error
  }
}

async function handleItemError(itemId: string, error: any) {
  try {
    await prisma.plaidItem.updateMany({
      where: { plaidItemId: itemId },
      data: { 
        status: 'error',
        lastError: JSON.stringify(error),
        lastUpdated: new Date(),
      },
    })

    console.log(`[WEBHOOK] Item ${itemId} marked as error:`, error)
  } catch (updateError) {
    console.error(`[WEBHOOK] Error handling item error for ${itemId}:`, updateError)
    throw updateError
  }
}

async function handleNewAccountsAvailable(itemId: string) {
  try {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { plaidItemId: itemId },
      include: { user: true },
    })

    if (!plaidItem) {
      console.error('Plaid item not found:', itemId)
      return
    }

    // Fetch updated accounts
    const response = await plaidClient.accountsGet({
      access_token: plaidItem.accessToken,
    })

    let newAccountsCount = 0

    for (const account of response.data.accounts) {
      const existingAccount = await prisma.account.findFirst({
        where: { plaidAccountId: account.account_id },
      })

      if (!existingAccount) {
        // Create new account
        await prisma.account.create({
          data: {
            userId: plaidItem.userId,
            plaidItemId: plaidItem.id,
            plaidAccountId: account.account_id,
            name: account.name,
            type: account.type as any,
            subtype: account.subtype as any,
            currentBalance: account.balances.current,
            availableBalance: account.balances.available,
            mask: account.mask,
            institutionName: plaidItem.institutionName,
            lastUpdated: new Date(),
          },
        })
        newAccountsCount++
      }
    }

    console.log(`[WEBHOOK] Added ${newAccountsCount} new accounts for item ${itemId}`)
  } catch (error) {
    console.error(`[WEBHOOK] Error handling new accounts for item ${itemId}:`, error)
    throw error
  }
}

async function updateLiabilities(itemId: string) {
  try {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { plaidItemId: itemId },
    })

    if (!plaidItem) {
      console.error('Plaid item not found:', itemId)
      return
    }

    // Fetch liabilities
    const response = await plaidClient.liabilitiesGet({
      access_token: plaidItem.accessToken,
    })

    const liabilities = response.data.liabilities
    let updatedCount = 0

    // Update credit card liabilities
    for (const credit of liabilities.credit || []) {
      const account = await prisma.account.findFirst({
        where: { plaidAccountId: credit.account_id },
      })

      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            creditLimit: credit.limit,
            lastPaymentAmount: credit.last_payment_amount,
            lastPaymentDate: credit.last_payment_date ? new Date(credit.last_payment_date) : null,
            aprs: JSON.stringify(credit.aprs || []),
            lastUpdated: new Date(),
          },
        })
        updatedCount++
      }
    }

    // Update mortgage liabilities
    for (const mortgage of liabilities.mortgage || []) {
      const account = await prisma.account.findFirst({
        where: { plaidAccountId: mortgage.account_id },
      })

      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            sequenceNumber: mortgage.sequence_number,
            originalTerm: mortgage.original_term,
            repaymentPlan: JSON.stringify(mortgage.repayment_plan || {}),
            servicerAddress: JSON.stringify(mortgage.servicer_address || {}),
            propertyAddress: JSON.stringify(mortgage.property_address || {}),
            lastUpdated: new Date(),
          },
        })
        updatedCount++
      }
    }

    // Update student loan liabilities
    for (const student of liabilities.student || []) {
      const account = await prisma.account.findFirst({
        where: { plaidAccountId: student.account_id },
      })

      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            sequenceNumber: student.sequence_number,
            originalTerm: student.original_term,
            repaymentPlan: JSON.stringify(student.repayment_plan || {}),
            servicerAddress: JSON.stringify(student.servicer_address || {}),
            lastUpdated: new Date(),
          },
        })
        updatedCount++
      }
    }

    console.log(`[WEBHOOK] Updated ${updatedCount} liability accounts for item ${itemId}`)
  } catch (error) {
    console.error(`[WEBHOOK] Error updating liabilities for item ${itemId}:`, error)
    throw error
  }
}
