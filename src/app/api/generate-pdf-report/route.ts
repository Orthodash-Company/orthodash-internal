import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { db } from '@/lib/db';
import { locations } from '@/shared/schema';
import { inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reportName,
      selectedPeriods,
      selectedLocations,
      includeCharts,
      includeAIInsights,
      includeRecommendations,
      greyfinchData,
      userId,
      periodData // Pass period data from frontend
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Use period data passed from frontend instead of querying database
    const periods = periodData || [];

    // Fetch location data if locations are selected
    const locationData = selectedLocations.length > 0 
      ? await db.select().from(locations).where(inArray(locations.id, selectedLocations))
      : [];

    // Generate AI insights if requested
    let aiInsights = null;
    let recommendations = null;
    
    if (includeAIInsights || includeRecommendations) {
      try {
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periods: periods,
            locations: locationData,
            greyfinchData,
            includeRecommendations
          })
        });
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = aiData.summary;
          recommendations = aiData.recommendations;
        }
      } catch (error) {
        console.error('AI insights generation failed:', error);
      }
    }

    // Generate HTML content for PDF
    const htmlContent = generatePDFHTML({
      reportName,
      periodData: periods,
      locationData,
      greyfinchData,
      aiInsights,
      recommendations,
      includeCharts,
      includeAIInsights,
      includeRecommendations
    });

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF generation failed:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF report' 
    }, { status: 500 });
  }
}

function generatePDFHTML({
  reportName,
  periodData,
  locationData,
  greyfinchData,
  aiInsights,
  recommendations,
  includeCharts,
  includeAIInsights,
  includeRecommendations
}: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1C1F4F;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1C1F4F;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 10px 0 0 0;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #1C1F4F;
          border-bottom: 2px solid #1C1F4F;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .metric-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #1C1F4F;
          margin-bottom: 5px;
        }
        .metric-label {
          color: #666;
          font-size: 14px;
        }
        .period-summary {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .period-title {
          font-size: 18px;
          font-weight: bold;
          color: #1C1F4F;
          margin-bottom: 15px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .data-table th,
        .data-table td {
          border: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
        }
        .data-table th {
          background: #1C1F4F;
          color: white;
          font-weight: bold;
        }
        .data-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        .insights-box {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 20px;
          margin: 20px 0;
        }
        .recommendations-box {
          background: #f3e5f5;
          border-left: 4px solid #9c27b0;
          padding: 20px;
          margin: 20px 0;
        }
        .page-break {
          page-break-before: always;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportName}</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Orthodash Analytics Report</p>
      </div>

      <div class="section">
        <h2>Executive Summary</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${periodData.length}</div>
            <div class="metric-label">Analysis Periods</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${locationData.length}</div>
            <div class="metric-label">Practice Locations</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${greyfinchData?.patients || 0}</div>
            <div class="metric-label">Total Patients</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${greyfinchData?.appointments || 0}</div>
            <div class="metric-label">Total Appointments</div>
          </div>
        </div>
      </div>

      ${greyfinchData && Object.keys(greyfinchData).length > 0 ? `
        <div class="section">
          <h2>Greyfinch Data Integration</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${greyfinchData.patients || 0}</div>
              <div class="metric-label">Patients</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${greyfinchData.locations || 0}</div>
              <div class="metric-label">Locations</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${greyfinchData.appointments || 0}</div>
              <div class="metric-label">Appointments</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${greyfinchData.leads || 0}</div>
              <div class="metric-label">Leads</div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="section">
        <h2>Period Analysis</h2>
        ${periodData.map((period: any, index: number) => `
          <div class="period-summary">
            <div class="period-title">${period.title || `Period ${index + 1}`}</div>
            <p><strong>Date Range:</strong> ${period.startDate ? new Date(period.startDate).toLocaleDateString() : 'N/A'} - ${period.endDate ? new Date(period.endDate).toLocaleDateString() : 'N/A'}</p>
            ${period.description ? `<p><strong>Description:</strong> ${period.description}</p>` : ''}
            ${period.data ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(period.data).map(([key, value]) => `
                    <tr>
                      <td>${key}</td>
                      <td>${value}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
        `).join('')}
      </div>

      ${locationData.length > 0 ? `
        <div class="section">
          <h2>Location Performance</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${locationData.map((location: any) => `
                <tr>
                  <td>${location.name}</td>
                  <td>${location.address || 'N/A'}</td>
                  <td>${location.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${includeAIInsights && aiInsights ? `
        <div class="section page-break">
          <h2>AI-Generated Insights</h2>
          <div class="insights-box">
            ${aiInsights.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
          </div>
        </div>
      ` : ''}

      ${includeRecommendations && recommendations ? `
        <div class="section">
          <h2>Strategic Recommendations</h2>
          <div class="recommendations-box">
            ${recommendations.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>This report was generated by Orthodash Analytics</p>
        <p>For questions or support, contact your Orthodash administrator</p>
      </div>
    </body>
    </html>
  `;
}
