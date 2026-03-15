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

// ─── PRACTICE_MONITOR ─────────────────────────────────────────────────────────
// Confirmed columns (34 total):
// location, grossProduction, grossReceipts, recPercent, netProductionAdjustments,
// prodAdjPercent, netReceiptsAdjustments, recAdjPercent, netProduction, netCollection,
// otherCharges, otherDiscounts, accountsReceivable, ratio, netArRatio, negativeAr,
// patientAccounts, patients30Plus, pats30PlusPercent, patients60Plus, pats60PlusPercent,
// insuranceAccounts, ins30Plus, ins30PlusPercent, ins60Plus, ins60PlusPercent,
// newPatExams, caseStarts, additionalPhStarts, startApptCompleted, phStartsPercent,
// avgCaseFee, newPatientsCreated, activeTxPatients

export interface PracticeMonitorRow {
  location: string
  grossProduction: number
  netProduction: number
  netCollection: number
  accountsReceivable: number
  newPatientsCreated: number
  activeTxPatients: number
  caseStarts: number
  startApptCompleted: number
  avgCaseFee: number
  newPatExams: number
}

export function parsePracticeMonitor(data: ReportData): PracticeMonitorRow[] {

  return data.values.map((row) => {
    const r = rowToObject(data.columns, row)
    return {
      location: str(r.location),
      grossProduction: num(r.grossProduction),
      netProduction: num(r.netProduction),
      netCollection: num(r.netCollection),
      accountsReceivable: num(r.accountsReceivable),
      newPatientsCreated: num(r.newPatientsCreated),
      activeTxPatients: num(r.activeTxPatients),
      caseStarts: num(r.caseStarts),
      startApptCompleted: num(r.startApptCompleted),
      avgCaseFee: num(r.avgCaseFee),
      newPatExams: num(r.newPatExams),
    }
  })
}

// ─── PRACTICE_EFFICIENCY ─────────────────────────────────────────────────────
// Confirmed columns (22 total):
// locationId, location, startDate, endDate, patientHumanId, patientId, patientName,
// completedAppointment, apptTypeLength, isEmergency, assistant, apptDate, apptStart,
// patientCheckIn, patientCheckOut, totalLength, waitingTime, seatingTime,
// waitingOnDoctor, withDoctor, checkingOutTime, appointmentBookingId

export interface PracticeEfficiencyRow {
  locationId: string
  location: string
  completedAppointment: string
  appointmentBookingId: string
  isEmergency: boolean
  apptDate: string
}

export function parsePracticeEfficiency(data: ReportData): PracticeEfficiencyRow[] {
  return data.values.map((row) => {
    const r = rowToObject(data.columns, row)
    return {
      locationId: str(r.locationId),
      location: str(r.location),
      completedAppointment: str(r.completedAppointment),
      appointmentBookingId: str(r.appointmentBookingId),
      isEmergency: Boolean(r.isEmergency),
      apptDate: str(r.apptDate),
    }
  })
}

// ─── PATIENT_REFERRALS ────────────────────────────────────────────────────────
// Confirmed columns (13 total — row per new patient):
// location, patient, patientInternalId, patientName, createdDate,
// treatmentStatus, referralType, referralName, grossProduction,
// discountsWriteOff, netProduction, noShowCancellationAppointmentTotal,
// lastCompletedAppointmentTemplate

export type ReferralType = 'Professional' | 'Family Referral' | 'Online' | 'Other'

export interface PatientReferralRow {
  location: string
  createdDate: string
  treatmentStatus: string
  referralType: ReferralType
  netProduction: number
  noShowCancellationAppointmentTotal: number
}

export interface PatientReferralsSummary {
  location: string
  totalNewPatients: number
  referralBreakdown: Record<ReferralType, number>
  totalNoShowCancellations: number
  conversionBreakdown: Record<ReferralType, number>
}

function normalizeReferralType(value: string): ReferralType {
  if (value === 'Professional' || value === 'Family Referral' || value === 'Online') {
    return value
  }
  return 'Other'
}

