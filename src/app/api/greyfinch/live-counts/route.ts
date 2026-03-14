import { NextRequest, NextResponse } from 'next/server'
import { startOfWeek, format } from 'date-fns'
import { fetchReport } from '@/lib/services/greyfinch/reports'
import { parsePracticeEfficiency, parsePracticeMonitor } from '@/lib/services/greyfinch/parsers'
import { DASHBOARD_LOCATION_IDS, PRACTICE_TZ } from '@/lib/services/greyfinch/queries'
import { LiveCountsParamsSchema } from '@/lib/services/greyfinch/types'
import { requireAuthUser } from '@/lib/require-auth-user'
import { tryCatch } from '@/lib/try-catch'

/** Returns a plain Date whose local fields (getFullYear etc.) reflect wall-clock time in the given IANA timezone. */
function nowInTZ(tz: string): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  )
  return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
}

interface LocationCounts {
  activeTxPatients: number
  appointments: number
  newPatientsCreated: number
  caseStarts: number
}

export const GET = async (request: NextRequest) => {

  const { user, unauthorizedResponse } = await requireAuthUser()
  if (!user) return unauthorizedResponse

  const { searchParams } = new URL(request.url)

  const params = LiveCountsParamsSchema.safeParse({
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
  })
  if (!params.success) {
    return NextResponse.json(
      { success: false, error: params.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const now = nowInTZ(PRACTICE_TZ)
  const startDate = params.data.startDate ?? format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const endDate = params.data.endDate ?? format(now, 'yyyy-MM-dd')

  const [reports, err] = await tryCatch(
    Promise.all([
      fetchReport('PRACTICE_MONITOR', { locationIds: [...DASHBOARD_LOCATION_IDS], startDate, endDate }),
      fetchReport('PRACTICE_EFFICIENCY', { locationIds: [...DASHBOARD_LOCATION_IDS], startDate, endDate }),
    ])
  )
  if (err) {
    console.error('[live-counts] Error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 502 }
    )
  }

  const [practiceMonitorData, practiceEfficiencyData] = reports
  const monitorRows = parsePracticeMonitor(practiceMonitorData)
  const efficiencyRows = parsePracticeEfficiency(practiceEfficiencyData)

  // Build location name → locationId map from efficiency rows (which carry both fields)
  const nameToId = new Map<string, string>()
  for (const row of efficiencyRows) {
    if (row.locationId && row.location) nameToId.set(row.location, row.locationId)
  }

  // Aggregate completed appointments per locationId
  const apptsByLocationId: Record<string, number> = {}
  for (const row of efficiencyRows) {
    if (row.appointmentBookingId && row.completedAppointment && row.locationId) {
      apptsByLocationId[row.locationId] = (apptsByLocationId[row.locationId] ?? 0) + 1
    }
  }

  // Build per-location counts keyed by locationId
  const byLocation: Record<string, LocationCounts> = {}
  for (const row of monitorRows) {
    const locId = nameToId.get(row.location) ?? row.location
    byLocation[locId] = {
      activeTxPatients: row.activeTxPatients,
      newPatientsCreated: row.newPatientsCreated,
      caseStarts: row.caseStarts,
      appointments: apptsByLocationId[locId] ?? 0,
    }
  }

  // Catch any locations that only appear in efficiency (no monitor row)
  for (const [locId, count] of Object.entries(apptsByLocationId)) {
    if (!byLocation[locId]) {
      byLocation[locId] = { activeTxPatients: 0, newPatientsCreated: 0, caseStarts: 0, appointments: count }
    }
  }

  return NextResponse.json({ success: true, byLocation, startDate, endDate })
}
