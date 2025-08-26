import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reports } from '@/shared/schema'
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

    const report = await db.select().from(reports).where(
      and(
        eq(reports.id, parseInt(params.id)),
        eq(reports.userId, userId),
        eq(reports.isActive, true)
      )
    ).limit(1);

    if (report.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report[0])
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
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
    await db.update(reports)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(reports.id, parseInt(params.id)),
          eq(reports.userId, userId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
  }
}
