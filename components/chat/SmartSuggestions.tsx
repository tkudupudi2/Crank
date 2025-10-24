'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Target,
  DollarSign
} from 'lucide-react'

interface Insight {
  type: 'warning' | 'suggestion' | 'achievement' | 'trend'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  action?: string
}

interface SmartSuggestionsProps {
  userId: string
  onSuggestionClick?: (suggestion: string) => void
}

export default function SmartSuggestions({ userId, onSuggestionClick }: SmartSuggestionsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [healthScore, setHealthScore] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [userId])

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/nlp/insights')
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
        setRecommendations(data.recommendations || [])
        setHealthScore(data.healthScore || 0)
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'achievement':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-gray-500">Loading insights...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Financial Health Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">
              <span className={getHealthScoreColor(healthScore)}>
                {healthScore}/100
              </span>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    healthScore >= 80 ? 'bg-green-500' : 
                    healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {healthScore >= 80 ? 'Excellent financial health!' :
                 healthScore >= 60 ? 'Good financial health' :
                 'Consider improving your financial habits'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Financial Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.slice(0, 5).map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)}`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                    {insight.actionable && insight.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => onSuggestionClick?.(insight.action!)}
                      >
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick?.('Compare my spending this month vs last month')}
              className="text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Compare Spending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick?.('Show me my spending trend over the last 6 months')}
              className="text-xs"
            >
              <TrendingDown className="h-3 w-3 mr-1" />
              Spending Trend
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick?.('Will I stay within budget this month?')}
              className="text-xs"
            >
              <Target className="h-3 w-3 mr-1" />
              Budget Prediction
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick?.('Give me financial insights')}
              className="text-xs"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Get Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
