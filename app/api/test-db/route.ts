import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic environment variable
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json({ 
        error: 'DATABASE_URL not found in environment variables',
        env: process.env.NODE_ENV,
        vercel: process.env.VERCEL
      })
    }

    // Test if we can parse the URL
    let parsedUrl
    try {
      parsedUrl = new URL(dbUrl)
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid DATABASE_URL format',
        dbUrl: dbUrl.substring(0, 50) + '...'
      })
    }

    return NextResponse.json({
      success: true,
      dbUrl: `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}${parsedUrl.pathname}`,
      env: process.env.NODE_ENV,
      vercel: process.env.VERCEL
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
