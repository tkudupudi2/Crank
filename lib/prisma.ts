import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Check if we're in a build environment without database access
  // Vercel build process might not have DATABASE_URL available
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not available, using mock Prisma client')
    return createMockPrismaClient()
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.warn('Failed to create Prisma client, using mock:', error)
    return createMockPrismaClient()
  }
}

function createMockPrismaClient() {
  const mockMethod = () => Promise.reject(new Error('Database not available'))
  const mockModel = () => ({
    findUnique: mockMethod,
    findFirst: mockMethod,
    findMany: mockMethod,
    create: mockMethod,
    update: mockMethod,
    delete: mockMethod,
    deleteMany: mockMethod,
    upsert: mockMethod,
  })

  return {
    $transaction: mockMethod,
    $connect: mockMethod,
    $disconnect: mockMethod,
    $queryRaw: mockMethod,
    $executeRaw: mockMethod,
    user: mockModel(),
    account: mockModel(),
    transaction: mockModel(),
    plaidItem: mockModel(),
    userPreferences: mockModel(),
    syncStatus: mockModel(),
    paymentSchedule: mockModel(),
    payment: mockModel(),
    webhookEvent: mockModel(),
  } as any
}

// Lazy initialization - only create client when actually needed
let _prisma: PrismaClient | any = null

export const prisma = new Proxy({} as any, {
  get(target, prop) {
    if (!_prisma) {
      _prisma = globalForPrisma.prisma ?? createPrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = _prisma
      }
    }
    return _prisma[prop]
  }
})
