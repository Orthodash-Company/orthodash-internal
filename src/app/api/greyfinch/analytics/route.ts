import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'
import { GREYFINCH_QUERIES } from '@/lib/services/greyfinch-schema'

function getAggregateCount(result: any, key: string) {
  return result?.[key]?.aggregate?.count ?? 0
}

function buildSummaryResponse(result: any, startDate: string | null, endDate: string | null, location: string) {
  const locations = Array.isArray(result?.locations) ? result.locations : []
  const gilbertLocation = locations.find((entry: any) => entry.name === 'Gilbert')
  const phoenixLocation = locations.find((entry: any) => entry.name === 'Phoenix-Ahwatukee')

  const gilbert = {
    id: gilbertLocation?.id ?? 'gilbert-1',
    name: 'Gilbert',
    patients: 0,
    appointments: 0,
    leads: 0,
    bookings: 0,
    production: 0,
    revenue: 0,
    netProduction: 0,
    acquisitionCosts: 0,
  }

  const phoenix = {
    id: 'phoenix-ahwatukee-1',
    name: 'Phoenix-Ahwatukee',
    patients: 0,
    appointments: 0,
    leads: 0,
    bookings: 0,
    production: 0,
    revenue: 0,
    netProduction: 0,
    acquisitionCosts: 0,
  }

  const resolvedLocations = {
    gilbert: gilbertLocation ?? { id: gilbert.id, name: gilbert.name, isActive: true },
    phoenix: phoenixLocation ?? { id: phoenix.id, name: phoenix.name, isActive: true },
  }

  const totalPatients = getAggregateCount(result, 'patients')
  const totalAppointments = getAggregateCount(result, 'appointments')
  const totalLeads = getAggregateCount(result, 'leads')
  const totalBookings = getAggregateCount(result, 'bookings')

  return {
    total: {
      period: 'Current Period',
      startDate: startDate ?? '',
      endDate: endDate ?? '',
      avgNetProduction: 0,
      avgAcquisitionCost: 0,
      noShowRate: 0,
      referralSources: { digital: 0, professional: 0, direct: 0 },
      conversionRates: { digital: 0, professional: 0, direct: 0 },
      trends: { weekly: [] },
      patients: totalPatients,
      appointments: totalAppointments,
      leads: totalLeads,
      locations: locations.length,
      bookings: totalBookings,
      production: 0,
      revenue: 0,
      netProduction: 0,
      acquisitionCosts: 0,
      locationData: {
        gilbert,
        phoenix,
      },
    },
    locations: resolvedLocations,
    locationData: {
      gilbert,
      phoenix,
    },
    trends: { weekly: [], monthly: [] },
    financialMetrics: {
      totalProduction: 0,
      totalRevenue: 0,
      totalNetProduction: 0,
      totalAcquisitionCosts: 0,
      profitMargin: 0,
      roi: 0,
    },
    lastUpdated: new Date().toISOString(),
    queryParams: { startDate, endDate, location },
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const location = searchParams.get('location') || 'all'
    
    console.log('📊 Fetching multi-location Greyfinch data...', { startDate, endDate, location })
    
    // Get multi-location analytics data
    try {
      console.log('🔍 Fetching Gilbert and Phoenix-Ahwatukee data...')
      
      const query = GREYFINCH_QUERIES.GET_BASIC_COUNTS
      
      // Create a new service instance and update with environment variables
      const freshService = new GreyfinchService()
      freshService.updateCredentials(
        process.env.GREYFINCH_API_KEY || '', 
        process.env.GREYFINCH_API_SECRET || ''
      )
      const result = await freshService.makeGraphQLRequest(query)
      console.log('📊 Greyfinch dashboard summary received:', result)
      
      if (!result || !Array.isArray(result.locations)) {
        throw new Error('Failed to fetch Greyfinch dashboard summary')
      }
      
      const responseData = buildSummaryResponse(result, startDate, endDate, location)
      console.log('✅ Greyfinch dashboard summary processed successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Greyfinch dashboard summary retrieved successfully',
        data: responseData
      })

    } catch (graphqlError) {
      console.error('❌ Greyfinch analytics fetch failed:', graphqlError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch live Greyfinch analytics data',
        error: graphqlError instanceof Error ? graphqlError.message : String(graphqlError),
      }, { status: 502 })
    }

  } catch (error) {
    console.error('❌ Gilbert data fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch Gilbert data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle custom GraphQL queries for data exploration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body
    
    console.log('🔍 Custom GraphQL query received:', query)
    
    if (!query) {
      return NextResponse.json({
        success: false,
        message: 'No GraphQL query provided'
      }, { status: 400 })
    }

    const greyfinch = new GreyfinchService()
    
    // Test connection first
    const connectionTest = await greyfinch.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Greyfinch API',
        error: connectionTest.message
      }, { status: 500 })
    }

    try {
      // Execute the custom GraphQL query
      console.log('🚀 Executing custom GraphQL query...')
      const result = await greyfinch.makeGraphQLRequest(query)
      console.log('✅ Custom query executed successfully:', result)
      
      return NextResponse.json({
        success: true,
        message: 'Custom GraphQL query executed successfully',
        data: result
      })
      
    } catch (graphqlError) {
      console.error('❌ Custom GraphQL query failed:', graphqlError)
      return NextResponse.json({
        success: false,
        message: 'Custom GraphQL query failed',
        error: graphqlError instanceof Error ? graphqlError.message : 'Unknown GraphQL error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ POST request error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process POST request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
