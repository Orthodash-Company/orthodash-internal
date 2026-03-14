import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuthUser } from '@/lib/require-auth-user';

// GET /api/sessions - Get all sessions for a user
export async function GET(request: NextRequest) {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser();
    if (!user) {
      return unauthorizedResponse;
    }

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .orderBy(sessions.createdAt);

    return NextResponse.json({
      success: true,
      sessions: userSessions
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      periods,
      locations,
      greyfinchData,
      includeCharts,
      includeAIInsights,
      includeRecommendations
    } = body;

    const { user, unauthorizedResponse } = await requireAuthUser();
    if (!user) {
      return unauthorizedResponse;
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Session name required' },
        { status: 400 }
      );
    }

    const sessionData = {
      userId: user.id,
      name,
      description: description || '',
      greyfinchData: greyfinchData || {},
      periods: periods || [],
      acquisitionCosts: [],
      aiSummary: null,
      metadata: {
        includeCharts,
        includeAIInsights,
        includeRecommendations,
        locations: locations || []
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newSession] = await db
      .insert(sessions)
      .values(sessionData)
      .returning();

    return NextResponse.json({
      success: true,
      session: newSession
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions - Update an existing session
export async function PUT(request: NextRequest) {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser();
    if (!user) {
      return unauthorizedResponse;
    }

    const body = await request.json();
    const { sessionId, periods, locations, greyfinchData, updatedAt } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Verify the session belongs to the authenticated user before updating
    const [existing] = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = {
      periods: periods || [],
      locations: locations || [],
      greyfinchData: greyfinchData || {},
      updatedAt: updatedAt || new Date()
    };

    const [updatedSession] = await db
      .update(sessions)
      .set(updateData)
      .where(eq(sessions.id, sessionId))
      .returning();

    return NextResponse.json({
      success: true,
      session: updatedSession
    });

  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
