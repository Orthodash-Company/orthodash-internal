'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Auth() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic';
