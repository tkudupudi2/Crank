import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export function verifyAdminToken(request?: NextRequest): boolean {
  let token: string | undefined
  
  if (request) {
    // For API routes
    token = request.cookies.get('admin-token')?.value
  } else {
    // For server components
    const cookieStore = cookies()
    token = cookieStore.get('admin-token')?.value
  }
  
  if (!token) {
    return false
  }
  
  try {
    // Decode the simple token
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, timestamp] = decoded.split(':')
    
    // Check if it's the admin user and token is not too old (1 hour for testing)
    const tokenAge = Date.now() - parseInt(timestamp)
    const maxAge = 60 * 60 * 1000 // 1 hour in milliseconds (change to 24 * 60 * 60 * 1000 for production)
    
    return username === 'root' && tokenAge < maxAge
  } catch {
    return false
  }
}
