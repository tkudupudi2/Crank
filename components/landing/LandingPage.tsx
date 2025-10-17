'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreditCard, Shield, TrendingUp, Users, DollarSign, PieChart, Cog, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const handleSignIn = () => {
    signIn('auth0', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md fixed w-full top-0 z-50">
        <div className="flex items-center space-x-2 text-2xl font-bold text-gray-900">
          <Cog className="h-8 w-8 text-black" />
          <span>Crank</span>
        </div>
        <div className="space-x-4">
          <Button variant="ghost" onClick={handleSignIn}>Sign In</Button>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <Cog className="h-16 w-16 text-black animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Manage All Your Finances<br />in One Place
          </h1>
          <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect your credit cards and bank accounts to track spending, manage payments, 
            and gain insights into your financial health.
          </p>
          <div className="space-x-6">
            <Link href="/auth/signup">
              <Button size="lg" className="text-xl px-12 py-4 bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-xl px-12 py-4 border-2"
              onClick={handleSignIn}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Credit Card Management */}
      <section className="py-32 px-6 bg-gray-50">
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
      <section className="py-32 px-6">
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
      <section className="py-32 px-6 bg-gray-50">
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
      <section className="py-32 px-6">
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
      <section className="py-32 px-6 bg-gray-50">
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
      <section className="py-32 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-8">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of users who have simplified their financial management with Crank.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-xl px-16 py-6 bg-blue-600 hover:bg-blue-700">
              Get Started Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 border-t bg-white">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <div className="flex items-center justify-center space-x-2 text-2xl font-bold text-gray-900 mb-4">
            <Cog className="h-8 w-8 text-black" />
            <span>Crank</span>
          </div>
          <p>&copy; 2024 Crank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}