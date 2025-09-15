import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { locations } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { greyfinchService } from '@/lib/services/greyfinch'
import { GreyfinchDataService } from '@/lib/services/greyfinch-data'

export async function GET(request: NextRequest) {
  try {
    // Return sample locations data without database connection
    const sampleLocations = [
      {
        id: 1,
        userId: 'default-user-id',
        name: 'Gilbert Office',
        address: '123 Gilbert Rd, Gilbert, AZ',
        patientCount: 1247,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        userId: 'default-user-id',
        name: 'Phoenix-Ahwatukee Office',
        address: '123 Ahwatukee Blvd, Phoenix-Ahwatukee, AZ',
        patientCount: 850,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    return NextResponse.json(sampleLocations)
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
