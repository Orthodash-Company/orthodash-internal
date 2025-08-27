import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reports } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }
    
    const userReports = await db.select().from(reports).where(
      eq(reports.userId, userId)
    ).orderBy(reports.createdAt)
    
    return NextResponse.json(userReports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, content } = body
    
    if (!userId || !title) {
      return NextResponse.json({ error: "User ID and title required" }, { status: 400 })
    }
    
    const reportData = {
      userId,
      name: title,
      description: `Generated report: ${title}`,
      periodConfigs: JSON.stringify(content),
      isPublic: false
    }
    
    const result = await db.insert(reports).values(reportData).returning()
    
    return NextResponse.json({ 
      success: true, 
      id: result[0]?.id,
      message: 'Report saved successfully' 
    })
  } catch (error) {
    console.error('Error saving report:', error)
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}
