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
    
    const reports = await db.execute(sql`
      SELECT * FROM reports 
      WHERE user_id = ${userId} 
      ORDER BY generated_at DESC
    `)
    
    return NextResponse.json(reports)
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
      user_id: userId,
      title,
      content: JSON.stringify(content),
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    const result = await db.execute(sql`
      INSERT INTO reports (user_id, title, content, generated_at, created_at)
      VALUES (${reportData.user_id}, ${reportData.title}, ${reportData.content}, ${reportData.generated_at}, ${reportData.created_at})
      RETURNING id
    `)
    
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
