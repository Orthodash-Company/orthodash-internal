import { NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Testing simplified Greyfinch service...')
    
    // Test the connection
    const connectionTest = await greyfinchService.testConnection()
    console.log('Connection test result:', connectionTest)
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection test failed',
        error: connectionTest.message,
        connectionTest
      })
    }
    
    // Test basic counts
    const basicCounts = await greyfinchService.pullBasicCounts('test-user')
    console.log('Basic counts result:', basicCounts)
    
    return NextResponse.json({
      success: true,
      message: 'Simplified Greyfinch service test completed',
      connectionTest,
      basicCounts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.stack : 'No stack trace'
    })
  }
}
