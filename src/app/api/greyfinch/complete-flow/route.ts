import { NextRequest, NextResponse } from 'next/server'
import { greyfinchDataFlowService } from '@/lib/services/greyfinch-data-flow'

export async function POST(request: NextRequest) {
  try {
    const { userId, acquisitionCosts, periods } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 })
    }
    
    console.log('Starting complete data flow for user:', userId)
    
    // Run the complete data flow pipeline
    const result = await greyfinchDataFlowService.runCompleteDataFlow(
      userId, 
      acquisitionCosts || {}, 
      periods || []
    )
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Complete data flow executed successfully',
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Data flow failed',
        error: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Complete data flow failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to execute complete data flow',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
