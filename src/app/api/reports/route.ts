import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reports } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const userReports = await db.select().from(reports).where(
      eq(reports.userId, userId)
    ).orderBy(reports.createdAt);

    return NextResponse.json(userReports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, content, metadata } = body

    if (!userId || !name || !content) {
      return NextResponse.json({ 
        error: "userId, name, and content are required" 
      }, { status: 400 })
    }

    const report = await db.insert(reports).values({
      userId,
      name,
      periodConfigs: JSON.stringify(content),
      description: metadata?.description || null
    }).returning();

    return NextResponse.json({
      success: true,
      data: report[0],
      message: "Report created successfully"
    })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
  }
}
