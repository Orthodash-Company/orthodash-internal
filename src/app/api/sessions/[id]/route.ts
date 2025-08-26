import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sessions } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const session = await db.select().from(sessions).where(
      and(
        eq(sessions.id, parseInt(params.id)),
        eq(sessions.userId, userId),
        eq(sessions.isActive, true)
      )
    ).limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(session[0])
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId, name, description, greyfinchData, acquisitionCosts, periods, aiSummary, metadata } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (greyfinchData !== undefined) updateData.greyfinchData = greyfinchData;
    if (acquisitionCosts !== undefined) updateData.acquisitionCosts = acquisitionCosts;
    if (periods !== undefined) updateData.periods = periods;
    if (aiSummary !== undefined) updateData.aiSummary = aiSummary;
    if (metadata !== undefined) updateData.metadata = metadata;

    const session = await db.update(sessions)
      .set(updateData)
      .where(
        and(
          eq(sessions.id, parseInt(params.id)),
          eq(sessions.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: session[0],
      message: "Session updated successfully"
    })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Soft delete by setting isActive to false
    await db.update(sessions)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(sessions.id, parseInt(params.id)),
          eq(sessions.userId, userId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
