import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reports } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
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

    // For now, return a simple PDF response
    // In a real implementation, you would generate a PDF using a library like puppeteer
    const pdfContent = `PDF Report: ${report[0].name}\n\n${report[0].content}`;
    
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orthodash-report-${params.id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
