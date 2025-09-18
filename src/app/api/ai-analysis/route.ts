import { NextRequest, NextResponse } from 'next/server'
import { MultiLocationDataProcessor } from '@/lib/services/multi-location-data-processor'
import { GreyfinchService } from '@/lib/services/greyfinch'
import { GREYFINCH_QUERIES } from '@/lib/services/greyfinch-schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      startDate, 
      endDate, 
      location, 
      analysisType = 'comprehensive',
      includeRecommendations = true 
    } = body

    console.log('🤖 Starting AI analysis with comprehensive data...', { startDate, endDate, location, analysisType })

    // Fetch comprehensive multi-location data
    const greyfinchService = new GreyfinchService()
    greyfinchService.updateCredentials(
      process.env.GREYFINCH_API_KEY || '', 
      process.env.GREYFINCH_API_SECRET || ''
    )

    // Try to fetch data from the working analytics endpoint first
    const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/greyfinch/analytics?location=all`)
    const analyticsData = await analyticsResponse.json()
    
    if (!analyticsData || !analyticsData.data) {
      throw new Error('Failed to fetch data from Greyfinch analytics endpoint')
    }
    
    const rawData = analyticsData.data

    // Process data with multi-location processor
    const processedData = MultiLocationDataProcessor.processMultiLocationData(rawData, startDate, endDate)

    // Prepare comprehensive data for AI analysis
    const analysisData = {
      summary: {
        period: processedData.total.period,
        totalPatients: processedData.total.patients,
        totalAppointments: processedData.total.appointments,
        totalLeads: processedData.total.leads,
        totalProduction: processedData.financialMetrics.totalProduction,
        totalRevenue: processedData.financialMetrics.totalRevenue,
        totalNetProduction: processedData.financialMetrics.totalNetProduction,
        profitMargin: processedData.financialMetrics.profitMargin,
        roi: processedData.financialMetrics.roi
      },
      locations: {
        gilbert: {
          patients: processedData.locations.gilbert.patients,
          appointments: processedData.locations.gilbert.appointments,
          leads: processedData.locations.gilbert.leads,
          production: processedData.locations.gilbert.production,
          revenue: processedData.locations.gilbert.revenue,
          netProduction: processedData.locations.gilbert.netProduction,
          acquisitionCosts: processedData.locations.gilbert.acquisitionCosts
        },
        phoenix: {
          patients: processedData.locations.phoenix.patients,
          appointments: processedData.locations.phoenix.appointments,
          leads: processedData.locations.phoenix.leads,
          production: processedData.locations.phoenix.production,
          revenue: processedData.locations.phoenix.revenue,
          netProduction: processedData.locations.phoenix.netProduction,
          acquisitionCosts: processedData.locations.phoenix.acquisitionCosts
        }
      },
      trends: {
        weekly: processedData.trends.weekly.slice(-12), // Last 12 weeks
        monthly: processedData.trends.monthly.slice(-6) // Last 6 months
      },
      performance: {
        noShowRate: processedData.total.noShowRate,
        referralSources: processedData.total.referralSources,
        conversionRates: processedData.total.conversionRates
      }
    }

    // Generate AI analysis prompt
    const prompt = generateAnalysisPrompt(analysisData, analysisType, includeRecommendations)

    // Call OpenAI API
    const openaiResponse = await callOpenAI(prompt)

    // Structure the response
    const response = {
      success: true,
      analysisType,
      period: processedData.total.period,
      summary: {
        overview: openaiResponse.summary || 'Analysis completed successfully',
        keyInsights: openaiResponse.keyInsights || [],
        performanceMetrics: {
          totalProduction: processedData.financialMetrics.totalProduction,
          totalRevenue: processedData.financialMetrics.totalRevenue,
          totalNetProduction: processedData.financialMetrics.totalNetProduction,
          profitMargin: processedData.financialMetrics.profitMargin,
          roi: processedData.financialMetrics.roi,
          noShowRate: processedData.total.noShowRate
        }
      },
      locationComparison: {
        gilbert: {
          performance: processedData.locations.gilbert,
          insights: openaiResponse.gilbertInsights || []
        },
        phoenix: {
          performance: processedData.locations.phoenix,
          insights: openaiResponse.phoenixInsights || []
        }
      },
      trends: {
        weekly: processedData.trends.weekly,
        monthly: processedData.trends.monthly,
        analysis: openaiResponse.trendAnalysis || 'Trend analysis completed'
      },
      recommendations: includeRecommendations ? {
        immediate: openaiResponse.immediateRecommendations || [],
        strategic: openaiResponse.strategicRecommendations || [],
        financial: openaiResponse.financialRecommendations || []
      } : null,
      dataQuality: {
        completeness: assessDataQuality(processedData),
        recommendations: getDataQualityRecommendations(processedData)
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to generate AI analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Generate comprehensive analysis prompt for OpenAI
 */
function generateAnalysisPrompt(data: any, analysisType: string, includeRecommendations: boolean): string {
  const basePrompt = `
You are an expert dental practice analyst with deep expertise in orthodontic practice management, revenue optimization, and multi-location operations. Analyze the following comprehensive data for Gilbert and Phoenix-Ahwatukee orthodontic practices:

## PRACTICE OVERVIEW
Period: ${data.summary.period}
Total Patients: ${data.summary.totalPatients}
Total Appointments: ${data.summary.totalAppointments}
Total Leads: ${data.summary.totalLeads}

