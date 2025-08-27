import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsCache, locations, acquisitionCosts } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const locationId = request.nextUrl.searchParams.get('locationId')
    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const parsedLocationId = locationId ? parseInt(locationId) : undefined
    
    // Check cache first (only if database is available)
    let cachedData = [];
    try {
      const cacheKey = `analytics_${parsedLocationId || 'all'}_${startDate}_${endDate}`
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
    } catch (dbError) {
      console.log('Database cache check failed, proceeding without cache:', dbError)
    }

    // Generate sample analytics data
    const analytics = {
      avgNetProduction: 52000,
      avgAcquisitionCost: 245,
      noShowRate: 12,
      referralSources: { digital: 45, professional: 35, direct: 20 },
      conversionRates: { digital: 78, professional: 85, direct: 65 },
      trends: { weekly: [
        { week: "Week 1", digital: 42, professional: 38, direct: 20 },
        { week: "Week 2", digital: 45, professional: 35, direct: 20 },
        { week: "Week 3", digital: 48, professional: 32, direct: 20 },
        { week: "Week 4", digital: 46, professional: 34, direct: 20 },
        { week: "Week 5", digital: 44, professional: 36, direct: 20 },
        { week: "Week 6", digital: 47, professional: 33, direct: 20 },
        { week: "Week 7", digital: 49, professional: 31, direct: 20 },
        { week: "Week 8", digital: 45, professional: 35, direct: 20 }
      ] }
    };

    // Get acquisition costs (only if database is available)
    let costs = [];
    try {
      const period = new Date(startDate).toISOString().slice(0, 7) // YYYY-MM format
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
      const totalCost = costs.reduce((sum: number, cost: any) => sum + (cost.cost || 0), 0)
      analytics.avgAcquisitionCost = costs.length > 0 ? Math.round(totalCost / costs.length) : 0

      // Cache the result (only if database is available)
      await db.insert(analyticsCache).values({
        locationId: parsedLocationId || undefined,
        startDate: startDate,
        endDate: endDate,
        dataType: 'analytics',
        data: JSON.stringify(analytics)
      })
    } catch (dbError) {
      console.log('Database operations failed, using default acquisition cost:', dbError)
      analytics.avgAcquisitionCost = 245 // Default value
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
