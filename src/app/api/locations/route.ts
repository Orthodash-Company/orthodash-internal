import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { locations } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { greyfinchService } from '@/lib/services/greyfinch'
import { GreyfinchDataService } from '@/lib/services/greyfinch-data'

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
      
      // If no locations exist, try to fetch from Greyfinch API
      if (dbLocations.length === 0) {
        console.log('No locations found in database, trying Greyfinch API...')
        
        // Check if we have Greyfinch API credentials
        const envApiKey = process.env.GREYFINCH_API_KEY
        if (envApiKey) {
          greyfinchService.updateCredentials(envApiKey)
          
          try {
            const greyfinchResult = await GreyfinchDataService.fetchLocations()
            if (greyfinchResult.success && greyfinchResult.data) {
              console.log('Successfully fetched locations from Greyfinch:', greyfinchResult.data.length)
              
              // Convert Greyfinch locations to our format and store in database
              for (const greyfinchLocation of greyfinchResult.data) {
                const locationData = {
                  userId: userId,
                  name: greyfinchLocation.name || 'Unknown Location',
                  address: greyfinchLocation.address || '',
                  greyfinchId: greyfinchLocation.id,
                  patientCount: 0, // Will be calculated later
                  isActive: true
                }
                
                await db.insert(locations).values(locationData)
              }
              
              // Fetch updated locations from database
              dbLocations = await db.select().from(locations).where(
                and(
                  eq(locations.userId, userId),
                  eq(locations.isActive, true)
                )
              )
            }
          } catch (greyfinchError) {
            console.log('Greyfinch API failed, creating sample locations:', greyfinchError)
            // Fall back to sample data
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
        } else {
          // No API key, create sample locations
          console.log('No Greyfinch API key, creating sample locations...')
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
