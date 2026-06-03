// GET /api/greyfinch/period-analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Runs PATIENT_REFERRALS plus a patients query, returns per-location data.
// Gross/net production and referral breakdown are sourced from PATIENT_REFERRALS.
// NPL/NPE funnel is sourced from the patients GraphQL query.
// Locations are always filtered in memory to DASHBOARD_LOCATION_IDS.
//
// Cache strategy:
//   L1 — in-memory Map (fast, lost on server restart)
//   L2 — DB analyticsCache table (persistent, survives restarts)
// TTL: 1 hour. Bust with ?refresh=true.

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/require-auth-user'
import { tryCatch } from '@/lib/try-catch'
import { fetchReport } from '@/lib/services/greyfinch/reports'
import { fetchPatientFunnel } from '@/lib/services/greyfinch/patient-funnel'
import { DASHBOARD_LOCATION_IDS, PRACTICE_TZ } from '@/lib/services/greyfinch/queries'
import { PeriodAnalyticsParamsSchema } from '@/lib/services/greyfinch/types'
import {
  parsePatientReferrals,
  buildPeriodData,
  type PeriodAnalyticsResponse,
} from '@/lib/services/greyfinch/parsers'
import { eq, and, gt } from 'drizzle-orm'
import { analyticsCache } from '@/shared/schema'

// ─── Cache helpers ────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const DB_CACHE_TYPE = 'period-analytics'

// L1: in-memory (fast, current process only)
interface L1Entry { data: PeriodAnalyticsResponse; fetchedAt: number }
const l1Cache = new Map<string, L1Entry>()

function l1Key(startDate: string, endDate: string) {
  return `${startDate}:${endDate}`
}

function l1Get(startDate: string, endDate: string): PeriodAnalyticsResponse | null {
  const entry = l1Cache.get(l1Key(startDate, endDate))
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    l1Cache.delete(l1Key(startDate, endDate))
    return null
  }
  return entry.data
}

function l1Set(startDate: string, endDate: string, data: PeriodAnalyticsResponse) {
  l1Cache.set(l1Key(startDate, endDate), { data, fetchedAt: Date.now() })
}

// L2: DB (persistent, survives restarts — requires DATABASE_URL)
async function dbGet(startDate: string, endDate: string): Promise<PeriodAnalyticsResponse | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const { db } = await import('@/lib/db')
    const cutoff = new Date(Date.now() - CACHE_TTL_MS)
    const rows = await db
      .select({ data: analyticsCache.data })
      .from(analyticsCache)
      .where(
        and(
          eq(analyticsCache.startDate, startDate),
          eq(analyticsCache.endDate, endDate),
          eq(analyticsCache.dataType, DB_CACHE_TYPE),
          gt(analyticsCache.createdAt, cutoff)
        )
      )
      .orderBy(analyticsCache.createdAt)
      .limit(1)

    if (rows.length === 0) return null
    return JSON.parse(rows[0].data) as PeriodAnalyticsResponse
  } catch (err) {
    console.warn('[period-analytics] DB cache read failed:', err)
    return null
  }
}

async function dbSet(startDate: string, endDate: string, data: PeriodAnalyticsResponse): Promise<void> {
  if (!process.env.DATABASE_URL) return
  try {
    const { db } = await import('@/lib/db')
    await db.insert(analyticsCache).values({
      startDate,
      endDate,
      dataType: DB_CACHE_TYPE,
      data: JSON.stringify(data),
    })
  } catch (err) {
    console.warn('[period-analytics] DB cache write failed:', err)
  }
}

// ─── Default date range ───────────────────────────────────────────────────────

const getDefaultDateRange = () => {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: PRACTICE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const today = new Date(`${todayStr}T00:00:00`)
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)

  return { startDate: monday.toISOString().slice(0, 10), endDate: todayStr }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { user, unauthorizedResponse } = await requireAuthUser()
  if (!user) return unauthorizedResponse

  const { searchParams } = new URL(request.url)
  const defaults = getDefaultDateRange()

  const parsed = PeriodAnalyticsParamsSchema.safeParse({
    startDate: searchParams.get('startDate') ?? defaults.startDate,
    endDate: searchParams.get('endDate') ?? defaults.endDate,
    refresh: searchParams.get('refresh'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { startDate, endDate, refresh } = parsed.data

  if (!refresh) {
    // L1 check
    const l1 = l1Get(startDate, endDate)
    if (l1) {
      console.log(`[period-analytics] L1 cache hit: ${startDate}–${endDate}`)
      return NextResponse.json({ success: true, data: l1, cached: true })
    }

    // L2 check
    const l2 = await dbGet(startDate, endDate)
    if (l2) {
      console.log(`[period-analytics] L2 (DB) cache hit: ${startDate}–${endDate}`)
      l1Set(startDate, endDate, l2) // promote to L1
      return NextResponse.json({ success: true, data: l2, cached: true })
    }
  }

  // Cache miss — fetch from Greyfinch
  const params = { locationIds: [...DASHBOARD_LOCATION_IDS], startDate, endDate }
  console.log(`[period-analytics] Fetching from Greyfinch: ${startDate}–${endDate}`)

  const [greyfinchData, greyfinchError] = await tryCatch(
    Promise.all([
      fetchReport('PATIENT_REFERRALS', params),
      fetchPatientFunnel(startDate, endDate, DASHBOARD_LOCATION_IDS),
    ])
  )

  if (greyfinchError) {
    console.error('[period-analytics] Greyfinch error:', greyfinchError)
    return NextResponse.json(
      { success: false, error: greyfinchError.message },
      { status: 502 }
    )
  }

  const [referralsData, patientFunnelRows] = greyfinchData
  const referralRows = parsePatientReferrals(referralsData, startDate, endDate)

  const responseData: PeriodAnalyticsResponse = {
    locations: buildPeriodData(referralRows, patientFunnelRows),
    trends: { weekly: [] },
  }

  // Write to both cache layers (fire-and-forget for DB)
  l1Set(startDate, endDate, responseData)
  void dbSet(startDate, endDate, responseData)

  console.log(`[period-analytics] Done. ${responseData.locations.length} locations.`)
  return NextResponse.json({ success: true, data: responseData, cached: false })
}
