'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CheckCircle, User, FileText, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function OnboardingForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: ''
  })
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const termsRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleScroll = () => {
    if (termsRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setHasScrolledToBottom(isAtBottom)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please enter both first and last name')
      return
    }
    
    if (!hasScrolledToBottom) {
      setError('Please scroll to the bottom of the terms and conditions')
      return
    }
    
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete onboarding')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = async () => {
    if (confirm('Are you sure you want to go back? This will delete your account and you\'ll need to sign up again.')) {
      setIsSubmitting(true)
      setError('')

      try {
        const response = await fetch('/api/onboarding/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to cancel onboarding')
        }

        // Sign out and redirect to home
        await fetch('/api/auth/signout', { method: 'POST' })
        router.push('/')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Crank!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Let's get you set up with your financial dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Collection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Terms and Conditions
              </h3>
              
              <div className="relative">
                <div 
                  ref={termsRef}
                  onScroll={handleScroll}
                  className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700 leading-relaxed"
                >
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Beta Application Notice</h4>
                        <p>
                          Crank is currently in beta testing phase. This means the application is still under development 
                          and may contain bugs, errors, or unexpected behavior. By using this application, you acknowledge 
                          and accept that you are using beta software.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Financial Data Sharing Consent</h4>
                      <p>
                        By using Crank, you consent to sharing your financial data with our secure third-party service 
                        providers, including Plaid Technologies, Inc., for the purpose of connecting your bank accounts 
                        and credit cards. This data sharing is necessary to provide you with the financial management 
                        services offered by Crank.
                      </p>
                      <p className="mt-2">
                        Your financial data will be encrypted and handled according to industry-standard security practices. 
                        We do not sell your personal or financial information to third parties.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h4>
                      <p>
                        Crank and its developers are not responsible for any malfunctions, errors, data loss, or financial 
                        consequences that may arise from the use of this application. This includes but is not limited to:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Technical errors or system failures</li>
                        <li>Inaccurate financial data or calculations</li>
                        <li>Loss of data or account access</li>
                        <li>Third-party service disruptions</li>
                        <li>Any financial decisions made based on application data</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">User Responsibilities</h4>
                      <p>
                        As a user of this beta application, you agree to:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Use the application at your own risk</li>
                        <li>Verify all financial information independently</li>
                        <li>Not rely solely on the application for financial decisions</li>
                        <li>Report any bugs or issues you encounter</li>
                        <li>Keep your account credentials secure</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Data Security</h4>
                      <p>
                        While we implement industry-standard security measures, no system is completely secure. 
                        You acknowledge that there are inherent risks in transmitting and storing financial data 
                        electronically, and you accept these risks.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Service Availability</h4>
                      <p>
                        Crank is provided "as is" without warranties of any kind. We reserve the right to modify, 
                        suspend, or discontinue the service at any time without notice. We are not liable for any 
                        downtime or service interruptions.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Agreement</h4>
                      <p className="text-blue-800">
                        By proceeding with the use of Crank, you acknowledge that you have read, understood, and agree 
                        to be bound by these terms and conditions. You understand that this is a beta application 
                        and accept all associated risks and limitations.
                      </p>
                    </div>

                    {/* Spacer to ensure scroll requirement */}
                    <div className="h-20"></div>
                  </div>
                </div>
                
                {!hasScrolledToBottom && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg px-3 py-1 text-xs text-gray-600 shadow-sm">
                    Please scroll to the bottom to continue
                  </div>
                )}
              </div>

              {/* Agreement Checkbox - Only shows after scrolling */}
              {hasScrolledToBottom && (
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agree-terms" className="text-sm text-gray-700">
                    I have read and agree to the terms and conditions above. I understand that Crank is a beta 
                    application and accept all associated risks and limitations.
                  </label>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoBack}
                disabled={isSubmitting}
                className="px-6 py-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                type="submit"
                disabled={!hasScrolledToBottom || !agreedToTerms || isSubmitting}
                className="px-8 py-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Completing Setup...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
