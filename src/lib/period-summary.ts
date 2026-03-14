// Aggregates a PeriodAnalyticsResponse (per-location rows) into a single
// summary object consumed by PeriodColumn, EnhancedAIAnalysis, and PDFReportGenerator.

import type { PeriodAnalyticsResponse } from '@/lib/services/greyfinch/parsers'

type LocationBucket = {
  patients: number
  appointments: number
  leads: number
  bookings: number
  revenue: number
  production: number
  netProduction: number
  acquisitionCosts: number
}

const emptyBucket = (): LocationBucket => ({
  patients: 0,
  appointments: 0,
  leads: 0,
  bookings: 0,
  revenue: 0,
  production: 0,
  netProduction: 0,
  acquisitionCosts: 0,
})

export function buildPeriodSummary(periodAnalytics: PeriodAnalyticsResponse | null | undefined) {
  const locationRows = Array.isArray(periodAnalytics?.locations) ? periodAnalytics.locations : null

  if (!locationRows || locationRows.length === 0) return null

  let activeTxPatients = 0,
    newPatientsCreated = 0,
    netProduction = 0
  let grossProduction = 0,
    netCollection = 0
  let professional = 0,
    familyReferral = 0,
    online = 0,
    noShowCancellations = 0
  let appointments = 0,
    bookings = 0
  let weightedDigitalConversion = 0,
    weightedProfessionalConversion = 0,
    weightedDirectConversion = 0

  const locationData = {
    gilbert: emptyBucket(),
    phoenix: emptyBucket(),
  }

  for (const loc of locationRows) {
    activeTxPatients += loc.activeTxPatients
    newPatientsCreated += loc.newPatientsCreated
    netProduction += loc.netProduction
    grossProduction += loc.grossProduction
    netCollection += loc.netCollection
    appointments += loc.appointments
    bookings += loc.startApptCompleted
    professional += loc.referralBreakdown?.Professional ?? 0
    familyReferral += loc.referralBreakdown?.['Family Referral'] ?? 0
    online += loc.referralBreakdown?.Online ?? 0
    noShowCancellations += loc.totalNoShowCancellations
    weightedProfessionalConversion +=
      (loc.conversionBreakdown?.Professional ?? 0) * (loc.referralBreakdown?.Professional ?? 0)
    weightedDirectConversion +=
      (loc.conversionBreakdown?.['Family Referral'] ?? 0) *
      (loc.referralBreakdown?.['Family Referral'] ?? 0)
    weightedDigitalConversion +=
      (loc.conversionBreakdown?.Online ?? 0) * (loc.referralBreakdown?.Online ?? 0)

    const bucket = String(loc.location).toLowerCase().includes('gilbert')
      ? locationData.gilbert
      : locationData.phoenix

    bucket.patients += loc.activeTxPatients
    bucket.appointments += loc.appointments
    bucket.leads += loc.newPatientsCreated
    bucket.bookings += loc.startApptCompleted
    bucket.revenue += loc.netCollection
    bucket.production += loc.grossProduction
    bucket.netProduction += loc.netProduction
  }

  return {
    patients: activeTxPatients,
    appointments,
    leads: newPatientsCreated,
    locations: locationRows.length,
    bookings,
    revenue: netCollection,
    production: grossProduction,
    netProduction,
    acquisitionCosts: 0,
    avgNetProduction: activeTxPatients > 0 ? netProduction / activeTxPatients : 0,
    avgAcquisitionCost: 0,
    noShowRate: activeTxPatients > 0 ? (noShowCancellations / activeTxPatients) * 100 : 0,
    referralSources: { professional, digital: online, direct: familyReferral },
    conversionRates: {
      digital: online > 0 ? weightedDigitalConversion / online : 0,
      professional: professional > 0 ? weightedProfessionalConversion / professional : 0,
      direct: familyReferral > 0 ? weightedDirectConversion / familyReferral : 0,
    },
    trends: { weekly: periodAnalytics?.trends?.weekly ?? [] },
    locationData,
  }
}

export type PeriodSummary = ReturnType<typeof buildPeriodSummary>

export interface PeriodQuery {
  data: PeriodSummary
  isLoading: boolean
  error: string | null
}
