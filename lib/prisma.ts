import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Check if DATABASE_URL is actually available and not empty
  const databaseUrl = process.env.DATABASE_URL
  console.log('Creating Prisma client - DATABASE_URL available:', !!databaseUrl)
  console.log('Creating Prisma client - NODE_ENV:', process.env.NODE_ENV)
  console.log('Creating Prisma client - VERCEL:', process.env.VERCEL)
  
  if (!databaseUrl || databaseUrl.trim() === '') {
    console.warn('DATABASE_URL not available or empty, using mock Prisma client')
    return createMockPrismaClient()
  }

  console.log('Creating real Prisma client with DATABASE_URL:', databaseUrl.substring(0, 20) + '...')

  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
    console.log('Prisma client created successfully')
    return client
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

// Lazy initialization - only create when actually needed
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
