'use client'

import { useState, useEffect } from 'react'
import { GreyfinchSchemaTester } from '@/components/GreyfinchSchemaTester'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Database, Users, Calendar, MapPin, TrendingUp } from 'lucide-react'

export default function TestGreyfinchPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown')
  const { toast } = useToast()

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/greyfinch/test')
      const data = await response.json()
      
      if (data.success) {
        setConnectionStatus('connected')
        toast({
          title: "Connection Test",
          description: "Greyfinch API connection successful!",
        })
      } else {
        setConnectionStatus('failed')
        toast({
          title: "Connection Test Failed",
          description: data.message || "Failed to connect to Greyfinch API",
          variant: "destructive"
        })
      }
    } catch (error) {
      setConnectionStatus('failed')
      toast({
        title: "Connection Test Failed",
        description: "Failed to test Greyfinch API connection",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDataFetching = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/greyfinch/dashboard-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: 'test-user',
          periodConfigs: []
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setTestResults(data.data)
        toast({
          title: "Data Fetch Test",
          description: "Successfully fetched data from Greyfinch API!",
        })
      } else {
        toast({
          title: "Data Fetch Failed",
          description: data.message || "Failed to fetch data from Greyfinch API",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Data Fetch Error",
        description: "Failed to test data fetching",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'failed': return 'Failed'
      default: return 'Unknown'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Greyfinch API Integration Test</h1>
        <p className="text-gray-600 mb-6">
          Test the Greyfinch GraphQL API integration with proper field naming
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Test the connection to the Greyfinch GraphQL API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            <Button 
              onClick={testConnection}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Fetching Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Data Fetching Test
          </CardTitle>
          <CardDescription>
            Test fetching comprehensive data from Greyfinch API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testDataFetching}
            disabled={isLoading || connectionStatus !== 'connected'}
          >
            {isLoading ? 'Fetching...' : 'Fetch Dashboard Data'}
          </Button>

          {testResults && (
            <div className="space-y-4">
              <h3 className="font-semibold">Results:</h3>
              
              {/* Counts */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-lg font-bold">{testResults.counts?.patients || 0}</div>
                  <div className="text-sm text-gray-600">Patients</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <div className="text-lg font-bold">{testResults.counts?.appointments || 0}</div>
                  <div className="text-sm text-gray-600">Appointments</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <MapPin className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                  <div className="text-lg font-bold">{testResults.counts?.locations || 0}</div>
                  <div className="text-sm text-gray-600">Locations</div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                  <div className="text-lg font-bold">{testResults.counts?.leads || 0}</div>
                  <div className="text-sm text-gray-600">Leads</div>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-1 text-red-600" />
                  <div className="text-lg font-bold">{testResults.counts?.bookings || 0}</div>
                  <div className="text-sm text-gray-600">Bookings</div>
                </div>
              </div>

              {/* Raw Data Preview */}
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Raw Data Preview:</h4>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-auto">
                  <pre className="text-sm">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Tester */}
      <GreyfinchSchemaTester />
    </div>
  )
}
