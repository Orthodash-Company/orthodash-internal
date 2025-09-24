'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Database, 
  Users, 
  Calendar, 
  MapPin, 
  RefreshCw, 
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react'

interface GreyfinchDataSummary {
  locations: {
    count: number
    names: string[]
  }
  patients: {
    count: number
    types: Record<string, number>
  }
  appointments: {
    count: number
    types: Record<string, number>
    weekly: Record<string, number>
  }
  leads: {
    count: number
    sources: Record<string, number>
  }
  bookings: {
    count: number
    weekly: Record<string, number>
  }
  revenue: {
    total: number
    weekly: Record<string, number>
  }
  production: {
    total: number
    weekly: Record<string, number>
  }
}

export function GreyfinchDataExplorer() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<GreyfinchDataSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchGreyfinchData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Pinging Greyfinch GraphQL API...')
      
      // Simple GraphQL query to get comprehensive data
      const query = `
        query GetComprehensiveData {
          locations {
            id
            name
            address
            isActive
          }
          patients {
            id
            firstName
            lastName
            primaryLocation {
              id
              name
            }
            createdAt
          }
          appointments {
            id
            appointmentType
            status
            scheduledDate
            locationId
            revenue
            createdAt
          }
          leads {
            id
            source
            status
            locationId
            createdAt
          }
          appointmentBookings {
            id
            startTime
            appointmentId
            createdAt
          }
          revenue {
            id
            amount
            date
            locationId
            createdAt
          }
          production {
            id
            productionAmount
            netProduction
            date
            locationId
            createdAt
          }
        }
      `

      const response = await fetch('/api/greyfinch/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('📊 Greyfinch API Response:', result)

      if (result.success && result.data) {
        const processedData = processGreyfinchData(result.data)
        setData(processedData)
        setLastUpdated(new Date().toISOString())
      } else {
        throw new Error(result.message || 'Failed to fetch data')
      }
    } catch (err) {
      console.error('❌ Error fetching Greyfinch data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const processGreyfinchData = (rawData: any): GreyfinchDataSummary => {
    // Handle locations as object (gilbert, phoenix) or array
    let locations = rawData.locations || []
    if (rawData.locations && typeof rawData.locations === 'object' && !Array.isArray(rawData.locations)) {
      // Convert object to array format for processing
      locations = Object.keys(rawData.locations).map(key => ({
        name: key === 'gilbert' ? 'Gilbert' : key === 'phoenix' ? 'Phoenix-Ahwatukee' : key,
        id: key,
        ...rawData.locations[key]
      }))
    }
    
    const patients = rawData.patients || []
    const appointments = rawData.appointments || []
    const leads = rawData.leads || []
    const bookings = rawData.appointmentBookings || []
    const revenue = rawData.revenue || []
    const production = rawData.production || []

    // Process locations
    const locationNames = locations.map((loc: any) => loc.name).filter(Boolean)
    
    // Process patients by type (based on primary location)
    const patientTypes: Record<string, number> = {}
    patients.forEach((patient: any) => {
      const locationName = patient.primaryLocation?.name || 'Unknown'
      patientTypes[locationName] = (patientTypes[locationName] || 0) + 1
    })

    // Process appointments by type and weekly
    const appointmentTypes: Record<string, number> = {}
    const weeklyAppointments: Record<string, number> = {}
    
    appointments.forEach((apt: any) => {
      const type = apt.appointmentType || 'Unknown'
      appointmentTypes[type] = (appointmentTypes[type] || 0) + 1
      
      if (apt.scheduledDate) {
        const week = getWeekFromDate(apt.scheduledDate)
        weeklyAppointments[week] = (weeklyAppointments[week] || 0) + 1
      }
    })

    // Process leads by source
    const leadSources: Record<string, number> = {}
    leads.forEach((lead: any) => {
      const source = lead.source || 'Unknown'
      leadSources[source] = (leadSources[source] || 0) + 1
    })

    // Process bookings weekly
    const weeklyBookings: Record<string, number> = {}
    bookings.forEach((booking: any) => {
      if (booking.startTime) {
        const week = getWeekFromDate(booking.startTime)
        weeklyBookings[week] = (weeklyBookings[week] || 0) + 1
      }
    })

    // Process revenue weekly
    const weeklyRevenue: Record<string, number> = {}
    const totalRevenue = revenue.reduce((sum: number, rev: any) => sum + (rev.amount || 0), 0)
    revenue.forEach((rev: any) => {
      if (rev.date) {
        const week = getWeekFromDate(rev.date)
        weeklyRevenue[week] = (weeklyRevenue[week] || 0) + (rev.amount || 0)
      }
    })

    // Process production weekly
    const weeklyProduction: Record<string, number> = {}
    const totalProduction = production.reduce((sum: number, prod: any) => sum + (prod.productionAmount || 0), 0)
    production.forEach((prod: any) => {
      if (prod.date) {
        const week = getWeekFromDate(prod.date)
        weeklyProduction[week] = (weeklyProduction[week] || 0) + (prod.productionAmount || 0)
      }
    })

    return {
      locations: {
        count: locations.length,
        names: locationNames
      },
      patients: {
        count: patients.length,
        types: patientTypes
      },
      appointments: {
        count: appointments.length,
        types: appointmentTypes,
        weekly: weeklyAppointments
      },
      leads: {
        count: leads.length,
        sources: leadSources
      },
      bookings: {
        count: bookings.length,
        weekly: weeklyBookings
      },
      revenue: {
        total: totalRevenue,
        weekly: weeklyRevenue
      },
      production: {
        total: totalProduction,
        weekly: weeklyProduction
      }
    }
  }

  const getWeekFromDate = (dateString: string): string => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
    return `Week ${week}, ${year}`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  useEffect(() => {
    // Auto-fetch data on component mount
    fetchGreyfinchData()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Greyfinch Data Explorer
            </CardTitle>
            <Button
              onClick={fetchGreyfinchData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Fetching...' : 'Refresh Data'}
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-600">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">Error: {error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Locations Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Locations</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{data.locations.count}</p>
                    <div className="mt-2 space-y-1">
                      {data.locations.names.map((name, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Patients</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{data.patients.count}</p>
                    <div className="mt-2 space-y-1">
                      {Object.entries(data.patients.types).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span>{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold">Appointments</h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{data.appointments.count}</p>
                    <div className="mt-2 space-y-1">
                      {Object.entries(data.appointments.types).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span>{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Weekly Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weekly Appointments */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Appointments by Week
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(data.appointments.weekly)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 8)
                          .map(([week, count]) => (
                            <div key={week} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{week}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Weekly Revenue */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Revenue by Week
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(data.revenue.weekly)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 8)
                          .map(([week, amount]) => (
                            <div key={week} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{week}</span>
                              <Badge variant="outline" className="text-green-700">
                                {formatCurrency(amount)}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(data.revenue.total)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Production</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(data.production.total)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Leads</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {data.leads.count}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
