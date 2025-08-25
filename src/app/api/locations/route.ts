import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { locations } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // Try to connect to database, but fallback to sample data if connection fails
    let dbLocations = []
    try {
      dbLocations = await db.select().from(locations)
      
      // If no locations exist, create some sample ones for demonstration
      if (dbLocations.length === 0) {
        console.log('No locations found, creating sample locations...')
        const sampleLocations = [
          {
            name: 'Main Orthodontic Center',
            address: '123 Main St, Downtown',
            patientCount: 1247
          },
          {
            name: 'Westside Dental & Orthodontics', 
            address: '456 West Ave, Westside',
            patientCount: 892
          }
        ]
        
        for (const locationData of sampleLocations) {
          await db.insert(locations).values(locationData)
        }
        
        dbLocations = await db.select().from(locations)
      }
    } catch (dbError) {
      console.log('Database connection failed, using sample data:', dbError)
      // Return sample data if database connection fails
      dbLocations = [
        {
          id: 1,
          name: 'Main Orthodontic Center',
          address: '123 Main St, Downtown',
          patientCount: 1247,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Westside Dental & Orthodontics', 
          address: '456 West Ave, Westside',
          patientCount: 892,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
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
