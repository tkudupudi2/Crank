import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // During build time, return a mock client to avoid connection issues
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not available during build, using mock Prisma client')
    return {
      $transaction: () => Promise.reject(new Error('Database not available during build')),
      user: {
        findUnique: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        update: () => Promise.reject(new Error('Database not available during build')),
        delete: () => Promise.reject(new Error('Database not available during build')),
        findMany: () => Promise.reject(new Error('Database not available during build')),
      },
      account: {
        findMany: () => Promise.reject(new Error('Database not available during build')),
        findFirst: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        update: () => Promise.reject(new Error('Database not available during build')),
        delete: () => Promise.reject(new Error('Database not available during build')),
        deleteMany: () => Promise.reject(new Error('Database not available during build')),
      },
      transaction: {
        findMany: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        deleteMany: () => Promise.reject(new Error('Database not available during build')),
      },
      plaidItem: {
        findMany: () => Promise.reject(new Error('Database not available during build')),
        findFirst: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        update: () => Promise.reject(new Error('Database not available during build')),
        delete: () => Promise.reject(new Error('Database not available during build')),
        deleteMany: () => Promise.reject(new Error('Database not available during build')),
      },
      userPreferences: {
        findUnique: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        update: () => Promise.reject(new Error('Database not available during build')),
        delete: () => Promise.reject(new Error('Database not available during build')),
        deleteMany: () => Promise.reject(new Error('Database not available during build')),
      },
      syncStatus: {
        findUnique: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        update: () => Promise.reject(new Error('Database not available during build')),
        delete: () => Promise.reject(new Error('Database not available during build')),
        deleteMany: () => Promise.reject(new Error('Database not available during build')),
      },
      paymentSchedule: {
        findMany: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        update: () => Promise.reject(new Error('Database not available during build')),
        delete: () => Promise.reject(new Error('Database not available during build')),
        deleteMany: () => Promise.reject(new Error('Database not available during build')),
      },
      payment: {
        findMany: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        update: () => Promise.reject(new Error('Database not available during build')),
        delete: () => Promise.reject(new Error('Database not available during build')),
        deleteMany: () => Promise.reject(new Error('Database not available during build')),
      },
      webhookEvent: {
        findMany: () => Promise.reject(new Error('Database not available during build')),
        create: () => Promise.reject(new Error('Database not available during build')),
        update: () => Promise.reject(new Error('Database not available during build')),
        delete: () => Promise.reject(new Error('Database not available during build')),
        deleteMany: () => Promise.reject(new Error('Database not available during build')),
      },
    } as any
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
