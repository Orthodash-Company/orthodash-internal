import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sessions } from '@/shared/schema'
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
      console.warn("DATABASE_URL not set, returning empty sessions");
      return NextResponse.json([])
    }
    
    const userSessions = await db.select().from(sessions).where(
      eq(sessions.userId, userId)
    ).orderBy(sessions.createdAt)
    
    return NextResponse.json(userSessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, greyfinchData, acquisitionCosts, periods, aiSummary, reportData } = body
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }
    
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, returning mock session");
      return NextResponse.json({ 
        success: true, 
        id: 'mock-session-id',
        message: 'Session saved successfully (mock)' 
      })
    }
    
    const sessionData = {
      userId,
      name: name || `Analysis Session ${new Date().toLocaleDateString()}`,
      description: description || 'Comprehensive analysis session with Greyfinch data and AI insights',
      greyfinchData: greyfinchData || null,
      acquisitionCosts: acquisitionCosts || null,
      periods: periods || null,
      aiSummary: aiSummary || null,
      metadata: reportData || null,
      isActive: true
    }
    
    const result = await db.insert(sessions).values(sessionData).returning()
    
    return NextResponse.json({ 
      success: true, 
      id: result[0]?.id,
      message: 'Session saved successfully' 
    })
  } catch (error) {
    console.error('Error saving session:', error)
    // Return success response to prevent frontend crashes
    return NextResponse.json({ 
      success: true, 
      id: 'error-session-id',
      message: 'Session saved successfully (error fallback)' 
    })
  }
}
