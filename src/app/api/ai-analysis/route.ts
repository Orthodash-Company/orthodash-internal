import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireAuthUser } from '@/lib/require-auth-user'

type PeriodPayload = {
  title: string
  startDate: string | null
  endDate: string | null
  referralSources?: string[]
  data: {
    totals: {
      npl: number
      npe: number
      npeKept: number
      netProduction: number
      acquisitionCosts: number
      netAfterCosts: number
    }
    referralSources: Array<{
      referralType: string
      npl: number
      npeKept: number
      conversionRate: number
    }>
    unmappedReferralPatientCount: number
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
      const topReferrals = d.referralSources
        .map((source) => `  - ${source.referralType}: ${source.npl} NPL, ${source.npeKept} kept (${fmtPct(source.conversionRate)} conversion)`)
        .join('\n')

      return `
=== ${p.title} (${p.startDate ?? '?'} to ${p.endDate ?? '?'}) ===
REFERRAL FILTER: ${p.referralSources?.length ? p.referralSources.join(', ') : 'All referral sources'}

FINANCIAL
  Net production: ${fmt$(d.totals.netProduction)}
  Acquisition costs: ${fmt$(d.totals.acquisitionCosts)}
  Net after costs: ${fmt$(d.totals.netAfterCosts)}
  Scope: All referral sources (financial data cannot be attributed to a referral source)

PATIENT ACQUISITION FUNNEL
  NPL (new patient leads created this period): ${d.totals.npl}
  NPE scheduled (exam booked): ${d.totals.npe}
  NPE kept (exam completed): ${d.totals.npeKept}

NEW PATIENTS BY REFERRAL SOURCE
${topReferrals || '  (none)'}
${d.unmappedReferralPatientCount > 0 ? `\nUNMAPPED REFERRALS\n  - ${d.unmappedReferralPatientCount} NPLs did not map to PATIENT_REFERRALS` : ''}`
    })
    .join('\n\n')

  const multiPeriod = periods.filter((p) => p.data).length > 1

  return `You are an expert orthodontic practice analyst for Team Orthodontics, a two-location orthodontic group in Gilbert and Phoenix-Ahwatukee, AZ. Analyze the data below and return ONLY valid JSON.

Key terminology:
- NPL: new patient lead (patient record created)
- NPE: new patient exam (exam appointment booked)
- NPE Kept: exam was actually completed (not no-showed)
- Referral types come directly from Greyfinch: Professional, Family Referral, Online, Other, Patient (Patient = friend referral)
- Conversion rate = % of NPLs in that referral type who became NPE Kept

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
