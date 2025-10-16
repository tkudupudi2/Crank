'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { CreditCard, Home, Settings, LogOut, PieChart, TrendingUp, DollarSign, Cog } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Accounts', href: '/dashboard/accounts', icon: CreditCard },
  { name: 'Transactions', href: '/dashboard/transactions', icon: TrendingUp },
  { name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
  { name: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardNav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center justify-center">
                <Cog className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '2s' }} />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary text-gray-900 dark:text-gray-100'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  // First, sign out from NextAuth
                  await signOut({ 
                    redirect: false 
                  })
                  
                  // Then redirect to Auth0 logout endpoint with the correct client ID
                  // The client ID is: dggHzh5bIGGrrhAnGcyQAKxA0ya68HMA
                  const clientId = 'dggHzh5bIGGrrhAnGcyQAKxA0ya68HMA'
                  const auth0LogoutUrl = `https://dev-txfiencvc23dhp54.us.auth0.com/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(window.location.origin)}`
                  window.location.href = auth0LogoutUrl
                } catch (error) {
                  console.error('Error during sign out:', error)
                  // Fallback: just redirect to homepage
                  window.location.href = '/'
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
