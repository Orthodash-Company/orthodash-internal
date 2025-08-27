import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('Greyfinch test endpoint called')
    
    // Get API key from query parameters or headers
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('apiKey') || request.headers.get('x-api-key')
    
    console.log('API key from request:', apiKey ? 'provided' : 'not provided')
    console.log('Environment API key available:', !!process.env.GREYFINCH_API_KEY)
    
    // If API key is provided, update the service credentials
    if (apiKey) {
      greyfinchService.updateCredentials(apiKey)
      console.log('Updated service with provided API key')
    } else {
      // Auto-load from environment variables
      const envApiKey = process.env.GREYFINCH_API_KEY
      if (envApiKey) {
        greyfinchService.updateCredentials(envApiKey)
        console.log('Updated service with environment API key')
      } else {
        console.log('No API key available from request or environment')
      }
    }
    
    // Test the connection (will auto-retrieve credentials if userId is provided)
    const connectionTest = await greyfinchService.testConnection('test-user');
    
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

    // Test the connection (will auto-retrieve credentials if userId is provided)
    const connectionTest = await greyfinchService.testConnection(userId || 'test-user');
    
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
