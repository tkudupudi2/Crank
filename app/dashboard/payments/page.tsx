import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PaymentHistory from '@/components/dashboard/PaymentHistory'

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as any)?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">
          Track and manage your credit card payments
        </p>
      </div>

      <PaymentHistory />
    </div>
  )
}