import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { acquisitionCosts, apiConfigurations, adSpend, vendors, revenue } from '@/shared/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const period = searchParams.get('period')
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // If no period is provided, return empty data instead of error
    if (!period) {
      return NextResponse.json({
        manual: [],
        api: [],
        totals: {
          manual: 0,
          meta: 0,
          google: 0,
          total: 0
        }
      })
    }

    const parsedLocationId = locationId ? parseInt(locationId) : null
    
    // Get manual acquisition costs
    let manualCosts;
    if (parsedLocationId !== null) {
      manualCosts = await db.select().from(acquisitionCosts).where(
        and(
          eq(acquisitionCosts.locationId, parsedLocationId),
          eq(acquisitionCosts.period, period),
          eq(acquisitionCosts.userId, userId),
          eq(acquisitionCosts.isDeleted, false)
        )
      );
    } else {
      manualCosts = await db.select().from(acquisitionCosts).where(
        and(
          eq(acquisitionCosts.period, period),
          eq(acquisitionCosts.userId, userId),
          eq(acquisitionCosts.isDeleted, false)
        )
      );
    }

    // Get API-integrated costs
    let apiCosts = [];
    if (parsedLocationId !== null) {
      apiCosts = await db.select().from(adSpend).where(
        and(
          eq(adSpend.locationId, parsedLocationId),
          eq(adSpend.period, period),
          eq(adSpend.userId, userId)
        )
      );
    } else {
      apiCosts = await db.select().from(adSpend).where(
        and(
          eq(adSpend.period, period),
          eq(adSpend.userId, userId)
        )
      );
    }

    // Calculate totals
    const manualTotal = manualCosts.reduce((sum: number, cost: any) => sum + cost.cost, 0);
    const metaTotal = apiCosts
      .filter((cost: any) => cost.platform === 'meta')
      .reduce((sum: number, cost: any) => sum + cost.spend, 0);
    const googleTotal = apiCosts
      .filter((cost: any) => cost.platform === 'google')
      .reduce((sum: number, cost: any) => sum + cost.spend, 0);

    return NextResponse.json({
      manual: manualCosts,
      api: apiCosts,
      totals: {
        manual: manualTotal,
        meta: metaTotal,
        google: googleTotal,
        total: manualTotal + metaTotal + googleTotal
      }
    })
  } catch (error) {
    console.error('Error fetching acquisition costs:', error)
    return NextResponse.json({ 
      error: "Failed to fetch acquisition costs", 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locationId, period, costs, userId, type = 'manual' } = body

    if (!userId || !period) {
      return NextResponse.json({ error: "userId and period are required" }, { status: 400 })
    }

    if (type === 'manual') {
      // Handle manual cost entry
      const costEntries = Array.isArray(costs) ? costs : [costs];
      
      const insertData = costEntries.map(cost => ({
        locationId: locationId || null,
        userId,
        referralType: cost.referralType || 'manual',
        cost: parseFloat(cost.cost) || 0,
        period,
        description: cost.description || '',
        source: 'manual',
        metadata: cost.metadata || null
      }));

      const result = await db.insert(acquisitionCosts).values(insertData).returning();
      
      return NextResponse.json({
        success: true,
        data: result,
        message: "Manual costs saved successfully"
      })
    } else if (type === 'api') {
      // Handle API-synced costs
      const result = await db.insert(adSpend).values(costs).returning();
      
      return NextResponse.json({
        success: true,
        data: result,
        message: "API costs synced successfully"
      })
    }

    return NextResponse.json({ error: "Invalid type specified" }, { status: 400 })
  } catch (error) {
    console.error('Error saving acquisition cost:', error)
    return NextResponse.json({ error: "Failed to save acquisition cost" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, cost, description, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    const result = await db.update(acquisitionCosts)
      .set({
        cost: parseFloat(cost) || 0,
        description: description || '',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(acquisitionCosts.id, id),
          eq(acquisitionCosts.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: result[0],
      message: "Cost updated successfully"
    })
  } catch (error) {
    console.error('Error updating acquisition cost:', error)
    return NextResponse.json({ error: "Failed to update acquisition cost" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    // Soft delete by setting isDeleted to true
    const result = await db.update(acquisitionCosts)
      .set({
        isDeleted: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(acquisitionCosts.id, parseInt(id)),
          eq(acquisitionCosts.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      message: "Cost deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting acquisition cost:', error)
    return NextResponse.json({ error: "Failed to delete acquisition cost" }, { status: 500 })
  }
}
