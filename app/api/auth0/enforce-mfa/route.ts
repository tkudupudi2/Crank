import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth0/enforce-mfa - Redirect to Auth0 with MFA enforcement
export async function POST(request: NextRequest) {
  try {
    const { returnTo = '/dashboard' } = await request.json()
    
    // Construct Auth0 authorization URL with MFA enforcement
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL!
    const clientId = process.env.AUTH0_CLIENT_ID!
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/auth0`
    
    // Auth0 URL with MFA enforcement parameters
    const authUrl = new URL(`${auth0Domain}/authorize`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'openid email profile')
    authUrl.searchParams.set('state', Buffer.from(JSON.stringify({ returnTo })).toString('base64'))
    authUrl.searchParams.set('prompt', 'login')
    // Force MFA by using acr_values
    authUrl.searchParams.set('acr_values', 'http://schemas.openid.net/pape/policies/2007/06/multi-factor')
    
    return NextResponse.json({
      authUrl: authUrl.toString(),
      message: 'Redirecting to Auth0 with MFA enforcement'
    })
  } catch (error) {
    console.error('Error creating MFA auth URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
