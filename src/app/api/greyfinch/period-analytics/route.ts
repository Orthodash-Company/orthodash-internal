// GET /api/greyfinch/period-analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&locationIds=uuid1,uuid2
// Runs PRACTICE_MONITOR + PATIENT_REFERRALS in parallel, returns merged per-location data.
// Cached in-memory for 1 hour per date range. Bust with ?refresh=true.

import { NextRequest, NextResponse } from 'next/server'
import { fetchReport } from '@/lib/services/greyfinch-reports'
import {
  parsePracticeMonitor,
  parsePatientReferrals,
  mergePeriodData,
  type LocationPeriodData,
} from '@/lib/services/greyfinch-report-parsers'
import { DASHBOARD_LOCATION_IDS } from '@/lib/services/greyfinch-queries'

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  data: LocationPeriodData[]
  fetchedAt: number
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
    const [monitorData, referralsData] = await Promise.all([
      fetchReport('PRACTICE_MONITOR', params),
      fetchReport('PATIENT_REFERRALS', params),
    ])

    const monitorRows = parsePracticeMonitor(monitorData)
    const referralRows = parsePatientReferrals(referralsData)
    const merged = mergePeriodData(monitorRows, referralRows)

    cache.set(cacheKey, { data: merged, fetchedAt: Date.now() })
    console.log(`[period-analytics] Done. ${merged.length} locations.`)

    return NextResponse.json({ success: true, data: merged, cached: false })
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
