'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { LogOut, Loader2 } from 'lucide-react'

export default function AdminLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Logout failed')
      }

      // Redirect to admin login page
      router.push('/admin/feedback')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoggingOut}
      variant="outline"
      className="flex items-center space-x-2"
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
    </Button>
  )
}
