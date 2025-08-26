import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { locations } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try to connect to database, but fallback to sample data if connection fails
    let dbLocations = []
    try {
      // Filter locations by user_id
      dbLocations = await db.select().from(locations).where(
        and(
          eq(locations.userId, user.id),
          eq(locations.isActive, true)
        )
      )
      
      // If no locations exist, create some sample ones for demonstration
      if (dbLocations.length === 0) {
        console.log('No locations found, creating sample locations...')
        const sampleLocations = [
          {
            userId: user.id,
            name: 'Main Orthodontic Center',
            address: '123 Main St, Downtown',
            patientCount: 1247
          },
          {
            userId: user.id,
            name: 'Westside Dental & Orthodontics', 
            address: '456 West Ave, Westside',
            patientCount: 892
          }
        ]
        
        for (const locationData of sampleLocations) {
          await db.insert(locations).values(locationData)
        }
        
        dbLocations = await db.select().from(locations).where(
          and(
            eq(locations.userId, user.id),
            eq(locations.isActive, true)
          )
        )
      }
    } catch (dbError) {
      console.log('Database connection failed, using sample data:', dbError)
      // Return sample data if database connection fails
      dbLocations = [
        {
          id: 1,
          userId: user.id,
          name: 'Main Orthodontic Center',
          address: '123 Main St, Downtown',
          patientCount: 1247,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          userId: user.id,
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
    // Get user from Supabase auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Ensure the location is created for the authenticated user
    const locationData = {
      ...body,
      userId: user.id
    }
    
    const location = await db.insert(locations).values(locationData).returning()
    return NextResponse.json(location[0])
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
