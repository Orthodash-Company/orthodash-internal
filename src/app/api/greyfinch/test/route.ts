import { NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET() {
  try {
    // Test locations endpoint first (simpler than analytics)
    const locations = await greyfinchService.getLocations()
    
    // If we get data (either from API or fallback), report success
    if (locations && locations.length > 0) {
      // Check if this is live data based on location ID patterns and isLiveData flag
      const hasLiveData = locations.some(loc => 
        loc.isLiveData || 
        (loc.id && (loc.id.startsWith('live-') || (!loc.id.startsWith('loc_') && !loc.id.includes('demo'))))
      )
      
      return NextResponse.json({ 
        status: "connected", 
        dataSource: hasLiveData ? "Live Greyfinch API" : "Development Data (Live API Unavailable)",
        message: hasLiveData ? "Successfully connected to Greyfinch API with live data" : "Using development data - configure API credentials for live data",
        locationCount: locations.length,
        apiCredentialsConfigured: !!(process.env.GREYFINCH_API_KEY && process.env.GREYFINCH_API_SECRET),
        isLiveData: hasLiveData
      })
    } else {
      throw new Error('No location data available')
    }
  } catch (error) {
    console.error('Greyfinch API test failed:', error)
    return NextResponse.json({ 
      status: "error", 
      message: error instanceof Error ? error.message : "Connection failed - configure API credentials" 
    }, { status: 500 })
  }
}
