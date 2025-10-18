import { NextRequest, NextResponse } from 'next/server'

// GET /api/auth0/universal-login - Redirect to Auth0 Universal Login with MFA
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const returnTo = searchParams.get('returnTo') || '/dashboard'
    
    // Construct Auth0 Universal Login URL with MFA enforcement
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL!
    const clientId = process.env.AUTH0_CLIENT_ID!
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/auth0`
    
    // Auth0 Universal Login URL with MFA enforcement
    const authUrl = new URL(`${auth0Domain}/authorize`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'openid email profile')
    authUrl.searchParams.set('state', Buffer.from(JSON.stringify({ returnTo })).toString('base64'))
    authUrl.searchParams.set('prompt', 'login')
    // Enforce MFA using acr_values
    authUrl.searchParams.set('acr_values', 'http://schemas.openid.net/pape/policies/2007/06/multi-factor')
    
    // Redirect to Auth0 Universal Login
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Error creating Auth0 Universal Login URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
