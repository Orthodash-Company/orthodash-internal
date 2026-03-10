// GET /api/greyfinch/live-counts
// Runs PRACTICE_MONITOR for the current year (YTD) to get real patient counts.
// Much more meaningful than the GQL patients/appointmentBookings fields which are capped at 20.
import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'
import { GQL_BASIC_COUNTS, DASHBOARD_LOCATION_IDS } from '@/lib/services/greyfinch-queries'
import { fetchReport } from '@/lib/services/greyfinch-reports'
import { parsePracticeEfficiency, parsePracticeMonitor } from '@/lib/services/greyfinch-report-parsers'

interface LiveCountsData {
  activeTxPatients: number
  locations: number
  newPatExams: number
  leads: number
  newPatientsCreated: number
  caseStarts: number
  startApptCompleted: number
}

export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    const startDate = `${year}-01-01`
    const endDate = `${year}-${month}-${day}`

    const [practiceMonitorData, practiceEfficiencyData, basicCountsResult] = await Promise.all([
      fetchReport('PRACTICE_MONITOR', {
        locationIds: [...DASHBOARD_LOCATION_IDS],
        startDate,
        endDate,
      }),
      fetchReport('PRACTICE_EFFICIENCY', {
        locationIds: [...DASHBOARD_LOCATION_IDS],
        startDate,
        endDate,
      }),
      greyfinchService.makeGraphQLRequest(GQL_BASIC_COUNTS),
    ])

    const rows = parsePracticeMonitor(practiceMonitorData)
    const efficiencyRows = parsePracticeEfficiency(practiceEfficiencyData)
    const completedAppointments = efficiencyRows.filter(
      (row) => row.appointmentBookingId && row.completedAppointment
    ).length
    const totalLeads = Array.isArray(basicCountsResult?.leads)
      ? (basicCountsResult.leads as unknown[]).length
      : 0

    const totals = rows.reduce<LiveCountsData>(
      (acc, row) => ({
        activeTxPatients: acc.activeTxPatients + row.activeTxPatients,
        locations: acc.locations + 1,
        newPatExams: acc.newPatExams + row.newPatExams,
        leads: acc.leads,
        newPatientsCreated: acc.newPatientsCreated + row.newPatientsCreated,
        caseStarts: acc.caseStarts + row.caseStarts,
        startApptCompleted: acc.startApptCompleted + row.startApptCompleted,
      }),
      {
        activeTxPatients: 0,
        locations: 0,
        newPatExams: completedAppointments,
        leads: totalLeads,
        newPatientsCreated: 0,
        caseStarts: 0,
        startApptCompleted: 0,
      }
    )

    return NextResponse.json({ success: true, data: totals })
  } catch (error) {
    console.error('[live-counts] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    )
  }
}
