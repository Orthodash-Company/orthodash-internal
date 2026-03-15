import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuthUser } from '@/lib/require-auth-user';

function parseReportPayload(periodConfigs: string | null) {
  if (!periodConfigs) {
    return {
      periodConfigs: [],
      type: 'summary',
      data: null,
      sessionId: null,
      thumbnail: null,
      pdfUrl: null,
    };
  }

  try {
    const parsed = JSON.parse(periodConfigs);
    if (Array.isArray(parsed)) {
      return {
        periodConfigs: parsed,
        type: 'summary',
        data: null,
        sessionId: null,
        thumbnail: null,
        pdfUrl: null,
      };
    }

    return {
      periodConfigs: Array.isArray(parsed.periodConfigs) ? parsed.periodConfigs : [],
      type: typeof parsed.type === 'string' ? parsed.type : 'summary',
      data: parsed.data ?? null,
      sessionId: parsed.sessionId ?? null,
      thumbnail: typeof parsed.thumbnail === 'string' ? parsed.thumbnail : null,
      pdfUrl: typeof parsed.pdfUrl === 'string' ? parsed.pdfUrl : null,
    };
  } catch {
    return {
      periodConfigs: [],
      type: 'summary',
      data: null,
      sessionId: null,
      thumbnail: null,
      pdfUrl: null,
    };
  }
}

function transformReport(report: typeof reports.$inferSelect) {
  const payload = parseReportPayload(report.periodConfigs);

  return {
    ...report,
    type: payload.type,
    data: payload.data,
    sessionId: payload.sessionId,
    periodConfigs: payload.periodConfigs,
    thumbnail: report.thumbnail ?? payload.thumbnail,
    pdfUrl: report.pdfUrl ?? payload.pdfUrl,
  };
}

// GET /api/reports - Get all reports for a user
export async function GET(request: NextRequest) {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser();
    if (!user) {
      return unauthorizedResponse;
    }

    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, user.id))
      .orderBy(reports.createdAt);

    return NextResponse.json({
      success: true,
      reports: userReports.map(transformReport)
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
      description,
      thumbnail,
      pdfUrl,
    } = body;

    const { user, unauthorizedResponse } = await requireAuthUser();
    if (!user) {
      return unauthorizedResponse;
    }

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type required' },
        { status: 400 }
      );
    }

    const serializedPayload = JSON.stringify({
      sessionId: sessionId ?? null,
      type,
      data: data ?? null,
      periodConfigs: data?.periods ?? data?.session?.periods ?? [],
      thumbnail: thumbnail ?? null,
      pdfUrl: pdfUrl ?? null,
    });

    const reportData = {
      userId: user.id,
      name,
      description: description || `${type} report`,
      periodConfigs: serializedPayload,
      pdfUrl: pdfUrl || null,
      thumbnail: thumbnail || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newReport] = await db
      .insert(reports)
      .values(reportData)
      .returning();

    return NextResponse.json({
      success: true,
      report: transformReport(newReport)
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
