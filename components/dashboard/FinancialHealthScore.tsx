'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Heart, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface FinancialHealthData {
  score: number
  insights: Array<{
    type: 'warning' | 'suggestion' | 'achievement' | 'trend'
    title: string
    message: string
    priority: 'high' | 'medium' | 'low'
  }>
  recommendations: Array<{
    title: string
    description: string
    action: string
  }>
  timestamp: string
}

export default function FinancialHealthScore() {
  const [healthData, setHealthData] = useState<FinancialHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFinancialHealth()
  }, [])

  const fetchFinancialHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/financial-health')
      if (!response.ok) {
        throw new Error('Failed to fetch financial health data')
      }
      const data = await response.json()
      setHealthData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Fair'
    if (score >= 60) return 'Poor'
    return 'Critical'
  }

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Your financial health is strong!'
    if (score >= 60) return 'Your financial health needs attention.'
    return 'Your financial health requires immediate attention.'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
          <p className="text-xs text-muted-foreground">Calculating your score</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !healthData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">--</div>
          <p className="text-xs text-muted-foreground">Unable to calculate</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
            {getScoreIcon(healthData.score)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(healthData.score)}`}>
              {healthData.score}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {getScoreLabel(healthData.score)} • Click to view details
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Financial Health Score: {healthData.score}/100
          </DialogTitle>
          <DialogDescription>
            {getScoreDescription(healthData.score)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Score Overview */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-4xl font-bold ${getScoreColor(healthData.score)} mb-2`}>
              {healthData.score}/100
            </div>
            <div className="text-lg font-medium text-gray-700 mb-1">
              {getScoreLabel(healthData.score)}
            </div>
            <div className="text-sm text-gray-600">
              {getScoreDescription(healthData.score)}
            </div>
          </div>

          {/* Insights */}
          {healthData.insights.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Key Insights
              </h3>
              <div className="space-y-3">
                {healthData.insights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'warning' ? 'border-red-500 bg-red-50' :
                    insight.type === 'achievement' ? 'border-green-500 bg-green-50' :
                    insight.type === 'suggestion' ? 'border-blue-500 bg-blue-50' :
                    'border-gray-500 bg-gray-50'
                  }`}>
                    <div className="font-medium text-sm">{insight.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{insight.message}</div>
                    <div className={`text-xs mt-1 ${
                      insight.priority === 'high' ? 'text-red-600' :
                      insight.priority === 'medium' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {insight.priority.toUpperCase()} PRIORITY
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {healthData.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {healthData.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-sm text-blue-900">{rec.title}</div>
                    <div className="text-sm text-blue-700 mt-1">{rec.description}</div>
                    <div className="text-xs text-blue-600 mt-2 font-medium">{rec.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            Last updated: {new Date(healthData.timestamp).toLocaleString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
