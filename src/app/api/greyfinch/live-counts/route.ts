// GET /api/greyfinch/live-counts
// Runs PRACTICE_MONITOR for the current year (YTD) to get real patient counts.
// Much more meaningful than the GQL patients/appointmentBookings fields which are capped at 20.
// Cached in-memory for 1 hour — bust with ?refresh=true.

import { NextRequest, NextResponse } from 'next/server'
import { fetchReport } from '@/lib/services/greyfinch-reports'
import { parsePracticeMonitor } from '@/lib/services/greyfinch-report-parsers'
import { DASHBOARD_LOCATION_IDS } from '@/lib/services/greyfinch-queries'

interface LiveCountsData {
  activeTxPatients: number
  newPatientsCreated: number
  caseStarts: number
}

interface Cache {
  data: LiveCountsData
  fetchedAt: number
  year: number
}

let cache: Cache | null = null
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get('refresh') === 'true'
    const now = Date.now()
    const today = new Date()
    const year = today.getFullYear()

    if (!refresh && cache && (now - cache.fetchedAt) < CACHE_TTL_MS && cache.year === year) {
      return NextResponse.json({ success: true, data: cache.data, cached: true })
    }

    const startDate = `${year}-01-01`
    const endDate = today.toISOString().slice(0, 10)

    const reportData = await fetchReport('PRACTICE_MONITOR', {
      locationIds: [...DASHBOARD_LOCATION_IDS],
      startDate,
      endDate,
    })

    const rows = parsePracticeMonitor(reportData)

    const totals = rows.reduce<LiveCountsData>(
      (acc, row) => ({
        activeTxPatients: acc.activeTxPatients + row.activeTxPatients,
        newPatientsCreated: acc.newPatientsCreated + row.newPatientsCreated,
        caseStarts: acc.caseStarts + row.caseStarts,
      }),
      { activeTxPatients: 0, newPatientsCreated: 0, caseStarts: 0 }
    )

    cache = { data: totals, fetchedAt: now, year }

    return NextResponse.json({ success: true, data: totals })
  } catch (error) {
    console.error('[live-counts] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    )
  }
}
