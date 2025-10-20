'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import AdminLogoutButton from '@/components/admin/AdminLogoutButton'
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Settings, 
  ArrowRight,
  Bug,
  Lightbulb,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface FeedbackStats {
  total: number
  new: number
  bugs: number
  features: number
  improvements: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    new: 0,
    bugs: 0,
    features: 0,
    improvements: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/feedback/list?limit=1000')
      const result = await response.json()

      if (response.ok) {
        const feedback = result.feedback || []
        const newCount = feedback.filter((f: any) => f.status === 'new').length
        const bugs = feedback.filter((f: any) => f.type === 'bug').length
        const features = feedback.filter((f: any) => f.type === 'feature').length
        const improvements = feedback.filter((f: any) => f.type === 'improvement').length

        setStats({
          total: feedback.length,
          new: newCount,
          bugs,
          features,
          improvements
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Feedback Management',
      description: 'View and manage user feedback',
      href: '/admin/feedback',
      icon: MessageSquare,
      color: 'bg-blue-500',
      stats: `${stats.total} total`
    },
    {
      title: 'User Analytics',
      description: 'View user statistics and insights',
      href: '/admin/users',
      icon: Users,
      color: 'bg-green-500',
      stats: 'Coming soon'
    },
    {
      title: 'System Health',
      description: 'Monitor system performance',
      href: '/admin/health',
      icon: TrendingUp,
      color: 'bg-purple-500',
      stats: 'Coming soon'
    },
    {
      title: 'Settings',
      description: 'Configure admin settings',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-500',
      stats: 'Coming soon'
    }
  ]

  const recentFeedback = [
    { type: 'bug', count: stats.bugs, color: 'bg-red-100 text-red-800' },
    { type: 'feature', count: stats.features, color: 'bg-blue-100 text-blue-800' },
    { type: 'improvement', count: stats.improvements, color: 'bg-green-100 text-green-800' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to the Crank admin management system</p>
        </div>
        <AdminLogoutButton />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.new} new items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bug Reports</CardTitle>
            <Bug className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{loading ? '...' : stats.bugs}</div>
            <p className="text-xs text-muted-foreground">
              Issues to resolve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Requests</CardTitle>
            <Lightbulb className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.features}</div>
            <p className="text-xs text-muted-foreground">
              New ideas to review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvements</CardTitle>
            <Star className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.improvements}</div>
            <p className="text-xs text-muted-foreground">
              Enhancement suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{action.stats}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Feedback Summary */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Feedback Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentFeedback.map((item) => (
            <Card key={item.type}>
              <CardHeader>
                <CardTitle className="text-lg capitalize flex items-center justify-between">
                  {item.type}s
                  <Badge className={item.color}>
                    {loading ? '...' : item.count}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.type === 'bug' && 'Issues reported by users'}
                  {item.type === 'feature' && 'New feature requests'}
                  {item.type === 'improvement' && 'Enhancement suggestions'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
