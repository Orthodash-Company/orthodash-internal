import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsCache, locations, acquisitionCosts } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const parsedLocationId = locationId ? parseInt(locationId) : undefined
    
    // Check cache first
    const cacheKey = `analytics_${parsedLocationId || 'all'}_${startDate}_${endDate}`
    let cachedData;
    if (parsedLocationId !== undefined) {
      cachedData = await db.select().from(analyticsCache).where(
        and(
          eq(analyticsCache.locationId, parsedLocationId),
          eq(analyticsCache.startDate, startDate),
          eq(analyticsCache.endDate, endDate),
          eq(analyticsCache.dataType, 'analytics')
        )
      );
    } else {
      cachedData = await db.select().from(analyticsCache).where(
        and(
          eq(analyticsCache.startDate, startDate),
          eq(analyticsCache.endDate, endDate),
          eq(analyticsCache.dataType, 'analytics')
        )
      );
    }

    if (cachedData.length > 0) {
      const cacheAge = Date.now() - new Date(cachedData[0].createdAt!).getTime()
      const cacheExpiry = 15 * 60 * 1000 // 15 minutes
      
      if (cacheAge < cacheExpiry) {
        return NextResponse.json(JSON.parse(cachedData[0].data))
      }
    }

    // Get location info for Greyfinch API
    let greyfinchLocationId: string | undefined
    if (parsedLocationId) {
      const location = await db.select().from(locations).where(eq(locations.id, parsedLocationId))
      greyfinchLocationId = location[0]?.greyfinchId || undefined
    }

    // Fetch from Greyfinch API
    const analytics = await greyfinchService.getAnalytics(
      greyfinchLocationId,
      startDate,
      endDate
    )

    // Get acquisition costs
    const period = new Date(startDate).toISOString().slice(0, 7) // YYYY-MM format
    let costs;
    if (parsedLocationId !== undefined) {
      costs = await db.select().from(acquisitionCosts).where(
        and(
          eq(acquisitionCosts.locationId, parsedLocationId),
          eq(acquisitionCosts.period, period)
        )
      );
    } else {
      costs = await db.select().from(acquisitionCosts).where(
        eq(acquisitionCosts.period, period)
      );
    }
    
    // Calculate average acquisition cost
    const totalCost = costs.reduce((sum, cost) => sum + (cost.cost || 0), 0)
    analytics.avgAcquisitionCost = costs.length > 0 ? Math.round(totalCost / costs.length) : 0

    // Cache the result
    await db.insert(analyticsCache).values({
      locationId: parsedLocationId || undefined,
      startDate: startDate,
      endDate: endDate,
      dataType: 'analytics',
      data: JSON.stringify(analytics)
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
