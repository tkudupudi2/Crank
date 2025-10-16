'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Shield, User, Mail } from 'lucide-react'

export default function SignInForm() {
  const handleAuth0SignIn = () => {
    signIn('auth0', { callbackUrl: '/dashboard' })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in to access your financial dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleAuth0SignIn}
          className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          <Shield className="h-5 w-5 mr-3" />
          Sign in with Auth0
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">
          Secure authentication powered by Auth0
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-purple-800">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Free Developer Account</span>
          </div>
          <p className="text-xs text-purple-600 mt-1">
            Create your free Auth0 account to get started
          </p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Social login & email/password</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Enterprise-grade security</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
