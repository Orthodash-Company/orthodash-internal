// GET /api/greyfinch/period-analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Runs PRACTICE_MONITOR + PATIENT_REFERRALS + PRACTICE_EFFICIENCY in parallel,
// returns merged per-location data plus weekly appointment trends.
// Locations are always filtered in memory to DASHBOARD_LOCATION_IDS.
// Cached in-memory for 1 hour per date range. Bust with ?refresh=true.

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/require-auth-user'
import { tryCatch } from '@/lib/try-catch'
import { fetchReport } from '@/lib/services/greyfinch/reports'
import { DASHBOARD_LOCATION_IDS, PRACTICE_TZ } from '@/lib/services/greyfinch/queries'
import { PeriodAnalyticsParamsSchema } from '@/lib/services/greyfinch/types'
import {
  parsePracticeEfficiency,
  parsePracticeMonitor,
  parsePatientReferrals,
  mergePeriodData,
  type WeeklyTrendPoint,
  type PeriodAnalyticsResponse,
} from '@/lib/services/greyfinch/parsers'

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  data: PeriodAnalyticsResponse
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function getCacheKey(startDate: string, endDate: string): string {
  return `${startDate}:${endDate}`
}

// Returns { startDate, endDate } for the current week (Mon → today) in practice timezone,
// matching the default range used by PracticeSnapshot.
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

  const startDate = monday.toISOString().slice(0, 10)
  
  return { startDate, endDate: todayStr }
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

  const { startDate, endDate, refresh } = parsed.data;

  const cacheKey = getCacheKey(startDate, endDate)

  if (!refresh) {

    const cached = cache.get(cacheKey)

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {

      console.log(`Cache found: ${cacheKey}`)

      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      })
    }
  }

  const params = {
    locationIds: [...DASHBOARD_LOCATION_IDS],
    startDate,
    endDate
  }

  console.log(`[period-analytics] Fetching reports for ${startDate}–${endDate}`)

  const [reports, reportsError] = await tryCatch(
    Promise.all([
      fetchReport('PRACTICE_MONITOR', params),
      fetchReport('PATIENT_REFERRALS', params),
      fetchReport('PRACTICE_EFFICIENCY', params),
    ])
  )

  if (reportsError) {
    console.error('[period-analytics] Error:', reportsError)
    return NextResponse.json(
      { success: false, error: reportsError.message },
      { status: 502 }
    )
  }

  const [monitorData, referralsData, efficiencyData] = reports

  const monitorRows = parsePracticeMonitor(monitorData)
  const referralRows = parsePatientReferrals(referralsData)
  const efficiencyRows = parsePracticeEfficiency(efficiencyData)

  const appointmentsByLocation = efficiencyRows.reduce<Map<string, number>>((acc, row) => {
    if (!row.appointmentBookingId || !row.completedAppointment) {
      return acc
    }
    acc.set(row.location, (acc.get(row.location) ?? 0) + 1)
    return acc
  }, new Map())

  const weeklyTrends = buildWeeklyTrends(efficiencyRows)
  const allLocations = mergePeriodData(monitorRows, referralRows, appointmentsByLocation)

  const responseData: PeriodAnalyticsResponse = {
    locations: allLocations,
    trends: {
      weekly: weeklyTrends,
    },
  }

  cache.set(cacheKey, { data: responseData, fetchedAt: Date.now() })
  console.log(`[period-analytics] Done. ${allLocations.length} locations.`)

  return NextResponse.json({ success: true, data: responseData, cached: false })
}

function buildWeeklyTrends(efficiencyRows: ReturnType<typeof parsePracticeEfficiency>): WeeklyTrendPoint[] {
  const weeklyMap = new Map<string, WeeklyTrendPoint>()

  for (const row of efficiencyRows) {
    if (!row.appointmentBookingId || !row.completedAppointment || !row.apptDate) {
      continue
    }

    const week = formatWeekLabel(row.apptDate)
    const existing = weeklyMap.get(week) ?? { week, gilbert: 0, phoenix: 0, total: 0 }
    const locationName = row.location.toLowerCase()

    if (locationName.includes('gilbert')) {
      existing.gilbert += 1
    } else {
      existing.phoenix += 1
    }
    existing.total += 1
    weeklyMap.set(week, existing)
  }

  return Array.from(weeklyMap.values()).sort((a, b) => {
    const aDate = new Date(a.week)
    const bDate = new Date(b.week)
    return aDate.getTime() - bDate.getTime()
  })
}

function formatWeekLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  const startOfWeek = new Date(date)
  const dayOfWeek = startOfWeek.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startOfWeek.setDate(startOfWeek.getDate() + diff)
  const year = startOfWeek.getFullYear()
  const month = String(startOfWeek.getMonth() + 1).padStart(2, '0')
  const day = String(startOfWeek.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
