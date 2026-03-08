import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { locations } from '@/shared/schema'
import { eq } from 'drizzle-orm'
import { requireAuthUser } from '@/lib/require-auth-user'

export async function GET(request: NextRequest) {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser()
    if (!user) {
      return unauthorizedResponse
    }

    const userLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.userId, user.id))

    return NextResponse.json(userLocations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser()
    if (!user) {
      return unauthorizedResponse
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
