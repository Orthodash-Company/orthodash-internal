import { NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET() {
  try {
    const locations = await greyfinchService.getLocations()
    return NextResponse.json({ 
      success: true, 
      message: 'Greyfinch API connection successful',
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
