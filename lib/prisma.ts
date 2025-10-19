import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    // Return a mock client for build time
    return {
      $transaction: () => Promise.reject(new Error('Prisma client not available')),
      user: { findUnique: () => Promise.reject(new Error('Prisma client not available')) },
      account: { findMany: () => Promise.reject(new Error('Prisma client not available')) },
      transaction: { findMany: () => Promise.reject(new Error('Prisma client not available')) },
      plaidItem: { findMany: () => Promise.reject(new Error('Prisma client not available')) },
      userPreferences: { findUnique: () => Promise.reject(new Error('Prisma client not available')) },
      syncStatus: { findUnique: () => Promise.reject(new Error('Prisma client not available')) },
      paymentSchedule: { findMany: () => Promise.reject(new Error('Prisma client not available')) },
      payment: { findMany: () => Promise.reject(new Error('Prisma client not available')) },
      webhookEvent: { findMany: () => Promise.reject(new Error('Prisma client not available')) },
    } as any
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
