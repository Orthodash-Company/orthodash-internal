'use client'

import { useEffect } from 'react'
import { CheckCircle, ArrowRight, Users, BarChart3, Shield, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WelcomePage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleGetStarted = () => {
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl mr-3 shadow-lg">
                  <div className="text-white text-xl font-bold">ORTHODASH</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Welcome, {user.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-white/20 p-8 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Orthodash!
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                You're all set up and ready to transform your orthodontic practice with powerful analytics.
              </p>
              
              <div className="bg-green-50 rounded-xl p-6 mb-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">Account Created Successfully!</h3>
                <p className="text-green-700">Your account has been set up and you're ready to get started.</p>
              </div>

              <button
                onClick={handleGetStarted}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center mx-auto"
              >
                Get Started
                <Zap className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="block p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                <div className="font-semibold text-gray-900">View Dashboard</div>
                <div className="text-sm text-gray-600">Explore your analytics</div>
              </div>
              
              <div className="block p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <div className="font-semibold text-gray-900">Add Practice</div>
                <div className="text-sm text-gray-600">Connect your practice</div>
              </div>
              
              <div className="block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <Shield className="h-8 w-8 text-purple-600 mb-2" />
                <div className="font-semibold text-gray-900">Security</div>
                <div className="text-sm text-gray-600">Review settings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'; 
