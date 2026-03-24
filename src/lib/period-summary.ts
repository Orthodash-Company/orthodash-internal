// Aggregates a PeriodAnalyticsResponse (per-location rows) into a single
// summary object consumed by PeriodColumn, EnhancedAIAnalysis, and PDFReportGenerator.

import type { PeriodAnalyticsResponse } from '@/lib/services/greyfinch/parsers'

export function buildPeriodSummary(periodAnalytics: PeriodAnalyticsResponse | null | undefined) {
  const locationRows = Array.isArray(periodAnalytics?.locations) ? periodAnalytics.locations : null

  if (!locationRows || locationRows.length === 0) return null

  let newPatientsCreated = 0,
    netProduction = 0,
    grossProduction = 0,
    noShowCancellations = 0,
    leads = 0,
    bookings = 0

  // NPL / NPE funnel
  let npl = 0, npe = 0, npeKept = 0, npeNoShow = 0

  // Raw referralType breakdown (dynamic keys from Greyfinch)
  const referralBreakdown: Record<string, number> = {}
  const conversionNumerators: Record<string, number> = {}
  const professionalSubSources: Record<string, number> = {}

  const locationData = {
    gilbert: { production: 0, netProduction: 0, leads: 0, bookings: 0 },
    phoenix: { production: 0, netProduction: 0, leads: 0, bookings: 0 },
  }

  for (const loc of locationRows) {
    newPatientsCreated += loc.newPatientsCreated
    netProduction += loc.netProduction
    grossProduction += loc.grossProduction
    leads += loc.leads
    bookings += loc.bookings
    noShowCancellations += loc.totalNoShowCancellations

    npl += loc.npl
    npe += loc.npe
    npeKept += loc.npeKept
    npeNoShow += loc.npeNoShow

    for (const rt of Object.keys(loc.referralBreakdown ?? {})) {
      referralBreakdown[rt] = (referralBreakdown[rt] ?? 0) + loc.referralBreakdown[rt]
      conversionNumerators[rt] =
        (conversionNumerators[rt] ?? 0) +
        (loc.conversionBreakdown[rt] / 100) * loc.referralBreakdown[rt]
    }

    for (const [name, count] of Object.entries(loc.professionalSubSources ?? {})) {
      professionalSubSources[name] = (professionalSubSources[name] ?? 0) + count
    }

    const bucket = String(loc.location).toLowerCase().includes('gilbert')
      ? locationData.gilbert
      : locationData.phoenix

    bucket.leads += loc.leads
    bucket.bookings += loc.bookings
    bucket.production += loc.grossProduction
    bucket.netProduction += loc.netProduction
  }

  const conversionBreakdown: Record<string, number> = {}
  for (const rt of Object.keys(referralBreakdown)) {
    const total = referralBreakdown[rt]
    conversionBreakdown[rt] = total > 0 ? (conversionNumerators[rt] ?? 0) / total * 100 : 0
  }

  return {
    newPatientsCreated,
    leads,
    locations: locationRows.length,
    bookings,
    production: grossProduction,
    netProduction,
    npl,
    npe,
    npeKept,
    npeNoShow,
    npeScheduledRate: npl > 0 ? (npe / npl) * 100 : 0,
    npeKeptRate: npl > 0 ? (npeKept / npl) * 100 : 0,
    npeNoShowRate: npe > 0 ? (npeNoShow / npe) * 100 : 0,
    referralBreakdown,
    professionalSubSources,
    conversionBreakdown,
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
