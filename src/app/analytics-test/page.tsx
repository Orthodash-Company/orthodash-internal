'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AnalyticsTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🧪 Testing analytics endpoint...')
      const response = await fetch('/api/greyfinch/analytics')
      const data = await response.json()
      
      if (data.success) {
        setAnalyticsData(data.data)
        console.log('✅ Analytics test successful:', data.data)
      } else {
        setError(data.message || 'Failed to get analytics data')
        console.error('❌ Analytics test failed:', data.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('❌ Analytics test error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const testFieldDiscovery = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Testing field discovery...')
      const response = await fetch('/api/greyfinch/root-fields')
      const data = await response.json()
      
      if (data.success) {
        setAnalyticsData({
          fieldDiscovery: data,
          timestamp: new Date().toISOString()
        })
        console.log('✅ Field discovery successful:', data)
      } else {
        setError(data.message || 'Failed to discover fields')
        console.error('❌ Field discovery failed:', data.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('❌ Field discovery error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Test Page</h1>
        <div className="space-x-2">
          <Button 
            onClick={testAnalytics} 
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? 'Testing...' : 'Test Analytics'}
          </Button>
          <Button 
            onClick={testFieldDiscovery} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Discovering...' : 'Discover Fields'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {analyticsData && (
        <div className="grid gap-6">
          {analyticsData.fieldDiscovery ? (
            // Field discovery results
            <Card>
              <CardHeader>
                <CardTitle>Field Discovery Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Working Fields:</h3>
                  {analyticsData.fieldDiscovery.workingFields?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analyticsData.fieldDiscovery.workingFields.map((field: string) => (
                        <Badge key={field} variant="default" className="bg-green-100 text-green-800">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No working fields found</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Failing Fields (first 10):</h3>
                  {analyticsData.fieldDiscovery.failingFields?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analyticsData.fieldDiscovery.failingFields.slice(0, 10).map((field: string) => (
                        <Badge key={field} variant="secondary" className="bg-red-100 text-red-800">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No failing fields recorded</p>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(analyticsData.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Analytics data results
            <Card>
              <CardHeader>
                <CardTitle>Analytics Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Locations</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                      <div className="font-medium">Gilbert</div>
                      <div className="text-2xl font-bold">{analyticsData.locations.gilbert.count}</div>
                      <div className="text-sm text-gray-500">
                        Added: {analyticsData.locations.gilbert.dateAdded || 'Unknown'}
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium">Phoenix-Ahwatukee</div>
                      <div className="text-2xl font-bold">{analyticsData.locations.phoenixAhwatukee?.count || 0}</div>
                      <div className="text-sm text-gray-500">
                        Added: {analyticsData.locations.scottsdale.dateAdded || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Data Counts</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded">
                      <div className="font-medium">Patients</div>
                      <div className="text-2xl font-bold">{analyticsData.patients.count}</div>
                      <div className="text-sm text-gray-500">
                        First: {analyticsData.patients.dateAdded || 'Unknown'}
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium">Appointments</div>
                      <div className="text-2xl font-bold">{analyticsData.appointments.count}</div>
                      <div className="text-sm text-gray-500">
                        First: {analyticsData.appointments.dateAdded || 'Unknown'}
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium">Leads</div>
                      <div className="text-2xl font-bold">{analyticsData.leads.count}</div>
                      <div className="text-sm text-gray-500">
                        First: {analyticsData.leads.dateAdded || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Last updated: {new Date(analyticsData.lastUpdated).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• <strong>Test Analytics:</strong> Tests the new analytics endpoint that focuses on getting row counts and date information for Gilbert and Phoenix-Ahwatukee locations.</p>
            <p>• <strong>Discover Fields:</strong> Tests various field names to find which ones work with the Greyfinch API.</p>
            <p>• The analytics endpoint tries multiple field name variations to find the correct ones for each data type.</p>
            <p>• This helps us understand what data is available and how to access it for your reporting tool.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
