'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Shield, UserPlus, ArrowRight, Mail, Users } from 'lucide-react'

export default function SignUpForm() {
  const handleAuth0SignUp = () => {
    signIn('auth0', { callbackUrl: '/dashboard' })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>
          Create your account to start managing your finances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleAuth0SignUp}
          className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          <Shield className="h-5 w-5 mr-3" />
          Sign up with Auth0
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">
          Multiple login options - secure and convenient
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-purple-800">
            <UserPlus className="h-4 w-4" />
            <span className="text-sm font-medium">Free Forever</span>
          </div>
          <p className="text-xs text-purple-600 mt-1">
            Free Auth0 account with up to 7,000 active users
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
            <span>Social login (Google, GitHub, etc.)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
            <span>Email/password authentication</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
            <span>Enterprise-grade security</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
            <span>Passwordless authentication</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
