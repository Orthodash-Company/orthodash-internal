import type React from 'react'

export interface PeriodConfig {
  id: string
  name: string
  title: string
  locationId: string
  locationIds: string[]
  startDate?: Date
  endDate?: Date
  acquisitionCosts?: CompactCost[]
  visualizations?: VisualizationOption[]
}

// UI-level location — maps a numeric dashboard ID to a Greyfinch UUID
export interface Location {
  id: number
  name: string
  greyfinchId?: string
  timeZone?: string
  isActive?: boolean
}

export interface VisualizationOption {
  id: string
  type: 'doughnut' | 'column' | 'spline' | 'stacked' | 'stacked-column'
  title: string
  description: string
  summary: string
  explanation: string
  icon: React.ComponentType<{ className?: string }>
  options: string[]
}

export interface DataCounts {
  patients?: number
  locations?: number
  appointments?: number
  leads?: number
  bookings?: number
  activeTxPatients?: number
  newPatientsCreated?: number
  caseStarts?: number
  [key: string]: number | undefined
}

export interface CompactCost {
  id: string
  name: string
  amount: number
  category: string
  date: string
}

export interface PeriodCosts {
  periodId: string
  costs: CompactCost[]
  total: number
}

export interface ReferralSourceSummary {
  referralType: string
  npl: number
  npeKept: number
  conversionRate: number
}

export interface UnmappedReferralPatient {
  id: string
  name: string
  createdAt: string
  location: string
}

export interface AnalysisPeriodResult {
  periodId: string
  name: string
  startDate: string
  endDate: string
  locationIds: string[]
  totals: {
    npl: number
    npe: number
    npeKept: number
    netProduction: number
    acquisitionCosts: number
    netAfterCosts: number
  }
  referralSources: ReferralSourceSummary[]
  unmappedReferralPatients: UnmappedReferralPatient[]
  cached?: boolean
}

export interface PeriodQuery {
  data: AnalysisPeriodResult | null
  isLoading: boolean
  error: string | null
}
