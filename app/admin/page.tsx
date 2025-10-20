import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin-auth'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const cookieStore = cookies()
  const adminToken = cookieStore.get('admin-token')?.value

  // Check if admin is logged in
  if (!adminToken || !verifyAdminToken()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Access the admin management system</p>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <AdminDashboard />
      </div>
    </div>
  )
}
