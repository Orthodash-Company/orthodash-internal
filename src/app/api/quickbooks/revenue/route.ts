import { NextRequest, NextResponse } from 'next/server'
import { QuickBooksService } from '@/lib/services/quickbooks/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const locationFilter = searchParams.get('location') || undefined

    console.log('Fetching QuickBooks revenue data...', { startDate, endDate, locationFilter })

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        message: 'startDate and endDate parameters are required'
      }, { status: 400 })
    }

    const quickbooksService = new QuickBooksService()

    try {
      // Get revenue data from QuickBooks
      const revenueData = await quickbooksService.getRevenueData(startDate, endDate, locationFilter)
      
      // Get location-based revenue summary
      const locationRevenue = await quickbooksService.getLocationRevenue(startDate, endDate)
      
      // Get revenue metrics
      const revenueMetrics = await quickbooksService.getRevenueMetrics(locationFilter)

      console.log('QuickBooks revenue data fetched successfully:', {
        revenueRecords: revenueData.length,
        locations: locationRevenue.length,
        hasMetrics: !!revenueMetrics
      })

      return NextResponse.json({
        success: true,
        message: 'QuickBooks revenue data retrieved successfully',
        data: {
          revenueData,
          locationRevenue,
          revenueMetrics,
          queryParams: { startDate, endDate, locationFilter },
          lastUpdated: new Date().toISOString()
        }
      })
    } catch (qbError: any) {
      console.error('QuickBooks revenue fetch failed:', qbError)
      return NextResponse.json({
        success: false,
        message: 'Failed to retrieve live QuickBooks revenue data',
        error: qbError.message,
        debug: {
          hasConsumerKey: !!process.env.QUICKBOOKS_CONSUMER_KEY,
          hasConsumerSecret: !!process.env.QUICKBOOKS_CONSUMER_SECRET,
          hasAccessToken: !!process.env.QUICKBOOKS_ACCESS_TOKEN,
          hasAccessTokenSecret: !!process.env.QUICKBOOKS_ACCESS_TOKEN_SECRET,
          hasCompanyId: !!process.env.QUICKBOOKS_COMPANY_ID,
          sandbox: process.env.QUICKBOOKS_SANDBOX === 'true',
          timestamp: new Date().toISOString()
        }
      }, { status: 502 })
    }
  } catch (error: any) {
    console.error('QuickBooks revenue endpoint error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve QuickBooks revenue data',
      error: error.message
    }, { status: 500 })
  }
}
