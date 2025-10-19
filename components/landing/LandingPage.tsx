'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreditCard, Shield, TrendingUp, Users, DollarSign, PieChart, Cog, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState(0)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSignIn = () => {
    signIn('auth0', { callbackUrl: '/dashboard' })
  }

  const scrollToSection = useCallback((index: number, smooth: boolean = true) => {
    const section = sectionRefs.current[index]
    if (section) {
      section.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant',
        block: 'start'
      })
    }
  }, [])

  // Using normal scrolling - no resistance

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      
      sectionRefs.current.forEach((section, index) => {
        if (section) {
          const rect = section.getBoundingClientRect()
          const sectionTop = rect.top + scrollY
          const sectionBottom = sectionTop + rect.height
          
          // Check if section is in view
          if (scrollY >= sectionTop - windowHeight / 2 && scrollY < sectionBottom - windowHeight / 2) {
            setActiveSection(index)
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" ref={containerRef}>
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-md fixed w-full top-0 z-50 border-b border-blue-100/50">
        <div className="flex items-center space-x-2 text-2xl font-bold text-gray-900">
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
          <span>Crank</span>
        </div>
        <div className="space-x-4">
          <Button 
            variant="ghost" 
            onClick={handleSignIn}
            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-300 hover:scale-105"
          >
            Sign In
          </Button>
          <Link href="/auth/signup">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Section Navigation Indicator */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 space-y-3">
        {[
          { name: 'Hero', icon: '🏠' },
          { name: 'Credit Cards', icon: '💳' },
          { name: 'Bank Accounts', icon: '🏦' },
          { name: 'Analytics', icon: '📊' },
          { name: 'Budget', icon: '💰' },
          { name: 'Security', icon: '🔒' }
        ].map((section, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveSection(index)
              scrollToSection(index, true)
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              activeSection === index
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-110 shadow-lg'
                : 'bg-white/90 text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 hover:scale-105'
            }`}
            title={section.name}
          >
            {section.icon}
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section 
        ref={(el) => { sectionRefs.current[0] = el }}
        className="scroll-section min-h-screen flex items-center justify-center pt-32 pb-20 px-6 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
              <Cog className="h-16 w-16 text-black animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        <h1 className="text-5xl font-bold text-black mb-6 leading-[0.9] tracking-tight">
          <span className="block">Manage All Your</span>
          <span className="block">Finances in</span>
          <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">One Place</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-[1.4] tracking-tight">
          Connect your credit cards and bank accounts to track spending, manage payments, 
          and gain insights into your financial health.
        </p>
          <div className="space-x-6">
            <Link href="/auth/signup">
              <Button 
                size="lg" 
                className="text-xl px-12 py-4 bg-white text-gray-900 border-2 border-gray-200 hover:border-transparent transition-all duration-500 shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center group-hover:text-white transition-colors duration-300">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-xl px-12 py-4 border-2 border-gray-200 bg-white text-gray-900 hover:border-transparent transition-all duration-500 shadow-lg hover:shadow-xl relative overflow-hidden group"
              onClick={handleSignIn}
            >
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                Sign In
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </Button>
          </div>
        </div>
      </section>

      {/* Credit Card Management */}
      <section 
        ref={(el) => { sectionRefs.current[1] = el }}
        className="scroll-section min-h-screen flex items-center py-32 px-6 bg-gradient-to-br from-blue-50/30 to-purple-50/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-8">
                Credit Card<br />Management
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Track all your credit cards in one place. Monitor balances, payment due dates, 
                and credit utilization across all your accounts.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Real-time Balance Updates</h3>
                    <p className="text-gray-600">Always see your current balances and available credit</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Due Date Reminders</h3>
                    <p className="text-gray-600">Never miss a payment with smart notifications</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <PieChart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Credit Utilization Tracking</h3>
                    <p className="text-gray-600">Monitor your credit health across all cards</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Credit Utilization</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Chase Sapphire</span>
                      <span className="text-xs font-medium">$2,847 / $5,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '57%'}}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Capital One</span>
                      <span className="text-xs font-medium">$1,234 / $3,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '41%'}}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Amex Gold</span>
                      <span className="text-xs font-medium">$3,891 / $8,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{width: '49%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Available Credit</span>
                    <span className="text-lg font-bold text-blue-600">$8,058</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bank Account Integration */}
      <section 
        ref={(el) => { sectionRefs.current[2] = el }}
        className="scroll-section min-h-screen flex items-center py-32 px-6 bg-gradient-to-br from-purple-50/30 to-blue-50/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-4">Account Balances</div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">Checking</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">$12,847</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Savings</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">$45,231</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-medium">Investment</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">$78,456</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Net Worth</span>
                      <span className="text-lg font-bold text-green-600">$136,534</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-5xl font-bold text-gray-900 mb-8">
                Bank Account<br />Integration
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Connect all your bank accounts securely to get a complete view of your financial picture. 
                Track checking, savings, and investment accounts in one dashboard.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Secure Bank-Level Connections</h3>
                    <p className="text-gray-600">Your data is protected with enterprise-grade security</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Multiple Account Support</h3>
                    <p className="text-gray-600">Connect checking, savings, and investment accounts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Automatic Transaction Sync</h3>
                    <p className="text-gray-600">Real-time updates across all your accounts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spending Analytics */}
      <section 
        ref={(el) => { sectionRefs.current[3] = el }}
        className="scroll-section min-h-screen flex items-center py-32 px-6 bg-gradient-to-br from-purple-50/30 to-blue-50/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-8">
                Spending<br />Analytics
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Get deep insights into your spending patterns with detailed analytics, 
                categorization, and trend analysis to help you make better financial decisions.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Spending Trend Analysis</h3>
                    <p className="text-gray-600">Visualize your spending patterns over time</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <PieChart className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Category Breakdowns</h3>
                    <p className="text-gray-600">See exactly where your money goes each month</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Monthly Comparisons</h3>
                    <p className="text-gray-600">Track your progress and identify trends</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-4">Spending Trends</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Food & Dining</span>
                      <span className="text-xs font-medium">$847</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Transportation</span>
                      <span className="text-xs font-medium">$423</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '45%'}}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Entertainment</span>
                      <span className="text-xs font-medium">$234</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{width: '25%'}}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Shopping</span>
                      <span className="text-xs font-medium">$567</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total This Month</span>
                    <span className="text-lg font-bold text-purple-600">$2,071</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Tracking */}
      <section 
        ref={(el) => { sectionRefs.current[4] = el }}
        className="scroll-section min-h-screen flex items-center py-32 px-6 bg-gradient-to-br from-blue-50/30 to-purple-50/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-4">Budget Progress</div>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium">Monthly Budget</span>
                          <span className="text-xs font-medium">$3,500</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-orange-500 h-3 rounded-full animate-pulse" style={{width: '62%'}}></div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">Spent: $2,170</span>
                          <span className="text-xs text-gray-500">Left: $1,330</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                          <div className="text-lg font-bold text-green-600">$1,330</div>
                          <div className="text-xs text-gray-500">Remaining</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                          <div className="text-lg font-bold text-orange-600">62%</div>
                          <div className="text-xs text-gray-500">Used</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-5xl font-bold text-gray-900 mb-8">
                Budget<br />Tracking
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Set budgets for different categories and track your progress with visual charts, 
                spending alerts, and detailed reports to stay on top of your financial goals.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <PieChart className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Visual Budget Charts</h3>
                    <p className="text-gray-600">Beautiful charts show your budget progress at a glance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Smart Spending Alerts</h3>
                    <p className="text-gray-600">Get notified when you're approaching budget limits</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Goal Tracking</h3>
                    <p className="text-gray-600">Set and track financial goals with progress indicators</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section 
        ref={(el) => { sectionRefs.current[5] = el }}
        className="scroll-section min-h-screen flex items-center py-32 px-6 bg-gradient-to-br from-purple-50/30 to-blue-50/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-8">
                Bank-Level<br />Security
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Your financial data is protected with enterprise-grade security, encryption, 
                and compliance standards that meet the highest industry requirements.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">End-to-End Encryption</h3>
                    <p className="text-gray-600">Your data is encrypted in transit and at rest</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CreditCard className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">SOC 2 Compliance</h3>
                    <p className="text-gray-600">Meeting the highest security standards</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Multi-Factor Authentication</h3>
                    <p className="text-gray-600">Additional security layers protect your account</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-4">Security Status</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">256-bit Encryption</span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Multi-Factor Auth</span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">SOC 2 Compliance</span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Certified</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Bank-Level Security</span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Protected</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Security Score</span>
                    <span className="text-lg font-bold text-green-600">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="no-snap py-32 px-6 bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-2xl text-blue-100 mb-12 leading-relaxed">
            Join thousands of users who have simplified their financial management with Crank.
          </p>
          <Link href="/auth/signup">
            <Button 
              size="lg" 
              className="text-xl px-16 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl"
            >
              Get Started Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="no-snap px-6 py-16 border-t border-blue-100/50 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 text-2xl font-bold text-gray-900 mb-4">
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
                <span>Crank</span>
              </div>
              <p className="text-gray-600 mb-4">
                Simplify your financial life with our all-in-one personal finance platform.
              </p>
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
                <li><Link href="/dashboard/transactions" className="hover:text-blue-600">Transactions</Link></li>
                <li><Link href="/dashboard/budget" className="hover:text-blue-600">Budget</Link></li>
                <li><Link href="/dashboard/analytics" className="hover:text-blue-600">Analytics</Link></li>
              </ul>
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/about" className="hover:text-blue-600">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600">Press</a></li>
              </ul>
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-gray-600">
            <p>&copy; 2024 Crank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}