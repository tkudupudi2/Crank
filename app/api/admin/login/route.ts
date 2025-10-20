import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Simple hardcoded admin credentials
    if (username === 'root' && password === 'P@ssw0rd') {
      // Create a simple session token (in production, use proper JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64')
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        token 
      })
      
      // Set cookie for admin session
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 // 1 hour for testing (change to 24 * 60 * 60 for production)
      })
      
      return response
    } else {
      return NextResponse.json({ 
        error: 'Invalid credentials' 
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