// A referral row is treated as "converted" once it shows realized net production.
function isConvertedReferral(netProduction: number): boolean {
  return netProduction > 0
}

export function parsePatientReferralRows(data: ReportData): PatientReferralRow[] {
  return data.values.map((row) => {
    const r = rowToObject(data.columns, row)
    return {
      location: str(r.location),
      createdDate: str(r.createdDate),
      treatmentStatus: str(r.treatmentStatus),
      referralType: normalizeReferralType(str(r.referralType)),
      netProduction: num(r.netProduction),
      noShowCancellationAppointmentTotal: num(r.noShowCancellationAppointmentTotal),
    }
  })
}

export function parsePatientReferrals(data: ReportData): PatientReferralsSummary[] {
  const referralRows = parsePatientReferralRows(data)

  // Group rows by location
  const byLocation = new Map<string, PatientReferralRow[]>()
  for (const row of referralRows) {
    const loc = row.location
    if (!byLocation.has(loc)) byLocation.set(loc, [])
    byLocation.get(loc)!.push(row)
  }

  return Array.from(byLocation.entries()).map(([location, rows]) => {
    const breakdown: Record<ReferralType, number> = {
      Professional: 0,
      'Family Referral': 0,
      Online: 0,
      Other: 0,
    }
    const conversionNumerators: Record<ReferralType, number> = {
      Professional: 0,
      'Family Referral': 0,
      Online: 0,
      Other: 0,
    }
    let totalNoShow = 0

    for (const row of rows) {
      breakdown[row.referralType]++
      if (isConvertedReferral(row.netProduction)) {
        conversionNumerators[row.referralType]++
      }
      totalNoShow += row.noShowCancellationAppointmentTotal
    }

    const conversionBreakdown = (Object.keys(breakdown) as ReferralType[]).reduce<Record<ReferralType, number>>(
      (acc, referralType) => {
        const total = breakdown[referralType]
        acc[referralType] = total > 0 ? (conversionNumerators[referralType] / total) * 100 : 0
        return acc
      },
      {
        Professional: 0,
        'Family Referral': 0,
        Online: 0,
        Other: 0,
      }
    )

    return {
      location,
      totalNewPatients: rows.length,
      referralBreakdown: breakdown,
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
  // Production & collections
  grossProduction: number
  netProduction: number
  netCollection: number
  accountsReceivable: number
  // Patient counts
  activeTxPatients: number
  newPatientsCreated: number
  caseStarts: number
  startApptCompleted: number
  appointments: number
  avgCaseFee: number
  newPatExams: number
  // Referrals
  referralBreakdown: Record<ReferralType, number>
  conversionBreakdown: Record<ReferralType, number>
  totalNoShowCancellations: number
}

export function mergePeriodData(
  monitorRows: PracticeMonitorRow[],
  referralRows: PatientReferralsSummary[],
  appointmentsByLocation: Map<string, number> = new Map()
): LocationPeriodData[] {
  const referralMap = new Map(referralRows.map((r) => [r.location, r]))

  return monitorRows.map((m) => {
    const refs = referralMap.get(m.location)
    return {
      location: m.location,
      grossProduction: m.grossProduction,
      netProduction: m.netProduction,
      netCollection: m.netCollection,
      accountsReceivable: m.accountsReceivable,
      activeTxPatients: m.activeTxPatients,
      newPatientsCreated: refs?.totalNewPatients ?? m.newPatientsCreated,
      caseStarts: m.caseStarts,
      startApptCompleted: m.startApptCompleted,
      appointments: appointmentsByLocation.get(m.location) ?? 0,
      avgCaseFee: m.avgCaseFee,
      newPatExams: m.newPatExams,
      referralBreakdown: refs?.referralBreakdown ?? {
        Professional: 0,
        'Family Referral': 0,
        Online: 0,
        Other: 0,
      },
      conversionBreakdown: refs?.conversionBreakdown ?? {
        Professional: 0,
        'Family Referral': 0,
        Online: 0,
        Other: 0,
      },
      totalNoShowCancellations: refs?.totalNoShowCancellations ?? 0,
    }
  })
}