## FINANCIAL PERFORMANCE
Total Production: $${data.summary.totalProduction.toLocaleString()}
Total Revenue: $${data.summary.totalRevenue.toLocaleString()}
Net Production: $${data.summary.totalNetProduction.toLocaleString()}
Profit Margin: ${data.summary.profitMargin.toFixed(1)}%
ROI: ${data.summary.roi.toFixed(1)}%

## LOCATION PERFORMANCE

### Gilbert Location:
- Patients: ${data.locations.gilbert.patients}
- Appointments: ${data.locations.gilbert.appointments}
- Leads: ${data.locations.gilbert.leads}
- Production: $${data.locations.gilbert.production.toLocaleString()}
- Revenue: $${data.locations.gilbert.revenue.toLocaleString()}
- Net Production: $${data.locations.gilbert.netProduction.toLocaleString()}
- Acquisition Costs: $${data.locations.gilbert.acquisitionCosts.toLocaleString()}

### Phoenix-Ahwatukee Location:
- Patients: ${data.locations.phoenix.patients}
- Appointments: ${data.locations.phoenix.appointments}
- Leads: ${data.locations.phoenix.leads}
- Production: $${data.locations.phoenix.production.toLocaleString()}
- Revenue: $${data.locations.phoenix.revenue.toLocaleString()}
- Net Production: $${data.locations.phoenix.netProduction.toLocaleString()}
- Acquisition Costs: $${data.locations.phoenix.acquisitionCosts.toLocaleString()}

## PERFORMANCE METRICS
No-Show Rate: ${data.performance.noShowRate.toFixed(1)}%
Referral Sources: Digital ${data.performance.referralSources.digital}, Professional ${data.performance.referralSources.professional}, Direct ${data.performance.referralSources.direct}
Conversion Rates: Digital ${data.performance.conversionRates.digital.toFixed(1)}%, Professional ${data.performance.conversionRates.professional.toFixed(1)}%, Direct ${data.performance.conversionRates.direct.toFixed(1)}%

## TRENDS DATA
Weekly Trends: ${JSON.stringify(data.trends.weekly.slice(-4))}
Monthly Trends: ${JSON.stringify(data.trends.monthly.slice(-3))}

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": "Overall practice performance summary (2-3 sentences)",
  "keyInsights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "gilbertInsights": ["Gilbert-specific insight 1", "Gilbert-specific insight 2"],
  "phoenixInsights": ["Phoenix-specific insight 1", "Phoenix-specific insight 2"],
  "trendAnalysis": "Analysis of weekly and monthly trends",
  ${includeRecommendations ? `
  "immediateRecommendations": ["Immediate action 1", "Immediate action 2"],
  "strategicRecommendations": ["Strategic recommendation 1", "Strategic recommendation 2"],
  "financialRecommendations": ["Financial optimization 1", "Financial optimization 2"]
  ` : ''}
}

Focus on:
1. Revenue and production optimization opportunities
2. Location-specific performance differences
3. Patient acquisition and conversion improvements
4. Operational efficiency gains
5. Financial performance analysis
6. Trend identification and forecasting

Provide actionable, specific recommendations based on the data.
`

  return basePrompt
}

/**
 * Call OpenAI API for analysis
 */
async function callOpenAI(prompt: string): Promise<any> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert dental practice analyst specializing in orthodontic practice management and revenue optimization. Always respond with valid JSON format as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    try {
      return JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError)
      console.log('Raw response:', content)
      
      // Return structured response even if JSON parsing fails
      return {
        summary: content,
        keyInsights: ["Analysis completed successfully"],
        gilbertInsights: ["Gilbert location analysis completed"],
        phoenixInsights: ["Phoenix location analysis completed"],
        trendAnalysis: "Trend analysis completed",
        immediateRecommendations: ["Review the generated summary for specific recommendations"],
        strategicRecommendations: ["Consider implementing the suggested improvements"],
        financialRecommendations: ["Focus on revenue optimization strategies"]
      }
    }
  } catch (error) {
    console.error('OpenAI API call failed:', error)
    throw error
  }
}

/**
 * Assess data quality
 */
function assessDataQuality(processedData: any): string {
  const totalData = processedData.total
  const hasFinancialData = totalData.production > 0 || totalData.revenue > 0
  const hasPatientData = totalData.patients > 0
  const hasAppointmentData = totalData.appointments > 0
  
  if (hasFinancialData && hasPatientData && hasAppointmentData) {
    return 'High - Complete financial and operational data available'
  } else if (hasPatientData && hasAppointmentData) {
    return 'Medium - Patient and appointment data available, financial data limited'
  } else {
    return 'Low - Limited data available for comprehensive analysis'
  }
}

/**
 * Get data quality recommendations
 */
function getDataQualityRecommendations(processedData: any): string[] {
  const recommendations = []
  const totalData = processedData.total
  
  if (totalData.production === 0 && totalData.revenue === 0) {
    recommendations.push('Implement production and revenue tracking for better financial analysis')
  }
  
  if (totalData.leads === 0) {
    recommendations.push('Set up lead tracking system to measure marketing effectiveness')
  }
  
  if (processedData.locations.gilbert.acquisitionCosts === 0 && processedData.locations.phoenix.acquisitionCosts === 0) {
    recommendations.push('Track marketing and acquisition costs for ROI analysis')
  }
  
  return recommendations.length > 0 ? recommendations : ['Data quality is good - continue current tracking practices']
}
