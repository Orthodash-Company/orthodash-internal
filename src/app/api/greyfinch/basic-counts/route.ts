import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function POST(request: NextRequest) {
  try {
    const { userId, apiKey } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 })
    }
    
    // Update credentials if provided
    if (apiKey) {
      greyfinchService.updateCredentials(apiKey)
    }
    
    console.log('Pulling basic counts for user:', userId)
    
    // Pull basic counts only
    const result = await greyfinchService.pullBasicCounts(userId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Basic counts pulled successfully',
        data: {
          counts: result.counts,
          pulledAt: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to pull basic counts',
        error: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Basic counts pull failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to pull basic counts',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
