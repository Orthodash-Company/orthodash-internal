import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sessions } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthUser } from '@/lib/require-auth-user'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, unauthorizedResponse } = await requireAuthUser()
    if (!user) return unauthorizedResponse

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, parseInt(id)), eq(sessions.userId, user.id)))
      .limit(1)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, unauthorizedResponse } = await requireAuthUser()
    if (!user) return unauthorizedResponse

    await db
      .update(sessions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(sessions.id, parseInt(id)), eq(sessions.userId, user.id)))

    return NextResponse.json({ success: true, message: 'Session deleted' })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
