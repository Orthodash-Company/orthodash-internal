// Greyfinch Report Parsers — confirmed column names via Postman, March 2026
// All column names verified against live S3 report data.

import type { ReportData } from './reports'

// ─── Shared helper ────────────────────────────────────────────────────────────

const rowToObject = (columns: string[], row: unknown[]) => {

  const obj: Record<string, unknown> = {}

  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = row[i]
  }

  return obj
}

function num(value: unknown): number {
  const n = Number(value)
  return isNaN(n) ? 0 : n
}

function str(value: unknown): string {
  return value == null ? '' : String(value)
}



// ─── PATIENT_REFERRALS ────────────────────────────────────────────────────────
// Confirmed columns (13 total — row per new patient):
// location, patient, patientInternalId, patientName, createdDate,
// treatmentStatus, referralType, referralName, grossProduction,
// discountsWriteOff, netProduction, noShowCancellationAppointmentTotal,
// lastCompletedAppointmentTemplate
//
// Confirmed Greyfinch referralType values (March 2026):
//   Professional, Family Referral, Online, Other, Patient

// Appointment template values that count as an NPE Kept (per Lauren Kim, Mar 2026)
// Confirmed present in Patient Referrals report "Last Completed Appointment Template" column:
const NPE_KEPT_APPT_TYPES = new Set([
  'NP- NP ADULT',
  'NP- RECORDS',
  'NP-CHAIRSIDE',
  'NP-NP CHILD',
  'NP-NP STAFF',
  'NP-NP TMJ',
  'NP-NPTRANAD',
  'NP-NPTRANCHILD'
])

// treatmentStatus values that mean an exam has been scheduled (NPE)
// Confirmed from Greyfinch UI: human-readable strings, not short codes.
const NPE_STATUSES = new Set([
  'Exam/Child',
  'Exam/Adult',
])

export interface PatientReferralRow {
  location: string
  createdDate: string
  treatmentStatus: string
  referralType: string
  referralName: string
  lastCompletedAppointmentTemplate: string
  grossProduction: number
  netProduction: number
  noShowCancellationAppointmentTotal: number
}

export interface PatientReferralsSummary {
  location: string
  totalNewPatients: number
  grossProduction: number
  netProduction: number
  // NPL / NPE funnel
  npl: number
  npe: number
  npeKept: number
  npeNoShow: number
  npeScheduledRate: number
  npeKeptRate: number
  npeNoShowRate: number
  // Legacy counts
  leads: number
  bookings: number
  // Raw referralType breakdown (keys = Greyfinch referralType values)
  referralBreakdown: Record<string, number>
  // Sub-source breakdown (referralName when referralType = Professional)
  professionalSubSources: Record<string, number>
  totalNoShowCancellations: number
  conversionBreakdown: Record<string, number>
}

export function parsePatientReferralRows(data: ReportData): PatientReferralRow[] {
  return data.values.map((row) => {
    const r = rowToObject(data.columns, row)
    return {
      location: str(r.location),
      createdDate: str(r.createdDate),
      treatmentStatus: str(r.treatmentStatus),
      referralType: str(r.referralType),
      referralName: str(r.referralName),
      lastCompletedAppointmentTemplate: str(r.lastCompletedAppointmentTemplate),
      grossProduction: num(r.grossProduction),
      netProduction: num(r.netProduction),
      noShowCancellationAppointmentTotal: num(r.noShowCancellationAppointmentTotal),
    }
  })
}

