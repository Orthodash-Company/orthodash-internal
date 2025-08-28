'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function TestConnectionPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dataCounts, setDataCounts] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Testing connection...')
      const response = await fetch('/api/greyfinch/test')
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      const data = await response.json()
      console.log('📦 Response data:', data)
      
      if (data.success) {
        setIsConnected(true)
        setDataCounts(data.basicCounts || {})
        console.log('✅ Connection successful')
      } else {
        setIsConnected(false)
        setError(data.message || 'Connection failed')
        console.log('❌ Connection failed:', data.message)
      }
    } catch (error) {
      setIsConnected(false)
      setError(error instanceof Error ? error.message : 'Unknown error')
      console.log('❌ Connection error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Greyfinch API Connection Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>Test the Greyfinch API connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 mb-4">
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              ) : isConnected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isLoading ? 'Checking connection...' : 
                 isConnected ? 'Connected to Greyfinch API' : 
                 'Not connected to Greyfinch API'}
              </span>
            </div>
            <Button onClick={testConnection} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-1" />
              Test
            </Button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isConnected && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-800">✅ Successfully connected to Greyfinch API</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Data Counts</CardTitle>
            <CardDescription>Basic data counts from Greyfinch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dataCounts.patients || 0}</div>
                <div className="text-sm text-gray-600">Patients</div>
              </div>
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dataCounts.locations || 0}</div>
                <div className="text-sm text-gray-600">Locations</div>
              </div>
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dataCounts.appointments || 0}</div>
                <div className="text-sm text-gray-600">Appointments</div>
              </div>
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{dataCounts.leads || 0}</div>
                <div className="text-sm text-gray-600">Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
