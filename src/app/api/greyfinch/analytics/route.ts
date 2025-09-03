import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'
import { GreyfinchSchemaUtils } from '@/lib/services/greyfinch-schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const location = searchParams.get('location') // 'gilbert', 'scottsdale', or 'all'
    
    console.log('📊 Fetching Greyfinch analytics data...', { startDate, endDate, location })
    
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

    // Get comprehensive analytics data
    try {
      console.log('🔍 Attempting to fetch comprehensive analytics data...')
      const result = await GreyfinchSchemaUtils.getAnalyticsData()
      console.log('📊 Comprehensive analytics data received:', result)
      
      // Process the data using the enhanced utility
      const processedData = GreyfinchSchemaUtils.processDataByLocation(result, startDate, endDate, location)
      
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

        // Apply date filtering
        if (processedData.leads.data) {
          const filteredLeads = filterByDateRange(processedData.leads.data, 'createdAt')
          processedData.leads.data = filteredLeads
          processedData.leads.count = filteredLeads.length
        }

        if (processedData.appointments.data) {
          const filteredAppointments = filterByDateRange(processedData.appointments.data, 'scheduledDate')
          processedData.appointments.data = filteredAppointments
          processedData.appointments.count = filteredAppointments.length
        }

        if (processedData.bookings.data) {
          const filteredBookings = filterByDateRange(processedData.bookings.data, 'startTime')
          processedData.bookings.data = filteredBookings
          processedData.bookings.count = filteredBookings.length
        }

        if (processedData.patients.data) {
          const filteredPatients = filterByDateRange(processedData.patients.data, 'createdAt')
          processedData.patients.data = filteredPatients
          processedData.patients.count = filteredPatients.length
        }

        // Recalculate summary counts after filtering
        processedData.summary.totalLeads = processedData.leads.count
        processedData.summary.totalAppointments = processedData.appointments.count
        processedData.summary.totalBookings = processedData.bookings.count
        processedData.summary.totalPatients = processedData.patients.count
      }

      // Filter by specific location if requested
      if (location && location !== 'all') {
        const locationName = location.toLowerCase()
        if (locationName === 'gilbert') {
          processedData.summary.totalLeads = processedData.summary.gilbertCounts.leads
          processedData.summary.totalAppointments = processedData.summary.gilbertCounts.appointments
          processedData.summary.totalBookings = processedData.summary.gilbertCounts.bookings
          processedData.summary.totalPatients = processedData.summary.gilbertCounts.patients
          processedData.summary.totalRevenue = processedData.summary.gilbertCounts.revenue
        } else if (locationName === 'scottsdale') {
          processedData.summary.totalLeads = processedData.summary.scottsdaleCounts.leads
          processedData.summary.totalAppointments = processedData.summary.scottsdaleCounts.appointments
          processedData.summary.totalBookings = processedData.summary.scottsdaleCounts.bookings
          processedData.summary.totalPatients = processedData.summary.scottsdaleCounts.patients
          processedData.summary.totalRevenue = processedData.summary.scottsdaleCounts.revenue
        }
      }

      console.log('✅ Analytics data processed successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Analytics data retrieved successfully',
        data: processedData
      })

    } catch (graphqlError) {
      console.log('⚠️ Comprehensive query failed, trying basic counts...')
      
      try {
        // Fallback to basic counts query
        const basicResult = await GreyfinchSchemaUtils.getBasicCounts()
        console.log('📊 Basic counts data received:', basicResult)
        
        // Process basic data
        const processedData = GreyfinchSchemaUtils.processDataByLocation(basicResult, startDate, endDate, location)
        processedData.lastUpdated = new Date().toISOString()
        processedData.queryParams = { startDate, endDate, location }
        processedData.apiStatus = 'Basic Data Available'
        
        return NextResponse.json({
          success: true,
          message: 'Analytics data retrieved with basic counts',
          data: processedData
        })
        
      } catch (basicError) {
        console.log('⚠️ Basic counts also failed, using fallback data:', basicError)
        
        // Return fallback data if all queries fail
        const fallbackData = {
          locations: {
            gilbert: { id: 'gilbert-1', name: 'Gilbert', count: 0 },
            scottsdale: { id: 'scottsdale-1', name: 'Scottsdale', count: 0 }
          },
          leads: { count: 0, data: [] },
          appointments: { count: 0, data: [] },
          bookings: { count: 0, data: [] },
          patients: { count: 0, data: [] },
          revenue: { total: 0, data: [] },
          summary: {
            totalLeads: 0,
            totalAppointments: 0,
            totalBookings: 0,
            totalPatients: 0,
            totalRevenue: 0,
            gilbertCounts: { leads: 0, appointments: 0, bookings: 0, patients: 0, revenue: 0 },
            scottsdaleCounts: { leads: 0, appointments: 0, bookings: 0, patients: 0, revenue: 0 }
          },
          lastUpdated: new Date().toISOString(),
          queryParams: { startDate, endDate, location },
          apiStatus: 'Fallback Data',
          error: 'All GraphQL queries failed'
        }

        return NextResponse.json({
          success: true,
          message: 'Analytics data retrieved with fallback data',
          data: fallbackData
        })
      }
    }

  } catch (error) {
    console.error('❌ Analytics data fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
