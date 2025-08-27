import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret, userId } = await request.json()
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ 
        success: false, 
        message: 'API key and secret are required' 
      }, { status: 400 })
    }
    
    // Test the connection
    const connectionTest = await greyfinchService.testConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to connect to Greyfinch API',
        error: connectionTest.message
      }, { status: 400 })
    }
    
    // Pull basic counts to verify data access
    const basicCounts = await greyfinchService.pullBasicCounts(userId || 'test-user')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Greyfinch connection successful',
      connectionTest: connectionTest.data,
      basicCounts: basicCounts.counts
    })
  } catch (error) {
    console.error('Greyfinch setup failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to connect to Greyfinch API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
