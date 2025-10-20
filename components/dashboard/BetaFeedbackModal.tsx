'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { X, Bug, Lightbulb, MessageSquare, ExternalLink } from 'lucide-react'

interface BetaFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BetaFeedbackModal({ isOpen, onClose }: BetaFeedbackModalProps) {
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'improvement'>('bug')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFeedback('')
      setFeedbackType('bug')
      setIsSubmitted(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!feedback.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: feedbackType,
          message: feedback.trim()
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback')
      }
      
      setIsSubmitted(true)
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExternalFeedback = () => {
    // Open external feedback form or email
    window.open('mailto:feedback@crank.app?subject=Beta Feedback', '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <CardTitle className="text-xl font-bold text-center">
            🚀 Crank is in Beta!
          </CardTitle>
          <CardDescription className="text-center">
            We'd love your feedback to help us improve
          </CardDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Thank you!</h3>
              <p className="text-green-600">Your feedback has been submitted.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  What would you like to share?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={feedbackType === 'bug' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFeedbackType('bug')}
                    className="flex items-center space-x-1"
                  >
                    <Bug className="h-4 w-4" />
                    <span>Bug</span>
                  </Button>
                  <Button
                    type="button"
                    variant={feedbackType === 'feature' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFeedbackType('feature')}
                    className="flex items-center space-x-1"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Feature</span>
                  </Button>
                  <Button
                    type="button"
                    variant={feedbackType === 'improvement' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFeedbackType('improvement')}
                    className="flex items-center space-x-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Improvement</span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tell us more:
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={`Describe the ${feedbackType}...`}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExternalFeedback}
                  className="flex-1 flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Email Us</span>
                </Button>
                <Button
                  type="submit"
                  disabled={!feedback.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
