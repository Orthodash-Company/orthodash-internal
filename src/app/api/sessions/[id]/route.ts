import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sessions } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthUser } from '@/lib/require-auth-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, unauthorizedResponse } = await requireAuthUser()
    if (!user) {
      return unauthorizedResponse
    }

    const session = await db.select().from(sessions).where(
      and(
        eq(sessions.id, parseInt(id)),
        eq(sessions.userId, user.id),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, greyfinchData, acquisitionCosts, periods, aiSummary, metadata } = body
    const { user, unauthorizedResponse } = await requireAuthUser()

    if (!user) {
      return unauthorizedResponse
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
          eq(sessions.id, parseInt(id)),
          eq(sessions.userId, user.id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, unauthorizedResponse } = await requireAuthUser()
    if (!user) {
      return unauthorizedResponse
    }

    // Soft delete by setting isActive to false
    await db.update(sessions)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(sessions.id, parseInt(id)),
          eq(sessions.userId, user.id)
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
