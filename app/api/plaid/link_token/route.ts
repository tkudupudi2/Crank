import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid'

export async function POST(request: NextRequest) {
  // Get the account type from the request body
  const body = await request.json().catch(() => ({}))
  const accountType = body.accountType // 'depository' or 'liability'
  
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let linkTokenConfig: any = {
      user: {
        client_user_id: (session?.user as any)?.id,
      },
      client_name: 'Crank',
      products: ['transactions', 'identity', 'transfer'] as any,
      country_codes: ['US'] as any,
      language: 'en',
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
    }

    if (accountType === 'depository') {
      // Flow 1: Depository accounts only (checking, savings)
      // Temporarily remove account filters to test
      console.log('Creating depository link token without account filters')
    } else if (accountType === 'liability') {
      // Flow 2: Liability accounts only (credit cards, loans)
      linkTokenConfig.products.push('liabilities')
      // Temporarily remove account filters to test
      console.log('Creating liability link token without account filters')
    } else {
      return NextResponse.json(
        { error: 'Invalid account type. Must be "depository" or "liability"' },
        { status: 400 }
      )
    }

    console.log(`Creating link token for ${accountType} accounts:`, {
      products: linkTokenConfig.products
    })

    const response = await plaidClient.linkTokenCreate(linkTokenConfig)

    return NextResponse.json({ 
      link_token: response.data.link_token,
      account_type: accountType 
    })
  } catch (error) {
    console.error('Error creating link token:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      accountType: accountType
    })
    return NextResponse.json(
      { 
        error: 'Failed to create link token', 
        details: error instanceof Error ? error.message : 'Unknown error',
        accountType: accountType
      },
      { status: 500 }
    )
  }
}
