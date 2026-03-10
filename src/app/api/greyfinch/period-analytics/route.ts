// GET /api/greyfinch/period-analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&locationIds=uuid1,uuid2
// Runs PRACTICE_MONITOR + PATIENT_REFERRALS + PRACTICE_EFFICIENCY in parallel,
// returns merged per-location data plus weekly appointment trends.
// Cached in-memory for 1 hour per date range. Bust with ?refresh=true.

import { NextRequest, NextResponse } from 'next/server'
import { fetchReport } from '@/lib/services/greyfinch-reports'
import {
  parsePracticeEfficiency,
  parsePracticeMonitor,
  parsePatientReferrals,
  mergePeriodData,
  type LocationPeriodData,
} from '@/lib/services/greyfinch-report-parsers'
import { DASHBOARD_LOCATION_IDS } from '@/lib/services/greyfinch-queries'

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  data: PeriodAnalyticsResponse
  fetchedAt: number
}

interface WeeklyTrendPoint {
  week: string
  gilbert: number
  phoenix: number
  total: number
}

interface PeriodAnalyticsResponse {
  locations: LocationPeriodData[]
  trends: {
    weekly: WeeklyTrendPoint[]
  }
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function getCacheKey(startDate: string, endDate: string, locationIds: string[]): string {
  return `${startDate}:${endDate}:${[...locationIds].sort().join(',')}`
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const locationIdsParam = searchParams.get('locationIds')
  const refresh = searchParams.get('refresh') === 'true'

  if (!startDate || !endDate) {
    return NextResponse.json(
      { success: false, error: 'startDate and endDate are required' },
      { status: 400 }
    )
  }

  // Always use the two active dashboard locations — filter any caller-supplied IDs to this set
  const requestedIds = locationIdsParam
    ? locationIdsParam.split(',').filter(Boolean)
    : [...DASHBOARD_LOCATION_IDS]
  const locationIds = requestedIds.filter((id) =>
    (DASHBOARD_LOCATION_IDS as readonly string[]).includes(id)
  )
  // If caller passed only unknown IDs, fall back to both dashboard locations
  const effectiveLocationIds = locationIds.length > 0 ? locationIds : [...DASHBOARD_LOCATION_IDS]

  const cacheKey = getCacheKey(startDate, endDate, effectiveLocationIds)

  if (!refresh) {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      console.log(`[period-analytics] Cache hit: ${cacheKey}`)
      return NextResponse.json({ success: true, data: cached.data, cached: true })
    }
  }

  const params = { locationIds: effectiveLocationIds, startDate, endDate }

  try {
    console.log(`[period-analytics] Fetching reports for ${startDate}–${endDate}`)
    const [monitorData, referralsData, efficiencyData] = await Promise.all([
      fetchReport('PRACTICE_MONITOR', params),
      fetchReport('PATIENT_REFERRALS', params),
      fetchReport('PRACTICE_EFFICIENCY', params),
    ])

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
    const merged = mergePeriodData(monitorRows, referralRows, appointmentsByLocation)
    const responseData: PeriodAnalyticsResponse = {
      locations: merged,
      trends: {
        weekly: weeklyTrends,
      },
    }

    cache.set(cacheKey, { data: responseData, fetchedAt: Date.now() })
    console.log(`[period-analytics] Done. ${merged.length} locations.`)

    return NextResponse.json({ success: true, data: responseData, cached: false })
  } catch (error) {
    console.error('[period-analytics] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    )
  }
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
