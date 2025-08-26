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
    
    const result = await greyfinchService.pullAllData(userId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Greyfinch pull all data failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to pull data from Greyfinch',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
