import type React from 'react'

export interface PeriodConfig {
  id: string
  name: string
  title: string
  locationId: string
  locationIds: string[]
  startDate?: Date
  endDate?: Date
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
