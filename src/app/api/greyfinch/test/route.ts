import { NextResponse } from 'next/server'
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

    // Get locations (which will now work with the actual API)
    const locations = await greyfinchService.getLocations()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Greyfinch API connection successful',
      connectionTest: connectionTest.availableData,
      locations 
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
