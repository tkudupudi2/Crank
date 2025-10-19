// Script to check environment variables
console.log('Environment check:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('AUTH0_CLIENT_ID exists:', !!process.env.AUTH0_CLIENT_ID)
console.log('AUTH0_CLIENT_SECRET exists:', !!process.env.AUTH0_CLIENT_SECRET)
console.log('AUTH0_ISSUER exists:', !!process.env.AUTH0_ISSUER)
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
console.log('NEXTAUTH_URL exists:', !!process.env.NEXTAUTH_URL)
