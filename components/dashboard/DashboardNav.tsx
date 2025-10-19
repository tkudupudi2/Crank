'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { CreditCard, Home, Settings, LogOut, PieChart, TrendingUp, DollarSign, Cog, Target, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Accounts', href: '/dashboard/accounts', icon: CreditCard },
  { name: 'Transactions', href: '/dashboard/transactions', icon: TrendingUp },
  { name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
  { name: 'Budget', href: '/dashboard/budget', icon: Target },
  { name: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
  { name: 'New Accounts', href: '/dashboard/new-accounts', icon: Search },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardNav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Unique geometric pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 opacity-20"></div>
                  <svg
                    className="w-5 h-5 text-white relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {/* Simple cogwheel design */}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
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
                        ? 'border-primary text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
