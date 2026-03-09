// Greyfinch Report Parsers — confirmed column names via Postman, March 2026
// All column names verified against live S3 report data.

import type { ReportData } from './greyfinch-reports'

// ─── Shared helper ────────────────────────────────────────────────────────────

function rowToObject(columns: string[], row: unknown[]): Record<string, unknown> {
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
      avgCaseFee: num(r.avgCaseFee),
      newPatExams: num(r.newPatExams),
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

export interface PatientReferralsSummary {
  location: string
  totalNewPatients: number
  referralBreakdown: Record<ReferralType, number>
  totalNoShowCancellations: number
}

export function parsePatientReferrals(data: ReportData): PatientReferralsSummary[] {
  // Group rows by location
  const byLocation = new Map<string, typeof data.values>()
  for (const row of data.values) {
    const r = rowToObject(data.columns, row)
    const loc = str(r.location)
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
    let totalNoShow = 0

    for (const row of rows) {
      const r = rowToObject(data.columns, row)
      const referralType = str(r.referralType) as ReferralType
      if (referralType in breakdown) {
        breakdown[referralType]++
      } else {
        breakdown.Other++
      }
      totalNoShow += num(r.noShowCancellationAppointmentTotal)
    }

    return {
      location,
      totalNewPatients: rows.length,
      referralBreakdown: breakdown,
      totalNoShowCancellations: totalNoShow,
    }
  })
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
  avgCaseFee: number
  newPatExams: number
  // Referrals
  referralBreakdown: Record<ReferralType, number>
  totalNoShowCancellations: number
}

export function mergePeriodData(
  monitorRows: PracticeMonitorRow[],
  referralRows: PatientReferralsSummary[]
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
      avgCaseFee: m.avgCaseFee,
      newPatExams: m.newPatExams,
      referralBreakdown: refs?.referralBreakdown ?? {
        Professional: 0,
        'Family Referral': 0,
        Online: 0,
        Other: 0,
      },
      totalNoShowCancellations: refs?.totalNoShowCancellations ?? 0,
    }
  })
}
