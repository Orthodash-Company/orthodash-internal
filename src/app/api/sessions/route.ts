import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuthUser } from '@/lib/require-auth-user';

// GET /api/sessions - Get all active sessions for the authenticated user
export async function GET() {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser();
    if (!user) return unauthorizedResponse;

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .orderBy(sessions.createdAt);

    return NextResponse.json({ success: true, sessions: userSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/sessions - Save a new session (period filters only — no raw data)
export async function POST(request: NextRequest) {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser();
    if (!user) return unauthorizedResponse;

    const body = await request.json();
    const { name, periods } = body;

    if (!name) {
      return NextResponse.json({ error: 'Session name required' }, { status: 400 });
    }

    const [newSession] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        name,
        periods: periods ?? [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
