import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Create the feedback_comments table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "public"."feedback_comments" (
        "id" TEXT NOT NULL,
        "feedbackId" TEXT NOT NULL,
        "comment" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "feedback_comments_pkey" PRIMARY KEY ("id")
      );
    `

    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "public"."feedback_comments" 
      ADD CONSTRAINT "feedback_comments_feedbackId_fkey" 
      FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `

    // Add index for better performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "feedback_comments_feedbackId_idx" ON "public"."feedback_comments"("feedbackId");
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback comments table created successfully' 
    })
  } catch (error) {
    console.error('Error creating feedback comments table:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create feedback comments table', 
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}
