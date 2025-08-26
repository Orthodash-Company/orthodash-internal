import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 })
    }
    
    // Test basic connection and discover schema
    const result = await greyfinchService.testConnection()
    
    return NextResponse.json({
      success: true,
      testResult: result,
      message: 'Schema discovery test completed'
    })
  } catch (error) {
    console.error('Schema discovery test failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Schema discovery test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
