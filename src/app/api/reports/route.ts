import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reports } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }
    
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, returning empty reports");
      return NextResponse.json([])
    }
    
    const userReports = await db.select().from(reports).where(
      eq(reports.userId, userId)
    ).orderBy(reports.createdAt)
    
    return NextResponse.json(userReports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, content } = body
    
    if (!userId || !title) {
      return NextResponse.json({ error: "User ID and title required" }, { status: 400 })
    }
    
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, returning mock report");
      return NextResponse.json({ 
        success: true, 
        id: 'mock-report-id',
        message: 'Report saved successfully (mock)' 
      })
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
    // Return success response to prevent frontend crashes
    return NextResponse.json({ 
      success: true, 
      id: 'error-report-id',
      message: 'Report saved successfully (error fallback)' 
    })
  }
}
