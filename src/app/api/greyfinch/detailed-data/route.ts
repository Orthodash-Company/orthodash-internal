import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function POST(request: NextRequest) {
  try {
    const { userId, periodConfigs = [] } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 })
    }
    
    console.log('Pulling detailed data for user:', userId, 'with', periodConfigs.length, 'periods')
    
    // Pull detailed data in the background
    const result = await greyfinchService.pullDetailedData(userId, periodConfigs)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Detailed data pulled successfully',
        data: {
          detailedData: result.data,
          pulledAt: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to pull detailed data',
        error: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Detailed data pull failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to pull detailed data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
