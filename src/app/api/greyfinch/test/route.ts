import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET() {
  try {
    // Test the connection first (without credentials - will return "not configured" status)
    const connectionTest = await greyfinchService.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: connectionTest.message,
        error: connectionTest.error || 'Connection failed'
      }, { status: 400 }) // Changed from 500 to 400 for "not configured" status
    }

    // Pull basic counts to verify data access
    const basicCounts = await greyfinchService.pullBasicCounts('test-user')
    
    return NextResponse.json({
      success: true,
      message: 'Greyfinch API connection successful',
      connectionTest: connectionTest.data,
      basicCounts: basicCounts.counts
    })
  } catch (error) {
    console.error('Greyfinch test failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Greyfinch API connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, apiSecret, userId } = body;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'API Key is required'
      }, { status: 400 })
    }

    // Update the service with the provided credentials
    greyfinchService.updateCredentials(apiKey)

    // Test the connection
    const connectionTest = await greyfinchService.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: connectionTest.message,
        error: 'Connection failed'
      }, { status: 500 })
    }

    // Pull basic counts to verify data access
    const basicCounts = await greyfinchService.pullBasicCounts(userId || 'test-user')
    
    return NextResponse.json({
      success: true,
      message: 'Greyfinch API connection successful',
      connectionTest: connectionTest.data,
      basicCounts: basicCounts.counts
    })
  } catch (error) {
    console.error('Greyfinch test failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Greyfinch API connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
