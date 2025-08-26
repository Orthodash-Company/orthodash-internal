import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { periods, greyfinchData, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Calculate KPIs from Greyfinch data and acquisition costs
    const kpis = calculateKPIs(periods, greyfinchData);

    // Prepare data for AI analysis
    const analysisData = {
      periods: periods || [],
      greyfinchData: greyfinchData || {},
      kpis: kpis,
      acquisitionCosts: extractAcquisitionCosts(periods)
    };

    const prompt = `
You are an expert orthodontic practice analyst. Analyze the following data and provide comprehensive insights:

PRACTICE DATA:
${JSON.stringify(analysisData, null, 2)}

Please provide:

1. EXECUTIVE SUMMARY (2-3 paragraphs): A high-level overview of practice performance, key trends, and overall health.

2. KEY INSIGHTS (5-7 bullet points): Specific observations about performance, trends, and opportunities.

3. STRATEGIC RECOMMENDATIONS (5-7 actionable recommendations): Specific, actionable advice for improving practice performance, marketing efficiency, and patient acquisition.

4. KPI ANALYSIS: Analyze the provided KPIs (ROAS, ROI, Acquisition Cost, Lifetime Value, Conversion Rate) and provide insights on:
   - Marketing efficiency
   - Cost optimization opportunities
   - Revenue growth potential
   - Patient acquisition strategies

Focus on practical, actionable insights that can help improve the practice's financial performance and patient acquisition efficiency.

Format your response as JSON with the following structure:
{
  "summary": "executive summary text",
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "kpis": {
    "roas": ${kpis.roas},
    "roi": ${kpis.roi},
    "acquisitionCost": ${kpis.acquisitionCost},
    "lifetimeValue": ${kpis.lifetimeValue},
    "conversionRate": ${kpis.conversionRate}
  },
  "acquisitionCosts": ${JSON.stringify(analysisData.acquisitionCosts)}
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert orthodontic practice analyst specializing in marketing analytics, patient acquisition, and practice optimization. Provide clear, actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (e) {
      // If JSON parsing fails, create a structured response
      parsedResponse = {
        summary: response,
        insights: ["Analysis completed successfully"],
        recommendations: ["Review the generated summary for specific recommendations"],
        kpis: kpis,
        acquisitionCosts: analysisData.acquisitionCosts
      };
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ 
      error: 'Failed to generate summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateKPIs(periods: any[], greyfinchData: any) {
  // Default values
  let totalAcquisitionCost = 0;
  let totalRevenue = 0;
  let totalPatients = 0;
  let totalLeads = 0;

  // Calculate from acquisition costs
  if (periods && periods.length > 0) {
    periods.forEach(period => {
      if (period.acquisitionCosts) {
        // Manual costs
        if (period.acquisitionCosts.manual) {
          period.acquisitionCosts.manual.forEach((cost: any) => {
            totalAcquisitionCost += cost.cost || 0;
          });
        }
        // API costs
        if (period.acquisitionCosts.api) {
          period.acquisitionCosts.api.forEach((cost: any) => {
            totalAcquisitionCost += cost.spend || 0;
          });
        }
      }
    });
  }

  // Get data from Greyfinch
  if (greyfinchData) {
    totalPatients = greyfinchData.patients || 0;
    totalLeads = greyfinchData.leads || 0;
    
    // Estimate revenue based on patients and average treatment value
    const avgTreatmentValue = 5200; // Default average treatment value
    totalRevenue = totalPatients * avgTreatmentValue;
  }

  // Calculate KPIs
  const roas = totalAcquisitionCost > 0 ? totalRevenue / totalAcquisitionCost : 0;
  const roi = totalAcquisitionCost > 0 ? ((totalRevenue - totalAcquisitionCost) / totalAcquisitionCost) * 100 : 0;
  const avgAcquisitionCost = (totalLeads + totalPatients) > 0 ? totalAcquisitionCost / (totalLeads + totalPatients) : 0;
  const lifetimeValue = totalPatients > 0 ? totalRevenue / totalPatients : 0;
  const conversionRate = totalLeads > 0 ? (totalPatients / totalLeads) * 100 : 0;

  return {
    roas: Math.round(roas * 100) / 100,
    roi: Math.round(roi * 10) / 10,
    acquisitionCost: Math.round(avgAcquisitionCost),
    lifetimeValue: Math.round(lifetimeValue),
    conversionRate: Math.round(conversionRate * 10) / 10
  };
}

function extractAcquisitionCosts(periods: any[]) {
  const costs: any[] = [];
  
  if (periods && periods.length > 0) {
    periods.forEach(period => {
      if (period.acquisitionCosts) {
        // Manual costs
        if (period.acquisitionCosts.manual) {
          period.acquisitionCosts.manual.forEach((cost: any) => {
            costs.push({
              source: cost.referralType || 'Manual',
              cost: cost.cost,
              period: period.startDate ? new Date(period.startDate).toLocaleDateString() : 'Unknown'
            });
          });
        }
        // API costs
        if (period.acquisitionCosts.api) {
          period.acquisitionCosts.api.forEach((cost: any) => {
            costs.push({
              source: cost.platform || 'API',
              cost: cost.spend,
              period: period.startDate ? new Date(period.startDate).toLocaleDateString() : 'Unknown'
            });
          });
        }
      }
    });
  }
  
  return costs;
}
