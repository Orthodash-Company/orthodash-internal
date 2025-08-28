import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'
import { GreyfinchDataService } from '@/lib/services/greyfinch-data'

export async function POST(request: NextRequest) {
  try {
    const { userId, periodConfigs = [] } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 })
    }
    
    console.log('Fetching dashboard data for user:', userId)
    
    // Check if we have API credentials
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Greyfinch API key is not configured.',
        error: 'MISSING_API_KEY'
      }, { status: 400 })
    }
    
    // Update service with environment credentials
    greyfinchService.updateCredentials(envApiKey)
    
    // Fetch comprehensive dashboard data
    const result = await GreyfinchDataService.fetchDashboardData(userId)
    
    if (result.success) {
      // Generate period-specific data if period configs are provided
      let periodData = {}
      if (periodConfigs.length > 0 && result.data) {
        periodData = periodConfigs.reduce((acc: any, period: any) => {
          acc[period.id] = GreyfinchDataService.generatePeriodData(period, result.data)
          return acc
        }, {})
      }
      
      return NextResponse.json({
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          ...result.data,
          periodData,
          pulledAt: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to fetch dashboard data',
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Dashboard data fetch failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const periodId = searchParams.get('periodId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const locationId = searchParams.get('locationId')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 })
    }
    
    console.log('Fetching dashboard data for user:', userId, 'period:', periodId)
    
    // Check if we have API credentials
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Greyfinch API key is not configured.',
        error: 'MISSING_API_KEY'
      }, { status: 400 })
    }
    
    // Update service with environment credentials
    greyfinchService.updateCredentials(envApiKey)
    
    // Fetch comprehensive dashboard data
    const result = await GreyfinchDataService.fetchDashboardData(userId)
    
    if (result.success) {
      let responseData = result.data
      
      // If period-specific data is requested
      if (periodId && startDate && endDate) {
        const periodConfig = {
          id: periodId,
          startDate,
          endDate,
          locationId: locationId || undefined
        }
        
        const periodData = GreyfinchDataService.generatePeriodData(periodConfig, result.data)
        responseData = {
          ...result.data,
          periodData: { [periodId]: periodData }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          ...responseData,
          pulledAt: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to fetch dashboard data',
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Dashboard data fetch failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
