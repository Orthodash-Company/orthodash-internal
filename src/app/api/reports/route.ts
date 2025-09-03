import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports } from '@/shared/schema';
import { eq } from 'drizzle-orm';

// GET /api/reports - Get all reports for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(reports.createdAt);

    return NextResponse.json({
      success: true,
      reports: userReports
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      name,
      type,
      data,
      userId
    } = body;

    if (!userId || !sessionId || !name || !type) {
      return NextResponse.json(
        { error: 'User ID, session ID, name, and type required' },
        { status: 400 }
      );
    }

    const reportData = {
      userId,
      sessionId,
      name,
      type,
      data: data || {},
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newReport] = await db
      .insert(reports)
      .values(reportData)
      .returning();

    return NextResponse.json({
      success: true,
      report: newReport
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
