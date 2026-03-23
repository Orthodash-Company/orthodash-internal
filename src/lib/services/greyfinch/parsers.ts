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
//   Professional → DDS (sub-source = referralName = individual doctor/practice)
//   Family Referral → Family (or Friend — TODO: confirm referralName patterns)
//   Online → Online (sub-source = referralName e.g. "Ads", "Google")
//   Other → 7UP / Community & Events (routed by referralName)
//   Patient → Friend (a current patient referring someone)

// ─── 6-bucket referral type ───────────────────────────────────────────────────

export type ReferralBucket = 'DDS' | 'Family' | 'Friend' | 'SevenUP' | 'CommunityAndEvents' | 'Online'

export const REFERRAL_BUCKET_LABELS: Record<ReferralBucket, string> = {
  DDS: 'DDS',
  Family: 'Family',
  Friend: 'Friend',
  SevenUP: '7UP',
  CommunityAndEvents: 'Community & Events',
  Online: 'Online',
}

export const ALL_REFERRAL_BUCKETS: ReferralBucket[] = [
  'DDS', 'Family', 'Friend', 'SevenUP', 'CommunityAndEvents', 'Online',
]

// Appointment template values that count as an NPE Kept (confirmed from Greyfinch UI, Mar 2026)
const NPE_KEPT_APPT_TYPES = new Set([
  'NP- NP ADULT',
  'NP-NP CHILD',
])

// treatmentStatus values that mean an exam has been scheduled (NPE)
// Confirmed from Greyfinch UI: human-readable strings, not short codes.
const NPE_STATUSES = new Set([
  'Exam/Child',
  'Exam/Adult',
])

function normalizeReferralBucket(referralType: string, referralName: string): ReferralBucket {
  const rn = referralName.toLowerCase()

  switch (referralType) {
    case 'Professional':
      return 'DDS'
    case 'Online':
      return 'Online'
    case 'Patient':
      // A current patient referring someone = Friend referral
      return 'Friend'
    case 'Family Referral':
      // Confirmed referralName values (Mar 2026): "Campaign 7UP" → SevenUP, "Sibling or Parent" / "Extended Family" → Family.
      // No "Friend" sub-value under Family Referral — Patient type handles Friend bucket.
      if (rn.includes('7up') || rn.includes('campaign 7')) return 'SevenUP'
      return 'Family'
    case 'Other': {
      if (rn.includes('7up') || rn === '7 up' || rn === '7up') return 'SevenUP'
      if (
        rn.includes('community') ||
        rn.includes('event') ||
        rn.includes('school') ||
        rn.includes('concert') ||
        rn.includes('fair') ||
        rn.includes('outreach')
      )
        return 'CommunityAndEvents'
      // Unknown "Other" — default to CommunityAndEvents until confirmed
      return 'CommunityAndEvents'
    }
    default:
      return 'Online'
  }
}

export interface PatientReferralRow {
  location: string
  createdDate: string
  treatmentStatus: string
  referralBucket: ReferralBucket
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
  npl: number       // All new patient leads (= totalNewPatients, pulled by createdDate)
  npe: number       // Leads with exam scheduled (EXA/EXC status)
  npeKept: number   // Leads who kept their NP appointment
  npeNoShow: number // npe - npeKept
  npeScheduledRate: number // npe / npl * 100
  npeKeptRate: number      // npeKept / npl * 100
  npeNoShowRate: number    // npeNoShow / npe * 100
  // Legacy counts (kept for backward compat)
  leads: number
  bookings: number
  // 6-bucket referral breakdown
  referralBreakdown: Record<ReferralBucket, number>
  // DDS sub-source breakdown (referralName when bucket = DDS)
  ddsSubSources: Record<string, number>
  totalNoShowCancellations: number
  conversionBreakdown: Record<ReferralBucket, number>
}

export function parsePatientReferralRows(data: ReportData): PatientReferralRow[] {
  return data.values.map((row) => {
    const r = rowToObject(data.columns, row)
    const referralType = str(r.referralType)
    const referralName = str(r.referralName)
    return {
      location: str(r.location),
      createdDate: str(r.createdDate),
      treatmentStatus: str(r.treatmentStatus),
      referralBucket: normalizeReferralBucket(referralType, referralName),
      referralName,
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
    const emptyBuckets = (): Record<ReferralBucket, number> => ({
      DDS: 0,
      Family: 0,
      Friend: 0,
      SevenUP: 0,
      CommunityAndEvents: 0,
      Online: 0,
    })

    const breakdown = emptyBuckets()
    const conversionNumerators = emptyBuckets()
    const ddsSubSources: Record<string, number> = {}

    let totalNoShow = 0
    let leads = 0
    let bookings = 0
    let npe = 0
    let npeKept = 0
    let grossProduction = 0
    let netProduction = 0

    for (const row of rows) {
      breakdown[row.referralBucket]++

      grossProduction += row.grossProduction
      netProduction += row.netProduction

      if (row.netProduction > 0) {
        conversionNumerators[row.referralBucket]++
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

      // DDS sub-source tracking
      if (row.referralBucket === 'DDS' && row.referralName) {
        ddsSubSources[row.referralName] = (ddsSubSources[row.referralName] ?? 0) + 1
      }
    }

    // NPL = patients whose record was created within the period ("Created On" date)
    const npl = periodStart && periodEnd
      ? rows.filter((r) => r.createdDate >= periodStart && r.createdDate <= periodEnd).length
      : rows.length
    const npeNoShow = Math.max(0, npe - npeKept)

    const conversionBreakdown = (Object.keys(breakdown) as ReferralBucket[]).reduce<Record<ReferralBucket, number>>(
      (acc, bucket) => {
        const total = breakdown[bucket]
        acc[bucket] = total > 0 ? (conversionNumerators[bucket] / total) * 100 : 0
        return acc
      },
      emptyBuckets()
    )

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
      ddsSubSources,
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
  // 6-bucket referrals
  referralBreakdown: Record<ReferralBucket, number>
  ddsSubSources: Record<string, number>
  conversionBreakdown: Record<ReferralBucket, number>
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
    ddsSubSources: refs.ddsSubSources,
    conversionBreakdown: refs.conversionBreakdown,
    totalNoShowCancellations: refs.totalNoShowCancellations,
  }))
}
