import { NextRequest, NextResponse } from 'next/server'
import { QuickBooksService } from '@/lib/services/quickbooks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('reportType') || 'ProfitAndLoss'

    console.log('Fetching QuickBooks financial reports...', { startDate, endDate, reportType })

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        message: 'startDate and endDate parameters are required'
      }, { status: 400 })
    }

    const quickbooksService = new QuickBooksService()

    try {
      // Get financial reports from QuickBooks
      const financialReport = await quickbooksService.getFinancialReports(startDate, endDate, reportType)
      
      // Get revenue metrics for additional insights
      const revenueMetrics = await quickbooksService.getRevenueMetrics()

      console.log('QuickBooks financial reports fetched successfully:', {
        reportType,
        hasReport: !!financialReport,
        hasMetrics: !!revenueMetrics
      })

      return NextResponse.json({
        success: true,
        message: 'QuickBooks financial reports retrieved successfully',
        data: {
          financialReport,
          revenueMetrics,
          queryParams: { startDate, endDate, reportType },
          lastUpdated: new Date().toISOString()
        }
      })
    } catch (qbError: any) {
      console.error('QuickBooks reports fetch failed:', qbError)
      return NextResponse.json({
        success: false,
        message: 'Failed to retrieve live QuickBooks financial reports',
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
    console.error('QuickBooks reports endpoint error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve QuickBooks financial reports',
      error: error.message
    }, { status: 500 })
  }
}
