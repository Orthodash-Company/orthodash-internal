import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET() {
  try {
    // Test the connection first
    const connectionTest = await greyfinchService.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: connectionTest.message,
        error: 'Connection failed'
      }, { status: 500 })
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

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: 'API Key and Secret are required'
      }, { status: 400 })
    }

    // Test the connection with provided credentials
    const connectionTest = await greyfinchService.testConnection({
      apiKey,
      apiUrl: 'https://api.greyfinch.com/graphql' // Default URL
    });
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: connectionTest.message,
        error: 'Connection failed'
      }, { status: 500 })
    }

    // Pull basic counts to verify data access
    const basicCounts = await greyfinchService.pullBasicCounts(userId || 'test-user', {
      apiKey,
      apiUrl: 'https://api.greyfinch.com/graphql' // Default URL
    })
    
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