export function parsePatientReferrals(
  data: ReportData,
  periodStart?: string,
  periodEnd?: string,
): PatientReferralsSummary[] {
  const referralRows = parsePatientReferralRows(data)

  // Group rows by location
  const byLocation = new Map<string, PatientReferralRow[]>()
  for (const row of referralRows) {
    const loc = row.location
    if (!byLocation.has(loc)) byLocation.set(loc, [])
    byLocation.get(loc)!.push(row)
  }

  return Array.from(byLocation.entries()).map(([location, rows]) => {
    const breakdown: Record<string, number> = {}
    const conversionNumerators: Record<string, number> = {}
    const professionalSubSources: Record<string, number> = {}

    let totalNoShow = 0
    let leads = 0
    let bookings = 0
    let npe = 0
    let npeKept = 0
    let grossProduction = 0
    let netProduction = 0

    for (const row of rows) {
      const rt = row.referralType || 'Unknown'
      breakdown[rt] = (breakdown[rt] ?? 0) + 1

      grossProduction += row.grossProduction
      netProduction += row.netProduction

      if (row.netProduction > 0) {
        conversionNumerators[rt] = (conversionNumerators[rt] ?? 0) + 1
      }

      totalNoShow += row.noShowCancellationAppointmentTotal

      // Legacy lead/booking counts
      if (row.treatmentStatus === 'New Patient Lead') leads++

      const inPeriod = !periodStart || !periodEnd
        || (row.createdDate >= periodStart && row.createdDate <= periodEnd)

      if (inPeriod && NPE_STATUSES.has(row.treatmentStatus)) {
        bookings++
        npe++
      }

      // NPE Kept detection
      if (inPeriod && NPE_KEPT_APPT_TYPES.has(row.lastCompletedAppointmentTemplate)) {
        npeKept++
      }

      // Professional sub-source tracking (referralName when referralType = Professional)
      if (rt === 'Professional' && row.referralName) {
        professionalSubSources[row.referralName] = (professionalSubSources[row.referralName] ?? 0) + 1
      }
    }

    // NPL = patients whose record was created within the period ("Created On" date)
    const npl = periodStart && periodEnd
      ? rows.filter((r) => r.createdDate >= periodStart && r.createdDate <= periodEnd).length
      : rows.length
    const npeNoShow = Math.max(0, npe - npeKept)

    const conversionBreakdown: Record<string, number> = {}
    for (const rt of Object.keys(breakdown)) {
      const total = breakdown[rt]
      conversionBreakdown[rt] = total > 0 ? (conversionNumerators[rt] ?? 0) / total * 100 : 0
    }

    return {
      location,
      totalNewPatients: rows.length,
      grossProduction,
      netProduction,
      npl,
      npe,
      npeKept,
      npeNoShow,
      npeScheduledRate: npl > 0 ? (npe / npl) * 100 : 0,
      npeKeptRate: npl > 0 ? (npeKept / npl) * 100 : 0,
      npeNoShowRate: npe > 0 ? (npeNoShow / npe) * 100 : 0,
      leads,
      bookings,
      referralBreakdown: breakdown,
      professionalSubSources,
      totalNoShowCancellations: totalNoShow,
      conversionBreakdown,
    }
  })
}

// ─── API response types ────────────────────────────────────────────────────────

export interface WeeklyTrendPoint {
  week: string
  gilbert: number
  phoenix: number
  total: number
}

export interface PeriodAnalyticsResponse {
  locations: LocationPeriodData[]
  trends: {
    weekly: WeeklyTrendPoint[]
  }
}

// ─── Combined period data per location ───────────────────────────────────────

export interface LocationPeriodData {
  location: string
  // Production (summed from PATIENT_REFERRALS)
  grossProduction: number
  netProduction: number
  // Patient counts
  newPatientsCreated: number
  // Legacy
  leads: number
  bookings: number
  // NPL / NPE funnel
  npl: number
  npe: number
  npeKept: number
  npeNoShow: number
  npeScheduledRate: number
  npeKeptRate: number
  npeNoShowRate: number
  // Raw referralType breakdown (keys = Greyfinch referralType values)
  referralBreakdown: Record<string, number>
  // Sub-sources when referralType = Professional
  professionalSubSources: Record<string, number>
  conversionBreakdown: Record<string, number>
  totalNoShowCancellations: number
}

export function buildPeriodData(
  referralRows: PatientReferralsSummary[],
): LocationPeriodData[] {
  return referralRows.map((refs) => ({
    location: refs.location,
    grossProduction: refs.grossProduction,
    netProduction: refs.netProduction,
    newPatientsCreated: refs.totalNewPatients,
    leads: refs.leads,
    bookings: refs.bookings,
    npl: refs.npl,
    npe: refs.npe,
    npeKept: refs.npeKept,
    npeNoShow: refs.npeNoShow,
    npeScheduledRate: refs.npeScheduledRate,
    npeKeptRate: refs.npeKeptRate,
    npeNoShowRate: refs.npeNoShowRate,
    referralBreakdown: refs.referralBreakdown,
    professionalSubSources: refs.professionalSubSources,
    conversionBreakdown: refs.conversionBreakdown,
    totalNoShowCancellations: refs.totalNoShowCancellations,
  }))
}
