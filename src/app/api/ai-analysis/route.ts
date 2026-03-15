import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireAuthUser } from '@/lib/require-auth-user'

type PeriodPayload = {
  title: string
  startDate: string | null
  endDate: string | null
  locationIds: string[]
  data: {
    patients: number
    appointments: number
    leads: number
    locations: number
    bookings: number
    revenue: number
    production: number
    netProduction: number
    acquisitionCosts: number
    noShowRate: number
    referralSources: { digital: number; professional: number; direct: number }
    conversionRates: { digital: number; professional: number; direct: number }
    trends: { weekly: Array<{ week: string; gilbert: number; phoenix: number; total: number }> }
    locationData?: {
      gilbert?: LocationMetrics
      phoenix?: LocationMetrics
    }
  } | null
}

type LocationMetrics = {
  patients: number
  appointments: number
  leads: number
  bookings: number
  revenue: number
  production: number
  netProduction: number
  acquisitionCosts: number
}

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  })
}

export async function POST(request: NextRequest) {
  const { user, unauthorizedResponse } = await requireAuthUser()
  if (!user) return unauthorizedResponse

  try {
    const body = await request.json()
    const periods = Array.isArray(body.periods) ? (body.periods as PeriodPayload[]) : []
    const analysisType = typeof body.analysisType === 'string' ? body.analysisType : 'comprehensive'
    const includeRecommendations = body.includeRecommendations !== false

    const validPeriods = periods.filter((period) => period.data)

    if (validPeriods.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one report-backed period is required for AI analysis.' },
        { status: 400 }
      )
    }

    const aggregated = aggregatePeriods(validPeriods)
    const latestPeriod = getLatestPeriod(validPeriods)
    const prompt = buildAnalysisPrompt(validPeriods, aggregated, latestPeriod, includeRecommendations)
    const aiResult = await callOpenAI(prompt, includeRecommendations)

    return NextResponse.json({
      success: true,
      analysisType,
      period: aggregated.periodLabel,
      summary: {
        overview: aiResult.summary,
        keyInsights: aiResult.keyInsights,
        performanceMetrics: {
          totalProduction: aggregated.totalProduction,
          totalRevenue: aggregated.totalRevenue,
          totalNetProduction: aggregated.totalNetProduction,
          profitMargin: aggregated.profitMargin,
          roi: aggregated.roi,
          noShowRate: aggregated.noShowRate,
        },
      },
      locationComparison: {
        gilbert: {
          performance: aggregated.locationComparison.gilbert,
          insights: aiResult.gilbertInsights,
        },
        phoenix: {
          performance: aggregated.locationComparison.phoenix,
          insights: aiResult.phoenixInsights,
        },
      },
      trends: {
        weekly: latestPeriod.data?.trends.weekly || [],
        monthly: [],
        analysis: aiResult.trendAnalysis,
      },
      recommendations: includeRecommendations
        ? {
            immediate: aiResult.immediateRecommendations,
            strategic: aiResult.strategicRecommendations,
            financial: aiResult.financialRecommendations,
          }
        : null,
      dataQuality: {
        completeness: assessDataQuality(validPeriods, aggregated),
        recommendations: getDataQualityRecommendations(validPeriods, aggregated),
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate AI analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function aggregatePeriods(periods: PeriodPayload[]) {
  const totals = periods.reduce(
    (acc, period) => {
      const data = period.data!
      acc.totalPatients += data.patients || 0
      acc.totalAppointments += data.appointments || 0
      acc.totalLeads += data.leads || 0
      acc.totalBookings += data.bookings || 0
      acc.totalProduction += data.production || 0
      acc.totalRevenue += data.revenue || 0
      acc.totalNetProduction += data.netProduction || 0
      acc.totalAcquisitionCosts += data.acquisitionCosts || 0
      acc.weightedNoShowNumerator += (data.noShowRate || 0) * Math.max(data.appointments || 0, 1)
      acc.weightedNoShowDenominator += Math.max(data.appointments || 0, 1)
      acc.referralSources.digital += data.referralSources?.digital || 0
      acc.referralSources.professional += data.referralSources?.professional || 0
      acc.referralSources.direct += data.referralSources?.direct || 0
      acc.weightedConversion.digital += (data.conversionRates?.digital || 0) * (data.referralSources?.digital || 0)
      acc.weightedConversion.professional += (data.conversionRates?.professional || 0) * (data.referralSources?.professional || 0)
      acc.weightedConversion.direct += (data.conversionRates?.direct || 0) * (data.referralSources?.direct || 0)
      acc.conversionDenominators.digital += data.referralSources?.digital || 0
      acc.conversionDenominators.professional += data.referralSources?.professional || 0
      acc.conversionDenominators.direct += data.referralSources?.direct || 0

      addLocationMetrics(acc.locationComparison.gilbert, data.locationData?.gilbert)
      addLocationMetrics(acc.locationComparison.phoenix, data.locationData?.phoenix)
      return acc
    },
    {
      totalPatients: 0,
      totalAppointments: 0,
      totalLeads: 0,
      totalBookings: 0,
      totalProduction: 0,
      totalRevenue: 0,
      totalNetProduction: 0,
      totalAcquisitionCosts: 0,
      weightedNoShowNumerator: 0,
      weightedNoShowDenominator: 0,
      referralSources: { digital: 0, professional: 0, direct: 0 },
      weightedConversion: { digital: 0, professional: 0, direct: 0 },
      conversionDenominators: { digital: 0, professional: 0, direct: 0 },
      locationComparison: {
        gilbert: emptyLocationMetrics(),
        phoenix: emptyLocationMetrics(),
      },
    }
  )

  const profitMargin = totals.totalProduction > 0
    ? (totals.totalNetProduction / totals.totalProduction) * 100
    : 0
  const roi = totals.totalAcquisitionCosts > 0
    ? ((totals.totalNetProduction - totals.totalAcquisitionCosts) / totals.totalAcquisitionCosts) * 100
    : 0

  return {
    ...totals,
    noShowRate: totals.weightedNoShowDenominator > 0
      ? totals.weightedNoShowNumerator / totals.weightedNoShowDenominator
      : 0,
    conversionRates: {
      digital: totals.conversionDenominators.digital > 0 ? totals.weightedConversion.digital / totals.conversionDenominators.digital : 0,
      professional: totals.conversionDenominators.professional > 0 ? totals.weightedConversion.professional / totals.conversionDenominators.professional : 0,
      direct: totals.conversionDenominators.direct > 0 ? totals.weightedConversion.direct / totals.conversionDenominators.direct : 0,
    },
    profitMargin,
    roi,
    periodLabel: periods.map((period) => period.title).join(', '),
  }
}

function getLatestPeriod(periods: PeriodPayload[]): PeriodPayload {
  return [...periods].sort((a, b) => {
    const aTime = a.endDate ? new Date(a.endDate).getTime() : 0
    const bTime = b.endDate ? new Date(b.endDate).getTime() : 0
    return bTime - aTime
  })[0]
}

function buildAnalysisPrompt(
  periods: PeriodPayload[],
  aggregated: ReturnType<typeof aggregatePeriods>,
  latestPeriod: PeriodPayload,
  includeRecommendations: boolean
) {
  const periodDetails = periods.map((period) => {
    const data = period.data!
    return {
      title: period.title,
      startDate: period.startDate,
      endDate: period.endDate,
      patients: data.patients,
      appointments: data.appointments,
      leads: data.leads,
      bookings: data.bookings,
      production: data.production,
      revenue: data.revenue,
      netProduction: data.netProduction,
      noShowRate: data.noShowRate,
      referralSources: data.referralSources,
      conversionRates: data.conversionRates,
    }
  })

  return `
You are an expert orthodontic practice analyst. Analyze the following report-backed practice data and respond with valid JSON only.

AGGREGATED PERFORMANCE
- Periods included: ${aggregated.periodLabel}
- Total Patients: ${aggregated.totalPatients}
- Total Appointments: ${aggregated.totalAppointments}
- Total Leads: ${aggregated.totalLeads}
- Total Bookings: ${aggregated.totalBookings}
- Total Production: $${aggregated.totalProduction.toLocaleString()}
- Total Revenue: $${aggregated.totalRevenue.toLocaleString()}
- Total Net Production: $${aggregated.totalNetProduction.toLocaleString()}
- Profit Margin: ${aggregated.profitMargin.toFixed(1)}%
- ROI: ${aggregated.roi.toFixed(1)}%
- No-Show Rate: ${aggregated.noShowRate.toFixed(1)}%

LOCATION BREAKDOWN
- Gilbert: ${JSON.stringify(aggregated.locationComparison.gilbert)}
- Phoenix-Ahwatukee: ${JSON.stringify(aggregated.locationComparison.phoenix)}

REFERRAL SOURCES
- ${JSON.stringify(aggregated.referralSources)}

CONVERSION RATES
- ${JSON.stringify(aggregated.conversionRates)}

LATEST PERIOD WEEKLY TRENDS
- ${JSON.stringify(latestPeriod.data?.trends.weekly || [])}

PER-PERIOD DETAILS
${JSON.stringify(periodDetails, null, 2)}

Return JSON in this shape:
{
  "summary": "2-3 sentence executive overview",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "gilbertInsights": ["Gilbert insight 1", "Gilbert insight 2"],
  "phoenixInsights": ["Phoenix insight 1", "Phoenix insight 2"],
  "trendAnalysis": "Short trend analysis",
  ${includeRecommendations ? `
  "immediateRecommendations": ["Immediate action 1", "Immediate action 2"],
  "strategicRecommendations": ["Strategic recommendation 1", "Strategic recommendation 2"],
  "financialRecommendations": ["Financial recommendation 1", "Financial recommendation 2"]
  ` : ''}
}
`
}

async function callOpenAI(prompt: string, includeRecommendations: boolean) {
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert orthodontic practice analyst. Use only the provided data. Always return valid JSON matching the requested schema.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 1800,
  })

  const content = completion.choices[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('No content received from OpenAI')
  }

  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  try {
    const parsed = JSON.parse(cleaned)
    return {
      summary: parsed.summary || 'Analysis completed successfully.',
      keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
      gilbertInsights: Array.isArray(parsed.gilbertInsights) ? parsed.gilbertInsights : [],
      phoenixInsights: Array.isArray(parsed.phoenixInsights) ? parsed.phoenixInsights : [],
      trendAnalysis: parsed.trendAnalysis || 'Trend analysis completed.',
      immediateRecommendations: includeRecommendations && Array.isArray(parsed.immediateRecommendations) ? parsed.immediateRecommendations : [],
      strategicRecommendations: includeRecommendations && Array.isArray(parsed.strategicRecommendations) ? parsed.strategicRecommendations : [],
      financialRecommendations: includeRecommendations && Array.isArray(parsed.financialRecommendations) ? parsed.financialRecommendations : [],
    }
  } catch {
    return {
      summary: cleaned,
      keyInsights: ['AI analysis completed, but the response format was not structured as JSON.'],
      gilbertInsights: [],
      phoenixInsights: [],
      trendAnalysis: 'Trend analysis completed.',
      immediateRecommendations: [],
      strategicRecommendations: [],
      financialRecommendations: [],
    }
  }
}

function assessDataQuality(periods: PeriodPayload[], aggregated: ReturnType<typeof aggregatePeriods>) {
  if (periods.length >= 2 && aggregated.totalProduction > 0 && aggregated.totalAppointments > 0) {
    return 'High - Multiple report-backed periods with financial and operational metrics are available.'
  }
  if (aggregated.totalProduction > 0 || aggregated.totalAppointments > 0) {
    return 'Medium - Report-backed data is available, but the analysis would improve with more periods.'
  }
  return 'Low - Limited report-backed data is available for AI analysis.'
}

function getDataQualityRecommendations(periods: PeriodPayload[], aggregated: ReturnType<typeof aggregatePeriods>) {
  const recommendations: string[] = []

  if (periods.length < 2) {
    recommendations.push('Add another analysis period to give the AI a clearer comparison baseline.')
  }
  if (aggregated.totalLeads === 0) {
    recommendations.push('Validate lead tracking so conversion and referral insights are fully populated.')
  }
  if (aggregated.totalAcquisitionCosts === 0) {
    recommendations.push('Enter acquisition costs for each period to improve ROI and recommendation quality.')
  }
  if (aggregated.totalAppointments === 0) {
    recommendations.push('Verify the Practice Efficiency report is returning completed appointments for the selected range.')
  }

  return recommendations.length > 0
    ? recommendations
    : ['The current report-backed dataset is sufficient for a reliable AI summary.']
}

function emptyLocationMetrics(): LocationMetrics {
  return {
    patients: 0,
    appointments: 0,
    leads: 0,
    bookings: 0,
    revenue: 0,
    production: 0,
    netProduction: 0,
    acquisitionCosts: 0,
  }
}

function addLocationMetrics(target: LocationMetrics, source?: LocationMetrics) {
  if (!source) return
  target.patients += source.patients || 0
  target.appointments += source.appointments || 0
  target.leads += source.leads || 0
  target.bookings += source.bookings || 0
  target.revenue += source.revenue || 0
  target.production += source.production || 0
  target.netProduction += source.netProduction || 0
  target.acquisitionCosts += source.acquisitionCosts || 0
}
