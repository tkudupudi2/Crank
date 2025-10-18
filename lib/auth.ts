import { NextAuthOptions } from 'next-auth'
import Auth0Provider from 'next-auth/providers/auth0'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER_BASE_URL!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'login', // Force fresh login to ensure MFA is checked
          acr_values: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor', // Enforce MFA
        },
      },
      checks: ['pkce'],
      client: {
        authorization_signed_response_alg: 'RS256',
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'auth0') {
        try {
          // Extract first name from Auth0 profile
          const firstName = (profile as any)?.given_name || 
                           profile?.name?.split(' ')[0] || 
                           (profile as any)?.nickname || 
                           user.name?.split(' ')[0] || 
                           user.name

          // Create or update user in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email!,
                name: firstName,
              }
            })
          } else {
            // Update existing user's name if it's not set or is a username
            await prisma.user.update({
              where: { email: user.email! },
              data: { name: firstName }
            })
          }
          return true
        } catch (error) {
          console.error('Error creating user:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === 'auth0') {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        if (dbUser) {
          token.id = dbUser.id
        }
      }
      
      // If we have a token with an ID, check if user still exists
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string }
        })
        // If user doesn't exist (was deleted), clear the token
        if (!dbUser) {
          return {}
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        
        // Get the latest user data from database to ensure we have the correct name
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string }
        })
        
        if (dbUser) {
          session.user.name = dbUser.name
          session.user.email = dbUser.email
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  }
}
