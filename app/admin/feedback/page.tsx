import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import AdminLogoutButton from '@/components/admin/AdminLogoutButton'
import FeedbackList from '@/components/admin/FeedbackList'

export default async function AdminFeedbackPage() {
  const cookieStore = cookies()
  const adminToken = cookieStore.get('admin-token')?.value

  // Check if admin is logged in
  if (!adminToken || !verifyAdminToken()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600">Access the feedback management system</p>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
            <p className="text-gray-600">View and manage user feedback submissions</p>
          </div>
          <AdminLogoutButton />
        </div>
        
        <FeedbackList />
      </div>
    </div>
  )
}
