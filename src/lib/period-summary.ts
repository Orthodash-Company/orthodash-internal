// Aggregates a PeriodAnalyticsResponse (per-location rows) into a single
// summary object consumed by PeriodColumn, EnhancedAIAnalysis, and PDFReportGenerator.

import type { PeriodAnalyticsResponse, ReferralBucket } from '@/lib/services/greyfinch/parsers'

const emptyReferralBuckets = (): Record<ReferralBucket, number> => ({
  DDS: 0,
  Family: 0,
  Friend: 0,
  SevenUP: 0,
  CommunityAndEvents: 0,
  Online: 0,
})

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

  // 6-bucket referral totals
  const referralBreakdown = emptyReferralBuckets()
  const conversionNumerators = emptyReferralBuckets()
  const ddsSubSources: Record<string, number> = {}

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

    // NPL / NPE funnel
    npl += loc.npl
    npe += loc.npe
    npeKept += loc.npeKept
    npeNoShow += loc.npeNoShow

    // 6-bucket referral aggregation
    for (const bucket of Object.keys(loc.referralBreakdown) as ReferralBucket[]) {
      referralBreakdown[bucket] = (referralBreakdown[bucket] ?? 0) + loc.referralBreakdown[bucket]
      conversionNumerators[bucket] =
        (conversionNumerators[bucket] ?? 0) +
        (loc.conversionBreakdown[bucket] / 100) * loc.referralBreakdown[bucket]
    }

    // DDS sub-sources merged across locations
    for (const [name, count] of Object.entries(loc.ddsSubSources)) {
      ddsSubSources[name] = (ddsSubSources[name] ?? 0) + count
    }

    const bucket = String(loc.location).toLowerCase().includes('gilbert')
      ? locationData.gilbert
      : locationData.phoenix

    bucket.leads += loc.leads
    bucket.bookings += loc.bookings
    bucket.production += loc.grossProduction
    bucket.netProduction += loc.netProduction
  }

  // Weighted conversion rates per bucket
  const conversionBreakdown = emptyReferralBuckets()
  for (const bucket of Object.keys(referralBreakdown) as ReferralBucket[]) {
    const total = referralBreakdown[bucket]
    conversionBreakdown[bucket] = total > 0 ? (conversionNumerators[bucket] / total) * 100 : 0
  }

  return {
    newPatientsCreated,
    leads,
    locations: locationRows.length,
    bookings,
    production: grossProduction,
    netProduction,
    // NPL / NPE funnel
    npl,
    npe,
    npeKept,
    npeNoShow,
    npeScheduledRate: npl > 0 ? (npe / npl) * 100 : 0,
    npeKeptRate: npl > 0 ? (npeKept / npl) * 100 : 0,
    npeNoShowRate: npe > 0 ? (npeNoShow / npe) * 100 : 0,
    // 6-bucket referrals
    referralBreakdown,
    ddsSubSources,
    conversionBreakdown,
    // Legacy 3-bucket — kept for EnhancedAIAnalysis / PDFReportGenerator
    referralSources: {
      professional: referralBreakdown.DDS,
      digital: referralBreakdown.Online,
      direct: referralBreakdown.Family + referralBreakdown.Friend,
    },
    conversionRates: {
      digital: conversionBreakdown.Online,
      professional: conversionBreakdown.DDS,
      direct: referralBreakdown.Family + referralBreakdown.Friend > 0
        ? (conversionNumerators.Family + conversionNumerators.Friend) /
          (referralBreakdown.Family + referralBreakdown.Friend) * 100
        : 0,
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
