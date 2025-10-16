'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreditCard, Shield, TrendingUp, Users, DollarSign, PieChart, Cog } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const handleSignIn = () => {
    signIn('auth0', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2 text-2xl font-bold text-primary">
          <Cog className="h-8 w-8" />
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
      <section className="px-6 py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Cog className="h-12 w-12 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Manage All Your Finances in One Place
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect your credit cards and bank accounts to track spending, manage payments, 
          and gain insights into your financial health.
        </p>
        <div className="space-x-4">
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started Free
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            🆓 Completely free with Auth0, Supabase, and Plaid sandbox
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Manage Your Money
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CreditCard className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Credit Card Management</CardTitle>
                <CardDescription>
                  Track all your credit cards, monitor balances, and manage payments from one dashboard.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Bank Account Integration</CardTitle>
                <CardDescription>
                  Connect all your bank accounts to get a complete view of your financial picture.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Spending Analytics</CardTitle>
                <CardDescription>
                  Get insights into your spending patterns with detailed analytics and categorization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <PieChart className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Budget Tracking</CardTitle>
                <CardDescription>
                  Set budgets and track your progress with visual charts and spending alerts.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Bank-Level Security</CardTitle>
                <CardDescription>
                  Your financial data is protected with enterprise-grade security and encryption.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Family Sharing</CardTitle>
                <CardDescription>
                  Share accounts with family members and collaborate on financial goals.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Free Services Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Built with Free Services
          </h2>
          <p className="text-xl mb-12 text-gray-600">
            No hidden costs, no credit card required - completely free to use
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-2">Auth0</div>
              <p className="text-sm text-gray-600">Free authentication for 7,000 users</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600 mb-2">Supabase</div>
              <p className="text-sm text-gray-600">Free PostgreSQL database</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-2">Plaid</div>
              <p className="text-sm text-gray-600">Free sandbox environment</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-600 mb-2">Vercel</div>
              <p className="text-sm text-gray-600">Free hosting & deployment</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have simplified their financial management with Crank.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t bg-white">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 Crank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
