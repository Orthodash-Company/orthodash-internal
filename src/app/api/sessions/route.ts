import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sessions } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }
    
    const userSessions = await db.select().from(sessions).where(
      eq(sessions.userId, userId)
    ).orderBy(sessions.createdAt)
    
    return NextResponse.json(userSessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, greyfinchData, acquisitionCosts, periods, aiSummary, reportData } = body
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
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
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 })
  }
}
