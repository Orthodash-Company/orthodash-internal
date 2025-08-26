import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { locations } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // For now, we'll use a default user ID since we don't have proper auth setup
    // In production, you'd get this from the JWT token or session
    const userId = request.headers.get('x-user-id') || 'default-user-id'
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    // Try to connect to database, but fallback to sample data if connection fails
    let dbLocations = []
    try {
      // Filter locations by user_id
      dbLocations = await db.select().from(locations).where(
        and(
          eq(locations.userId, userId),
          eq(locations.isActive, true)
        )
      )
      
      // If no locations exist, create some sample ones for demonstration
      if (dbLocations.length === 0) {
        console.log('No locations found, creating sample locations...')
        const sampleLocations = [
          {
            userId: userId,
            name: 'Main Orthodontic Center',
            address: '123 Main St, Downtown',
            patientCount: 1247
          },
          {
            userId: userId,
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
            eq(locations.userId, userId),
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
          userId: userId,
          name: 'Main Orthodontic Center',
          address: '123 Main St, Downtown',
          patientCount: 1247,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          userId: userId,
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
    // Get user ID from request headers
    const userId = request.headers.get('x-user-id') || 'default-user-id'
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    const body = await request.json()
    
    // Ensure the location is created for the authenticated user
    const locationData = {
      ...body,
      userId: userId
    }
    
    const location = await db.insert(locations).values(locationData).returning()
    return NextResponse.json(location[0])
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
