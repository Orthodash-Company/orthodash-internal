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
      
      // Return fallback data with $0 financials
      const fallbackData = {
        financialReport: {
          reportType,
          startDate,
          endDate,
          totalRevenue: 0,
          totalExpenses: 0,
          netIncome: 0,
          grossProfit: 0,
          grossProfitMargin: 0,
          locationBreakdown: {
            gilbert: {
              revenue: 0,
              expenses: 0,
              netIncome: 0,
              profitMargin: 0
            },
            phoenix: {
              revenue: 0,
              expenses: 0,
              netIncome: 0,
              profitMargin: 0
            }
          },
          monthlyBreakdown: [],
          weeklyBreakdown: [],
          topCustomers: [],
          topItems: [],
          generatedAt: new Date().toISOString()
        },
        revenueMetrics: {
          totalRevenue: 0,
          monthlyRevenue: 0,
          weeklyRevenue: 0,
          dailyRevenue: 0,
          averageRevenuePerCustomer: 0,
          averageRevenuePerInvoice: 0,
          revenueGrowth: 0,
          revenueGrowthPercentage: 0,
          topRevenueSources: [],
          revenueByMonth: [],
          revenueByWeek: [],
          lastUpdated: new Date().toISOString()
        },
        queryParams: { startDate, endDate, reportType },
        lastUpdated: new Date().toISOString(),
        apiStatus: 'QuickBooks Fallback Data (All Financials = $0)'
      }

      return NextResponse.json({
        success: true,
        message: 'QuickBooks financial reports retrieved with fallback',
        data: fallbackData,
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
      })
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
