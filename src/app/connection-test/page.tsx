'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConnectionTestPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionChecked, setConnectionChecked] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkConnection = async () => {
    setIsLoading(true)
    setError(null)
    console.log('🔄 Testing connection...')
    
    try {
      const url = '/api/greyfinch/analytics'
      console.log('📡 Making request to:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      const data = await response.json()
      console.log('📦 Response data:', data)
      setResponse(data)
      
      if (data.success) {
        console.log('✅ Setting connection to true')
        setIsConnected(true)
        setConnectionChecked(true)
      } else {
        console.log('❌ Setting connection to false')
        setIsConnected(false)
        setConnectionChecked(true)
        setError(data.message)
      }
    } catch (err) {
      console.log('❌ Error:', err)
      setIsConnected(false)
      setConnectionChecked(true)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
      console.log('🏁 Test completed. Final state:', { isConnected, connectionChecked })
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Connection Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              isLoading ? 'bg-yellow-100 text-yellow-800' :
              !connectionChecked ? 'bg-gray-100 text-gray-800' :
              isConnected ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {isLoading ? 'Checking...' : 
               !connectionChecked ? 'Not checked' :
               isConnected ? 'Connected' : 
               'Not Connected'}
            </span>
          </div>
          
          <Button onClick={checkConnection} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}
          
          {response && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-medium text-blue-800 mb-2">Response:</h3>
              <pre className="text-sm text-blue-700 overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
