import SignInForm from '@/components/auth/SignInForm'
import { Cog } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Cog className="h-8 w-8 text-black" />
            <h1 className="text-3xl font-bold text-gray-900">Crank</h1>
          </div>
          <p className="text-gray-600">Welcome back</p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
