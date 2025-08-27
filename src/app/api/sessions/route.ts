import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }
    
    const sessions = await db.execute(sql`
      SELECT * FROM session_history 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json(sessions)
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
      user_id: userId,
      session_data: JSON.stringify({
        name,
        description,
        greyfinchData,
        acquisitionCosts,
        periods,
        aiSummary,
        reportData,
        createdAt: new Date().toISOString()
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const result = await db.execute(sql`
      INSERT INTO session_history (user_id, session_data, created_at, updated_at)
      VALUES (${sessionData.user_id}, ${sessionData.session_data}, ${sessionData.created_at}, ${sessionData.updated_at})
      RETURNING id
    `)
    
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
