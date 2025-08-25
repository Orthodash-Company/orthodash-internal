import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { acquisitionCosts } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const period = searchParams.get('period')
    
    if (!period) {
      return NextResponse.json({ error: "Period is required" }, { status: 400 })
    }

    const parsedLocationId = locationId ? parseInt(locationId) : null
    const costs = await db.select().from(acquisitionCosts).where(
      and(
        eq(acquisitionCosts.locationId, parsedLocationId),
        eq(acquisitionCosts.period, period)
      )
    )
    
    return NextResponse.json(costs)
  } catch (error) {
    console.error('Error fetching acquisition costs:', error)
    return NextResponse.json({ error: "Failed to fetch acquisition costs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cost = await db.insert(acquisitionCosts).values(body).returning()
    return NextResponse.json(cost[0])
  } catch (error) {
    console.error('Error updating acquisition cost:', error)
    return NextResponse.json({ error: "Failed to update acquisition cost" }, { status: 500 })
  }
}
