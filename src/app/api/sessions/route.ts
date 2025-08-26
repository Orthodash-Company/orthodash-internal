import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sessions } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    console.log('Sessions API called');
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    console.log('Fetching sessions for userId:', userId);

    const userSessions = await db.select().from(sessions).where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.isActive, true)
      )
    ).orderBy(sessions.createdAt);

    return NextResponse.json(userSessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ 
      error: "Failed to fetch sessions", 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, greyfinchData, acquisitionCosts, periods, aiSummary, metadata } = body

    if (!userId || !name) {
      return NextResponse.json({ 
        error: "userId and name are required" 
      }, { status: 400 })
    }

    const session = await db.insert(sessions).values({
      userId,
      name,
      description: description || null,
      greyfinchData: greyfinchData || null,
      acquisitionCosts: acquisitionCosts || null,
      periods: periods || null,
      aiSummary: aiSummary || null,
      metadata: metadata || null,
      isActive: true
    }).returning();

    return NextResponse.json({
      success: true,
      data: session[0],
      message: "Session saved successfully"
    })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ 
      error: "Failed to create session", 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
