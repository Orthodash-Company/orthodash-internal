import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret } = await request.json()
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ 
        success: false, 
        message: 'API key and secret are required' 
      }, { status: 400 })
    }
    
    greyfinchService.updateCredentials(apiKey, apiSecret)
    
    // Test the connection
    const locations = await greyfinchService.getLocations()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Greyfinch credentials updated successfully',
      locations 
    })
  } catch (error) {
    console.error('Greyfinch setup failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update Greyfinch credentials',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
