import { greyfinchService } from './client'
import { GQL_PATIENTS_FOR_PERIOD_WITH_SCHEDULING_STATUS, PRACTICE_TZ } from './queries'

interface GreyfinchBooking {
  id: string
  startTime: string | null
  localStartDate: string | null
  localStartTime: string | null
  checkInTime: string | null
  seatTime: string | null
}

interface GreyfinchAppointment {
  id: string
  createdAt: string
  type: {
    id: string
    name: string
  } | null
  bookings: GreyfinchBooking[] | null
}

interface GreyfinchPatient {
  id: string
  createdAt: string
  primaryLocation: {
    id: string
    name: string
  } | null
  appointments: GreyfinchAppointment[] | null
}

interface PatientsForPeriodResponse {
  patients?: GreyfinchPatient[]
}

export interface PatientFunnelSummary {
  locationId: string
  location: string
  npl: number
  npe: number
  npeKept: number
  npeNoShow: number
  npeScheduledRate: number
  npeKeptRate: number
  npeNoShowRate: number
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(Date.UTC(year, month - 1, day + days))
  return value.toISOString().slice(0, 10)
}

function getUtcBoundaryForPracticeDate(date: string): string {
  if (PRACTICE_TZ !== 'America/Phoenix') {
    throw new Error(`Unsupported Greyfinch practice timezone: ${PRACTICE_TZ}`)
  }
  return `${date}T07:00:00.000Z`
}

function summarizePatientFunnel(patients: GreyfinchPatient[]): PatientFunnelSummary[] {
  const byLocation = new Map<string, PatientFunnelSummary>()

  for (const patient of patients) {
    const locationId = patient.primaryLocation?.id ?? 'unknown'
    const location = patient.primaryLocation?.name ?? 'Unknown'
    const current = byLocation.get(locationId) ?? {
      locationId,
      location,
      npl: 0,
      npe: 0,
      npeKept: 0,
      npeNoShow: 0,
      npeScheduledRate: 0,
      npeKeptRate: 0,
      npeNoShowRate: 0,
    }

    const hasScheduledBooking = patient.appointments?.some((appointment) =>
      appointment.bookings?.some((booking) => Boolean(booking.startTime))
    ) ?? false
    const hasCheckedInBooking = patient.appointments?.some((appointment) =>
      appointment.bookings?.some((booking) => Boolean(booking.checkInTime))
    ) ?? false

    current.npl += 1
    if (hasScheduledBooking) current.npe += 1
    if (hasCheckedInBooking) current.npeKept += 1
    byLocation.set(locationId, current)
  }

  return Array.from(byLocation.values()).map((summary) => {
    const npeNoShow = Math.max(0, summary.npe - summary.npeKept)
    return {
      ...summary,
      npeNoShow,
      npeScheduledRate: summary.npl > 0 ? (summary.npe / summary.npl) * 100 : 0,
      npeKeptRate: summary.npl > 0 ? (summary.npeKept / summary.npl) * 100 : 0,
      npeNoShowRate: summary.npe > 0 ? (npeNoShow / summary.npe) * 100 : 0,
    }
  })
}

export async function fetchPatientFunnel(
  startDate: string,
  endDate: string,
  locationIds: readonly string[],
): Promise<PatientFunnelSummary[]> {
  const data = await greyfinchService.makeGraphQLRequest(
    GQL_PATIENTS_FOR_PERIOD_WITH_SCHEDULING_STATUS,
    {
      createdAtGte: getUtcBoundaryForPracticeDate(startDate),
      createdAtLt: getUtcBoundaryForPracticeDate(addDays(endDate, 1)),
      locationIds: [...locationIds],
    }
  ) as PatientsForPeriodResponse

  return summarizePatientFunnel(data.patients ?? [])
}
