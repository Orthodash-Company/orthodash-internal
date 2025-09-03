import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reports } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
        eq(reports.userId, userId)
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

    // Get the report data
    const report = await db.select().from(reports).where(
      and(
        eq(reports.id, parseInt(params.id)),
        eq(reports.userId, userId)
      )
    ).limit(1);

    if (report.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const reportData = report[0];
    
    // Generate PDF from report data
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(29, 29, 82); // #1d1d52
    doc.text('Orthodash Practice Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    
    // Report Title
    doc.setFontSize(16);
    doc.setTextColor(29, 29, 82);
    doc.text(reportData.name || 'Practice Report', 20, yPosition);
    
    yPosition += 15;
    
    // Report Data
    if (reportData.data) {
      const data = reportData.data;
      
      // Counter Data Section
      if (data.counterData) {
        doc.setFontSize(14);
        doc.setTextColor(29, 29, 82);
        doc.text('Practice Overview', 20, yPosition);
        
        yPosition += 10;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        
        const counterTableData = [
          ['Metric', 'Count'],
          ['Total Patients', (data.counterData.patients || 0).toString()],
          ['Total Appointments', (data.counterData.appointments || 0).toString()],
          ['Total Leads', (data.counterData.leads || 0).toString()],
          ['Total Bookings', (data.counterData.bookings || 0).toString()],
          ['Active Locations', (data.counterData.locations || 0).toString()]
        ];
        
        autoTable(doc, {
          head: [counterTableData[0]],
          body: counterTableData.slice(1),
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [29, 29, 82] },
          styles: { fontSize: 10 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Periods Section
      if (data.periods && data.periods.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(29, 29, 82);
        doc.text('Analysis Periods', 20, yPosition);
        
        yPosition += 10;
        
        data.periods.forEach((period: any, index: number) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }
          
          const periodTitle = period.title || `Period ${String.fromCharCode(65 + index)}`;
          
          doc.setFontSize(12);
          doc.setTextColor(29, 29, 82);
          doc.text(periodTitle, 20, yPosition);
          
          yPosition += 8;
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          
          if (period.startDate && period.endDate) {
            const startDate = new Date(period.startDate).toLocaleDateString();
            const endDate = new Date(period.endDate).toLocaleDateString();
            doc.text(`Date Range: ${startDate} - ${endDate}`, 25, yPosition);
            yPosition += 6;
          }
          
          yPosition += 5;
        });
      }
      
      // AI Summary Section
      if (data.aiSummary) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(29, 29, 82);
        doc.text('AI Analysis Summary', 20, yPosition);
        
        yPosition += 10;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        
        // Summary text
        if (data.aiSummary.summary) {
          const summaryLines = doc.splitTextToSize(data.aiSummary.summary, pageWidth - 40);
          doc.text(summaryLines, 20, yPosition);
          yPosition += (summaryLines.length * 6) + 10;
        }
        
        // Key insights
        if (data.aiSummary.insights && data.aiSummary.insights.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(29, 29, 82);
          doc.text('Key Insights:', 20, yPosition);
          yPosition += 8;
          
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          
          data.aiSummary.insights.forEach((insight: string) => {
            const insightLines = doc.splitTextToSize(`• ${insight}`, pageWidth - 40);
            doc.text(insightLines, 25, yPosition);
            yPosition += (insightLines.length * 6) + 2;
          });
          
          yPosition += 5;
        }
      }
    }
    
    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Orthodash Practice Analytics', 20, pageHeight - 10);
    }
    
    // Convert to buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orthodash-report-${params.id}.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
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

    // Hard delete the report
    await db.delete(reports)
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
