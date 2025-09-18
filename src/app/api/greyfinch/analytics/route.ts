import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService, greyfinchService } from '@/lib/services/greyfinch'
import { GreyfinchSchemaUtils, GREYFINCH_QUERIES } from '@/lib/services/greyfinch-schema'
import { MultiLocationDataProcessor } from '@/lib/services/multi-location-data-processor'

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
      
      // Use comprehensive multi-location query
      const query = GREYFINCH_QUERIES.GET_ANALYTICS_DATA
      
      // Create a new service instance and update with environment variables
      const freshService = new GreyfinchService()
      freshService.updateCredentials(
        process.env.GREYFINCH_API_KEY || '', 
        process.env.GREYFINCH_API_SECRET || ''
      )
      const result = await freshService.makeGraphQLRequest(query)
      console.log('📊 Multi-location data received:', result)
      
      // Check if we have data regardless of success flag
      if (!result.data && !result.locations && !result.appointments) {
        throw new Error(result.error || 'Failed to fetch multi-location data')
      }
      
      // Process the multi-location data using the new processor
      const dataToProcess = result.data || result
      const processedData = MultiLocationDataProcessor.processMultiLocationData(dataToProcess, startDate, endDate)
      
      // Add metadata
      processedData.lastUpdated = new Date().toISOString()
      processedData.queryParams = { startDate, endDate, location }
      
      // Filter by date range if specified
      if (startDate || endDate) {
        const filterByDateRange = (data: any[], dateField: string) => {
          return data.filter((item: any) => {
            const itemDate = new Date(item[dateField])
            const start = startDate ? new Date(startDate) : null
            const end = endDate ? new Date(endDate) : null
            
            if (start && itemDate < start) return false
            if (end && itemDate > end) return false
            return true
          })
        }

        // Apply date filtering to Gilbert data
        if (processedData.leads.data) {
          const filteredLeads = filterByDateRange(processedData.leads.data, 'createdAt')
          processedData.leads.data = filteredLeads
          processedData.leads.count = filteredLeads.length
          processedData.summary.gilbertCounts.leads = filteredLeads.length
        }

        if (processedData.appointments.data) {
          const filteredAppointments = filterByDateRange(processedData.appointments.data, 'scheduledDate')
          processedData.appointments.data = filteredAppointments
          processedData.appointments.count = filteredAppointments.length
          processedData.summary.gilbertCounts.appointments = filteredAppointments.length
        }

        if (processedData.bookings.data) {
          const filteredBookings = filterByDateRange(processedData.bookings.data, 'startTime')
          processedData.bookings.data = filteredBookings
          processedData.bookings.count = filteredBookings.length
          processedData.summary.gilbertCounts.bookings = filteredBookings.length
        }

        if (processedData.patients.data) {
          const filteredPatients = filterByDateRange(processedData.patients.data, 'createdAt')
          processedData.patients.data = filteredPatients
          processedData.patients.count = filteredPatients.length
          processedData.summary.gilbertCounts.patients = filteredPatients.length
        }

        // Update total counts
        processedData.summary.totalLeads = processedData.summary.gilbertCounts.leads
        processedData.summary.totalAppointments = processedData.summary.gilbertCounts.appointments
        processedData.summary.totalBookings = processedData.summary.gilbertCounts.bookings
        processedData.summary.totalPatients = processedData.summary.gilbertCounts.patients
      }

      console.log('✅ Gilbert data processed successfully')
      
  return NextResponse.json({
    success: true,
        message: 'Gilbert data retrieved successfully',
        data: processedData
      })

    } catch (graphqlError) {
      console.error('❌ Gilbert data fetch failed with error:', graphqlError)
      console.error('❌ Error details:', JSON.stringify(graphqlError, null, 2))
      console.error('❌ Error stack:', graphqlError instanceof Error ? graphqlError.stack : 'No stack trace')
      
      // Return Gilbert fallback data with realistic sample counts and financial data for testing
      const fallbackData = {
      locations: {
          'gilbert-1': { id: 'gilbert-1', name: 'Gilbert', count: 1250, isActive: true },
          'phoenix-ahwatukee-1': { id: 'phoenix-ahwatukee-1', name: 'Phoenix-Ahwatukee', count: 850, isActive: true }
        },
        gilbertCounts: {
          patients: 1250,
          appointments: 89,
          leads: 45,
          bookings: 67,
          revenue: 45000, // Sample revenue data
          production: 52000, // Sample production data
          netProduction: 42000 // Sample net production data
        },
        phoenixCounts: {
          patients: 850,
          appointments: 62,
          leads: 32,
          bookings: 45,
          revenue: 32000, // Sample revenue data
          production: 38000, // Sample production data
          netProduction: 31000 // Sample net production data
        },
        leads: { count: 77, data: [] },
        appointments: { count: 151, data: [] },
        bookings: { count: 112, data: [] },
        patients: { count: 2100, data: [] },
        revenue: { total: 77000, data: [] }, // Combined revenue
        production: { total: 90000, netProduction: 73000, data: [] }, // Combined production
        summary: {
          totalLeads: 77,
          totalAppointments: 151,
          totalBookings: 112,
          totalPatients: 2100,
          totalRevenue: 77000,
          totalProduction: 90000,
          totalNetProduction: 73000,
          gilbertCounts: { leads: 45, appointments: 89, bookings: 67, patients: 1250, revenue: 45000, production: 52000, netProduction: 42000 },
          phoenixCounts: { leads: 32, appointments: 62, bookings: 45, patients: 850, revenue: 32000, production: 38000, netProduction: 31000 }
        },
        lastUpdated: new Date().toISOString(),
        queryParams: { startDate, endDate, location },
        apiStatus: 'Both Locations Fallback Data with Financials'
      }

      return NextResponse.json({
        success: true,
        message: 'Gilbert data retrieved with fallback',
        data: fallbackData,
        error: graphqlError instanceof Error ? graphqlError.message : String(graphqlError),
        errorStack: graphqlError instanceof Error ? graphqlError.stack : undefined,
        debug: {
          hasApiKey: !!process.env.GREYFINCH_API_KEY,
          hasApiSecret: !!process.env.GREYFINCH_API_SECRET,
          apiKeyPrefix: process.env.GREYFINCH_API_KEY?.substring(0, 10) + '...',
          timestamp: new Date().toISOString()
        }
      })
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
