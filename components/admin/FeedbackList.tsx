'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  Calendar, 
  User, 
  Mail,
  RefreshCw,
  Filter
} from 'lucide-react'

interface FeedbackComment {
  id: string
  feedbackId: string
  comment: string
  createdAt: string
  updatedAt: string
}

interface Feedback {
  id: string
  type: string
  message: string
  status: string
  priority: string | null
  tags: string[]
  metadata: any
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
  comments: FeedbackComment[]
}

interface FeedbackListProps {}

export default function FeedbackList({}: FeedbackListProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: ''
  })
  const [updatingPriority, setUpdatingPriority] = useState<string | null>(null)
  const [addingComment, setAddingComment] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [markingDone, setMarkingDone] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const fetchFeedback = async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority })
      })

      const response = await fetch(`/api/feedback/list?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch feedback')
      }

      setFeedback(result.feedback)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [pagination.page, filters])

  const handleUpdatePriority = async (feedbackId: string, newPriority: string | null) => {
    setUpdatingPriority(feedbackId)
    
    try {
      const response = await fetch('/api/feedback/update-priority', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId,
          priority: newPriority
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update priority')
      }

      // Update the local state
      setFeedback(prev => 
        prev.map(item => 
          item.id === feedbackId 
            ? { ...item, priority: newPriority }
            : item
        )
      )
    } catch (err) {
      console.error('Error updating priority:', err)
    } finally {
      setUpdatingPriority(null)
    }
  }

  const handleAddComment = async (feedbackId: string) => {
    if (!newComment.trim()) return
    
    setAddingComment(feedbackId)
    
    try {
      const response = await fetch('/api/feedback/add-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId,
          comment: newComment.trim()
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add comment')
      }

      // Update the local state
      setFeedback(prev => 
        prev.map(item => 
          item.id === feedbackId 
            ? { ...item, comments: [...item.comments, result.comment] }
            : item
        )
      )
      
      setNewComment('')
    } catch (err) {
      console.error('Error adding comment:', err)
    } finally {
      setAddingComment(null)
    }
  }

  const handleMarkDone = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to mark this feedback as done? This will permanently delete it.')) {
      return
    }
    
    setMarkingDone(feedbackId)
    
    try {
      const response = await fetch('/api/feedback/mark-done', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark feedback as done')
      }

      // Remove from local state
      setFeedback(prev => prev.filter(item => item.id !== feedbackId))
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }))
    } catch (err) {
      console.error('Error marking feedback as done:', err)
    } finally {
      setMarkingDone(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-4 w-4" />
      case 'feature':
        return <Lightbulb className="h-4 w-4" />
      case 'improvement':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return 'bg-red-100 text-red-800'
      case 'feature':
        return 'bg-blue-100 text-blue-800'
      case 'improvement':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading feedback...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchFeedback}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="improvement">Improvement</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="null">No Priority</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
              <p className="text-gray-600">No feedback submissions match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(item.type)}
                    <div>
                      <CardTitle className="text-lg">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Report
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>
                          {item.user.firstName && item.user.lastName 
                            ? `${item.user.firstName} ${item.user.lastName}` 
                            : item.user.email
                          }
                        </span>
                        <Calendar className="h-4 w-4 ml-2" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <select
                        value={item.priority || ''}
                        onChange={(e) => handleUpdatePriority(item.id, e.target.value || null)}
                        disabled={updatingPriority === item.id}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${getPriorityColor(item.priority || '')} ${
                          updatingPriority === item.id ? 'opacity-50' : 'cursor-pointer'
                        }`}
                      >
                        <option value="">No Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      {updatingPriority === item.id && (
                        <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{item.message}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>{item.user.email}</span>
                    </div>
                    {item.metadata?.userAgent && (
                      <div className="text-xs text-gray-500">
                        {item.metadata.userAgent.split(' ')[0]} {/* Just the browser name */}
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Comments ({item.comments.length})</h4>
                      <div className="space-y-3">
                        {item.comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-700 text-sm">{comment.comment}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Comment Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Add Comment</h4>
                    <div className="flex space-x-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={addingComment === item.id}
                      />
                      <Button
                        onClick={() => handleAddComment(item.id)}
                        disabled={!newComment.trim() || addingComment === item.id}
                        size="sm"
                        className="self-end"
                      >
                        {addingComment === item.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t pt-4 flex justify-end">
                    <Button
                      onClick={() => handleMarkDone(item.id)}
                      disabled={markingDone === item.id}
                      variant="destructive"
                      size="sm"
                    >
                      {markingDone === item.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : null}
                      Mark as Done
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
