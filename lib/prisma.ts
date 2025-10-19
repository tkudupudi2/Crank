import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Only use mock client during build time, not at runtime
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && process.env.VERCEL === '1') {
    console.warn('DATABASE_URL not available during build, using mock Prisma client')
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
    // Only use mock during build time when DATABASE_URL is not available
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && process.env.VERCEL === '1') {
      const mockMethod = () => Promise.reject(new Error('Database not available during build'))
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

      if (prop === '$transaction') return mockMethod
      if (prop === '$connect') return mockMethod
      if (prop === '$disconnect') return mockMethod
      if (prop === '$queryRaw') return mockMethod
      if (prop === '$executeRaw') return mockMethod
      if (typeof prop === 'string' && ['user', 'account', 'transaction', 'plaidItem', 'userPreferences', 'syncStatus', 'paymentSchedule', 'payment', 'webhookEvent'].includes(prop)) {
        return mockModel()
      }
      return mockMethod
    }

    if (!_prisma) {
      _prisma = globalForPrisma.prisma ?? createPrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = _prisma
      }
    }
    return _prisma[prop]
  }
})
