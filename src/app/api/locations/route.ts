import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { locations } from '@/shared/schema'
import { eq } from 'drizzle-orm'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET() {
  try {
    // First try to get locations from Greyfinch
    try {
      console.log('Attempting to fetch locations from Greyfinch...')
      const greyfinchLocations = await greyfinchService.getLocations()
      
      if (greyfinchLocations && greyfinchLocations.length > 0) {
        console.log(`Successfully fetched ${greyfinchLocations.length} locations from Greyfinch`)
        
        // Map Greyfinch location format to our format and save to database
        const mappedLocations = greyfinchLocations.map(loc => ({
          id: parseInt(loc.id.replace(/\D/g, '')) || Math.floor(Math.random() * 1000),
          name: loc.name,
          greyfinchId: loc.id,
          address: loc.address,
          patientCount: loc.patientCount,
          lastSyncDate: loc.lastSyncDate
        }))
        
        // Save to database for future use
        for (const location of mappedLocations) {
          const existing = await db.select().from(locations).where(eq(locations.greyfinchId, location.greyfinchId))
          if (existing.length === 0) {
            await db.insert(locations).values(location)
          }
        }
        
        return NextResponse.json(mappedLocations)
      }
    } catch (greyfinchError) {
      console.log('Greyfinch location fetch failed, using database:', greyfinchError instanceof Error ? greyfinchError.message : greyfinchError)
    }
    
    // Fallback to database
    let dbLocations = await db.select().from(locations)
    
    // If no locations exist, create some sample ones for demonstration
    if (dbLocations.length === 0) {
      console.log('No locations found, creating sample locations...')
      const sampleLocations = [
        {
          name: 'Main Orthodontic Center',
          greyfinchId: 'loc_001',
          address: '123 Main St, Downtown',
          patientCount: 1247
        },
        {
          name: 'Westside Dental & Orthodontics', 
          greyfinchId: 'loc_002',
          address: '456 West Ave, Westside',
          patientCount: 892
        }
      ]
      
      for (const locationData of sampleLocations) {
        await db.insert(locations).values(locationData)
      }
      
      dbLocations = await db.select().from(locations)
    }
    
    return NextResponse.json(dbLocations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const location = await db.insert(locations).values(body).returning()
    return NextResponse.json(location[0])
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
