import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireAuthUser } from '@/lib/require-auth-user'

type ReferralBreakdown = Record<string, number>

type PeriodPayload = {
  title: string
  startDate: string | null
  endDate: string | null
  data: {
    newPatientsCreated: number
    leads: number
    production: number
    netProduction: number
    npl: number
    npe: number
    npeKept: number
    npeNoShow: number
    npeScheduledRate: number
    npeKeptRate: number
    npeNoShowRate: number
    referralBreakdown: ReferralBreakdown
    conversionBreakdown: ReferralBreakdown
    professionalSubSources: ReferralBreakdown
    locationData: {
      gilbert: { production: number; netProduction: number; leads: number; bookings: number }
      phoenix: { production: number; netProduction: number; leads: number; bookings: number }
    }
    trends: { weekly: Array<{ week: string; gilbert: number; phoenix: number; total: number }> }
  } | null
}

type PerPeriodResult = {
  title: string
  summary: string
  keyInsights: string[]
  recommendations: string[]
}

type AIResult = {
  periods: PerPeriodResult[]
  comparison: string | null
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

function fmt$(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number) {
  return n.toFixed(1) + '%'
}

function buildPrompt(periods: PeriodPayload[]): string {
  const periodBlocks = periods
    .filter((p) => p.data)
    .map((p) => {
      const d = p.data!
      const topReferrals = Object.entries(d.referralBreakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => {
          const conv = d.conversionBreakdown[type]
          return `  - ${type}: ${count} patients${conv != null ? ` (${fmtPct(conv)} produced revenue)` : ''}`
        })
        .join('\n')

      const topDDS = Object.entries(d.professionalSubSources ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `  - ${name}: ${count}`)
        .join('\n')

      const gilbertPct = d.locationData.gilbert.production + d.locationData.phoenix.production > 0
        ? fmtPct((d.locationData.gilbert.production / (d.locationData.gilbert.production + d.locationData.phoenix.production)) * 100)
        : 'N/A'

      return `
=== ${p.title} (${p.startDate ?? '?'} to ${p.endDate ?? '?'}) ===

PRODUCTION
  Gross: ${fmt$(d.production)}
  Net: ${fmt$(d.netProduction)}
  Gilbert gross: ${fmt$(d.locationData.gilbert.production)} (${gilbertPct} of total)
  Phoenix gross: ${fmt$(d.locationData.phoenix.production)}

PATIENT ACQUISITION FUNNEL
  NPL (new patient leads created this period): ${d.npl}
  NPE scheduled (exam booked): ${d.npe} — ${fmtPct(d.npeScheduledRate)} of NPL
  NPE kept (exam completed): ${d.npeKept} — ${fmtPct(d.npeKeptRate)} of NPL
  NPE no-shows: ${d.npeNoShow} — ${fmtPct(d.npeNoShowRate)} of scheduled exams

NEW PATIENTS BY REFERRAL SOURCE
${topReferrals || '  (none)'}
${topDDS ? `\nPROFESSIONAL REFERRAL PROVIDERS (top 5)\n${topDDS}` : ''}`
    })
    .join('\n\n')

  const multiPeriod = periods.filter((p) => p.data).length > 1

  return `You are an expert orthodontic practice analyst for Team Orthodontics, a two-location orthodontic group in Gilbert and Phoenix-Ahwatukee, AZ. Analyze the data below and return ONLY valid JSON.

Key terminology:
- NPL: new patient lead (patient record created)
- NPE: new patient exam (exam appointment booked)
- NPE Kept: exam was actually completed (not no-showed)
- Referral types come directly from Greyfinch: Professional, Family Referral, Online, Other, Patient (Patient = friend referral)
- Conversion rate = % of patients in that referral type who produced net revenue

${periodBlocks}

Return JSON matching this exact shape:
{
  "periods": [
    {
      "title": "exact period title from above",
      "summary": "2-3 sentence narrative for this period highlighting what stands out",
      "keyInsights": ["specific insight 1", "specific insight 2", "specific insight 3"],
      "recommendations": ["actionable recommendation 1", "actionable recommendation 2"]
    }
  ]${multiPeriod ? `,
  "comparison": "2-3 sentence comparison across periods — what changed and what it means"` : ',\n  "comparison": null'}
}

Rules:
- Write one "periods" entry per period, in the same order as the data above
- Be specific — cite actual numbers from the data
- Focus on what is actionable for an orthodontic practice team
- Do not invent data or metrics not present in the input`
}

async function callOpenAI(prompt: string): Promise<AIResult> {
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert orthodontic practice analyst. Return only valid JSON. Never include markdown code fences.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.35,
    max_tokens: 2000,
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? ''
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')

  try {
    const parsed = JSON.parse(cleaned)
    return {
      periods: Array.isArray(parsed.periods)
        ? parsed.periods.map((p: Partial<PerPeriodResult>) => ({
            title: typeof p.title === 'string' ? p.title : '',
            summary: typeof p.summary === 'string' ? p.summary : '',
            keyInsights: Array.isArray(p.keyInsights) ? p.keyInsights : [],
            recommendations: Array.isArray(p.recommendations) ? p.recommendations : [],
          }))
        : [],
      comparison: typeof parsed.comparison === 'string' ? parsed.comparison : null,
    }
  } catch {
    return {
      periods: [],
      comparison: 'AI response could not be parsed. Please try again.',
    }
  }
}

export async function POST(request: NextRequest) {
  const { user, unauthorizedResponse } = await requireAuthUser()
  if (!user) return unauthorizedResponse

  try {
    const body = await request.json()
    const periods = Array.isArray(body.periods) ? (body.periods as PeriodPayload[]) : []
    const validPeriods = periods.filter((p) => p.data)

    if (validPeriods.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one period with loaded data is required.' },
        { status: 400 }
      )
    }

    const prompt = buildPrompt(validPeriods)
    const result = await callOpenAI(prompt)

    return NextResponse.json({ success: true, ...result })
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
