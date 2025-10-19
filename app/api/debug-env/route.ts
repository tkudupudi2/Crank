import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Test database connection
  let dbTest = 'NOT TESTED'
  let dbUrl = 'NOT SET'
  
  try {
    dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET'
    
    if (!prisma) {
      dbTest = 'ERROR: Prisma client not available (build time)'
    } else {
      await prisma.user.findMany({ take: 1 })
      dbTest = 'SUCCESS'
    }
  } catch (error) {
    dbTest = `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    DATABASE_URL: dbUrl,
    DATABASE_TEST: dbTest,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? 'SET' : 'NOT SET',
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? 'SET' : 'NOT SET',
    AUTH0_ISSUER: process.env.AUTH0_ISSUER || 'NOT SET',
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL || 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
  })
}
