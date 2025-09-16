import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(request: NextRequest) {
  try {
    console.log('Generate summary API called');
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    
    const body = await request.json();
    const { rawDataDump, userId } = body;

    console.log('Generate summary request:', { 
      periodsCount: rawDataDump?.analysisPeriods?.length || 0, 
      hasGreyfinchData: !!rawDataDump?.greyfinchData, 
      userId: userId ? 'present' : 'missing',
      locationsCount: rawDataDump?.allLocations?.length || 0,
      dataSummary: rawDataDump?.dataSummary
    });

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Calculate KPIs from available data
    const kpis = calculateKPIs(rawDataDump?.analysisPeriods || [], rawDataDump?.greyfinchData || {});

    console.log('Raw data dump prepared for AI analysis:', {
      periodsCount: rawDataDump?.analysisPeriods?.length || 0,
      locationsCount: rawDataDump?.allLocations?.length || 0,
      hasLocationBreakdown: !!rawDataDump?.locationBreakdown,
      kpis: kpis,
      dataSummary: rawDataDump?.dataSummary
    });

    // Create a dynamic prompt based on available data
    let dataDescription = '';
    if (rawDataDump?.dataSummary?.hasMultiplePeriods) {
      dataDescription += `- ${rawDataDump.dataSummary.totalPeriods} analysis periods with date ranges\n`;
    }
    if (rawDataDump?.dataSummary?.hasMultipleLocations) {
      dataDescription += `- ${rawDataDump.dataSummary.totalLocations} practice locations with location-specific data\n`;
    }
    if (rawDataDump?.dataSummary?.hasGreyfinchData) {
      dataDescription += `- Complete Greyfinch practice management data (patients, appointments, leads, locations)\n`;
    }
    if (rawDataDump?.dataSummary?.hasAcquisitionCosts) {
      dataDescription += `- Acquisition cost data from multiple sources\n`;
    }
    if (rawDataDump?.dataSummary?.hasLocationBreakdown) {
      dataDescription += `- Detailed location breakdown with individual performance metrics\n`;
    }
    if (!dataDescription) {
      dataDescription = '- Basic practice information (no specific data available yet)';
    }

    const prompt = `
You are an expert orthodontic practice analyst specializing in marketing analytics, patient acquisition, and practice optimization. Analyze the following raw data dump and provide comprehensive insights with national benchmarking and marketing spend optimization strategies.

AVAILABLE DATA:
${dataDescription}

RAW PRACTICE DATA DUMP:
${JSON.stringify(rawDataDump, null, 2)}

Please provide a comprehensive analysis in the following JSON format:

{
  "summary": "EXECUTIVE SUMMARY (2-3 paragraphs): A high-level overview of practice performance, key trends, and overall health. Include specific metrics and comparisons to national orthodontic practice averages when possible.",
  
  "insights": [
    "KEY INSIGHT 1: Specific observation about performance, trends, or opportunities",
    "KEY INSIGHT 2: Another specific observation",
    "KEY INSIGHT 3: Third observation",
    "KEY INSIGHT 4: Fourth observation",
    "KEY INSIGHT 5: Fifth observation"
  ],
  
  "nationalComparison": {
    "patientVolume": "How the practice's patient volume compares to national averages (typically 800-1200 patients per practice)",
    "appointmentUtilization": "Appointment utilization rate vs. national average (typically 85-92%)",
    "noShowRate": "No-show rate comparison (national average is 8-12%)",
    "acquisitionCost": "Patient acquisition cost vs. national average ($800-1500 per new patient)",
    "conversionRate": "Lead to appointment conversion vs. national average (15-25%)"
  },
  
  "marketingOptimization": {
    "currentEfficiency": "Analysis of current marketing spend efficiency",
    "digitalMarketing": "Specific recommendations for digital marketing optimization",
    "referralPrograms": "Professional referral program optimization strategies",
    "localMarketing": "Local market penetration and community outreach strategies",
    "budgetAllocation": "Recommended budget allocation across marketing channels",
    "roiImprovement": "Specific tactics to improve marketing ROI"
  },
  
  "strategicRecommendations": [
    "STRATEGIC RECOMMENDATION 1: Specific, actionable advice for improving practice performance",
    "STRATEGIC RECOMMENDATION 2: Marketing efficiency improvement",
    "STRATEGIC RECOMMENDATION 3: Patient acquisition strategy",
    "STRATEGIC RECOMMENDATION 4: Cost optimization",
    "STRATEGIC RECOMMENDATION 5: Revenue growth strategy"
  ],
  
  "kpis": {
    "roas": ${kpis.roas},
    "roi": ${kpis.roi},
    "acquisitionCost": ${kpis.acquisitionCost},
    "lifetimeValue": ${kpis.lifetimeValue},
    "conversionRate": ${kpis.conversionRate}
  },
  
  "acquisitionCosts": ${JSON.stringify(rawDataDump?.analysisPeriods?.map((p: any) => p.acquisitionCosts) || [])},
  
  "dataRecommendations": [
    "DATA RECOMMENDATION 1: Specific data to collect for better analysis",
    "DATA RECOMMENDATION 2: How to use the data for optimization",
    "DATA RECOMMENDATION 3: Additional metrics to track"
  ]
}

IMPORTANT GUIDELINES:
1. Always provide specific, actionable insights based on the available data
2. Include national orthodontic practice benchmarks when relevant
3. Focus heavily on marketing spend optimization and ROI improvement
4. Provide concrete, measurable recommendations
5. If data is limited, provide general best practices and specific data collection recommendations
6. Ensure all recommendations are practical and implementable
7. Always respond with valid JSON format
`;

    console.log('Sending request to OpenAI...');
    console.log('Prompt length:', prompt.length);

    let response: string;
    try {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert orthodontic practice analyst specializing in marketing analytics, patient acquisition, and practice optimization. You have deep knowledge of national orthodontic practice benchmarks and marketing optimization strategies. Always provide specific, actionable insights with national comparisons and concrete marketing spend optimization recommendations. Always respond with valid JSON. If limited data is available, provide general best practices and specific data collection recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      response = completion.choices[0]?.message?.content || '';
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      console.log('OpenAI response received, length:', response.length);
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      throw new Error(`OpenAI API error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`);
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
      console.log('Successfully parsed JSON response');
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      console.log('Raw response:', response);
      
      // If JSON parsing fails, create a structured response
      parsedResponse = {
        summary: response,
        insights: ["Analysis completed successfully"],
        nationalComparison: {
          patientVolume: "Data insufficient for national comparison",
          appointmentUtilization: "Data insufficient for national comparison",
          noShowRate: "Data insufficient for national comparison",
          acquisitionCost: "Data insufficient for national comparison",
          conversionRate: "Data insufficient for national comparison"
        },
        marketingOptimization: {
          currentEfficiency: "Data insufficient for marketing analysis",
          digitalMarketing: "Focus on collecting marketing spend data",
          referralPrograms: "Implement referral tracking systems",
          localMarketing: "Develop local market presence",
          budgetAllocation: "Establish baseline marketing metrics",
          roiImprovement: "Track all marketing costs and conversions"
        },
        strategicRecommendations: ["Review the generated summary for specific recommendations"],
        kpis: kpis,
        acquisitionCosts: rawDataDump?.analysisPeriods?.map((p: any) => p.acquisitionCosts) || [],
        dataRecommendations: ["Consider collecting more data for better analysis"]
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

function calculateKPIs(analysisPeriods: any[], greyfinchData: any) {
  // Default values
  let totalAcquisitionCost = 0;
  let totalRevenue = 0;
  let totalPatients = 0;
  let totalLeads = 0;

  // Calculate from acquisition costs
  if (analysisPeriods && analysisPeriods.length > 0) {
    analysisPeriods.forEach(period => {
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
    
    // Extract additional metrics for better analysis
    const appointments = greyfinchData.appointments || 0;
    const bookings = greyfinchData.bookings || 0;
    const locations = greyfinchData.locations || 0;
    
    // Calculate appointment utilization rate
    const appointmentUtilization = appointments > 0 ? (bookings / appointments) * 100 : 0;
    
    // Calculate no-show rate (if available)
    const noShowRate = greyfinchData.noShowRate || 0;
    
    // Store additional metrics for the analysis
    greyfinchData.additionalMetrics = {
      appointmentUtilization: Math.round(appointmentUtilization * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      totalLocations: locations,
      avgPatientsPerLocation: locations > 0 ? Math.round(totalPatients / locations) : 0
    };
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

function extractAcquisitionCosts(analysisPeriods: any[]) {
  const costs: any[] = [];
  
  if (analysisPeriods && analysisPeriods.length > 0) {
    analysisPeriods.forEach(period => {
      if (period.acquisitionCosts) {
        // Manual costs
        if (period.acquisitionCosts.manual) {
          period.acquisitionCosts.manual.forEach((cost: any) => {
            costs.push({
              source: cost.referralType || 'Manual',
              cost: cost.cost,
              period: period.periodInfo?.startDate ? new Date(period.periodInfo.startDate).toLocaleDateString() : 'Unknown'
            });
          });
        }
        // API costs
        if (period.acquisitionCosts.api) {
          period.acquisitionCosts.api.forEach((cost: any) => {
            costs.push({
              source: cost.platform || 'API',
              cost: cost.spend,
              period: period.periodInfo?.startDate ? new Date(period.periodInfo.startDate).toLocaleDateString() : 'Unknown'
            });
          });
        }
      }
    });
  }
  
  return costs;
}
