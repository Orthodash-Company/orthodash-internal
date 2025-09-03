'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Database, RefreshCw } from 'lucide-react'

interface GreyfinchDataModalProps {
  onDataSelected?: (selection: any) => void
  trigger?: React.ReactNode
}

export function GreyfinchDataModal({ onDataSelected, trigger }: GreyfinchDataModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchLocations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Fetching locations...')
      const response = await fetch('/api/locations')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Locations data:', data)
      setLocations(data)
    } catch (error) {
      console.error('Error fetching locations:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId)
    if (onDataSelected) {
      onDataSelected({ locationId, type: 'location' })
    }
  }

  const handleRefresh = () => {
    fetchLocations()
  }

  // Fetch locations on component mount
  useEffect(() => {
    console.log('GreyfinchDataModal mounted, fetching locations...')
    fetchLocations()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Practice Locations
        </CardTitle>
        <CardDescription>
          Select a practice location to view analytics data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Available Locations</span>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">Error: {error}</p>
            <Button onClick={fetchLocations} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading locations...</p>
          </div>
        ) : locations.length > 0 ? (
          <div className="grid gap-2">
            {locations.map((location) => (
              <Button
                key={location.id}
                onClick={() => handleLocationSelect(location.id.toString())}
                variant={selectedLocation === location.id.toString() ? "default" : "outline"}
                className="justify-start"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{location.name}</span>
                  {location.patientCount && (
                    <Badge variant="secondary" className="ml-auto">
                      {location.patientCount} patients
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">No locations found</p>
            <Button onClick={fetchLocations} variant="outline" size="sm" className="mt-2">
              Load Locations
            </Button>
          </div>
        )}

        {selectedLocation && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Selected: {locations.find(l => l.id.toString() === selectedLocation)?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
