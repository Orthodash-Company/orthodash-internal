import { NextRequest, NextResponse } from 'next/server'
import { QuickBooksService } from '@/lib/services/quickbooks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || undefined

    console.log('Fetching QuickBooks customer data...', { location })

    const quickbooksService = new QuickBooksService()

    try {
      // Get customer data from QuickBooks
      const customerData = await quickbooksService.getCustomerData(location)

      console.log('QuickBooks customer data fetched successfully:', {
        customerCount: customerData.length
      })

      return NextResponse.json({
        success: true,
        message: 'QuickBooks customer data retrieved successfully',
        data: {
          customers: customerData,
          queryParams: { location },
          lastUpdated: new Date().toISOString()
        }
      })
    } catch (qbError: any) {
      console.error('QuickBooks customer fetch failed:', qbError)
      
      // Return fallback data
      const fallbackData = {
        customers: [],
        queryParams: { location },
        lastUpdated: new Date().toISOString(),
        apiStatus: 'QuickBooks Fallback Data (No Customers)'
      }

      return NextResponse.json({
        success: true,
        message: 'QuickBooks customer data retrieved with fallback',
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
    console.error('QuickBooks customer endpoint error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve QuickBooks customer data',
      error: error.message
    }, { status: 500 })
  }
}
