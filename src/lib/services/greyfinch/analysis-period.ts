import { and, eq, gt } from 'drizzle-orm'
import { analyticsCache } from '@/shared/schema'
import type { AnalysisPeriodResult, CompactCost, ReferralSourceSummary, UnmappedReferralPatient } from '@/shared/types'
import { greyfinchService } from './client'
import { fetchReport, type ReportData } from './reports'
import { DASHBOARD_LOCATION_IDS, GQL_PATIENTS_FOR_PERIOD_WITH_SCHEDULING_STATUS, PRACTICE_TZ } from './queries'

const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_VERSION = 'v2'
const DB_CACHE_PREFIX = `analysis-period:${CACHE_VERSION}`

type PeriodDefinition = {
  id: string
  name: string
  startDate: string
  endDate: string
  locationIds: string[]
  acquisitionCosts?: CompactCost[]
}

type GreyfinchBooking = {
  id: string
  startTime: string | null
  checkInTime: string | null
  seatTime: string | null
}

type GreyfinchAppointment = {
  id: string
  bookings: GreyfinchBooking[] | null
}

type GreyfinchPatient = {
  id: string
  createdAt: string
  person: {
    firstName: string | null
    lastName: string | null
  } | null
  primaryLocation: {
    id: string
    name: string
  } | null
  appointments: GreyfinchAppointment[] | null
}

type PatientsForPeriodResponse = {
  patients?: GreyfinchPatient[]
}

type SourceAnalysisResult = Omit<AnalysisPeriodResult, 'periodId' | 'name' | 'acquisitionCosts' | 'totals'> & {
  totals: Omit<AnalysisPeriodResult['totals'], 'acquisitionCosts' | 'netAfterCosts'>
}

type CacheEntry = {
  data: SourceAnalysisResult
  fetchedAt: number
}

const l1Cache = new Map<string, CacheEntry>()

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(Date.UTC(year, month - 1, day + days))
  return value.toISOString().slice(0, 10)
}

function utcBoundaryForPracticeDate(date: string): string {
  if (PRACTICE_TZ !== 'America/Phoenix') {
    throw new Error(`Unsupported Greyfinch practice timezone: ${PRACTICE_TZ}`)
  }
  return `${date}T07:00:00.000Z`
}

function sortedLocationIds(locationIds: string[]): string[] {
  return (locationIds.length > 0 ? locationIds : [...DASHBOARD_LOCATION_IDS]).filter(Boolean).sort()
}

function cacheDataType(locationIds: string[]): string {
  return `${DB_CACHE_PREFIX}:${sortedLocationIds(locationIds).join(',')}`
}

function cacheKey(startDate: string, endDate: string, locationIds: string[]): string {
  return `${CACHE_VERSION}:${startDate}:${endDate}:${sortedLocationIds(locationIds).join(',')}`
}

function rowToObject(columns: string[], row: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i]
  return obj
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function str(value: unknown): string {
  return value == null ? '' : String(value)
}

function totalCosts(costs: CompactCost[] | undefined): number {
  return (costs ?? []).reduce((sum, cost) => sum + num(cost.amount), 0)
}

function isSourceAnalysisResult(value: unknown): value is SourceAnalysisResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Partial<SourceAnalysisResult>
  return Boolean(
    result.totals &&
    typeof result.totals.npl === 'number' &&
    typeof result.totals.npe === 'number' &&
    typeof result.totals.npeKept === 'number' &&
    typeof result.totals.netProduction === 'number' &&
    Array.isArray(result.referralSources) &&
    Array.isArray(result.unmappedReferralPatients)
  )
}

function isScheduled(patient: GreyfinchPatient): boolean {
  return patient.appointments?.some((appointment) =>
    appointment.bookings?.some((booking) => Boolean(booking.startTime))
  ) ?? false
}

function isKept(patient: GreyfinchPatient): boolean {
  return patient.appointments?.some((appointment) =>
    appointment.bookings?.some((booking) => Boolean(booking.checkInTime || booking.seatTime))
  ) ?? false
}

function parsePracticeMonitorNetProduction(data: ReportData): number {
  return data.values.reduce((sum, row) => {
    const r = rowToObject(data.columns, row)
    return sum + num(r.netProduction)
  }, 0)
}

function parseReferralRowsByPatientId(data: ReportData): Map<string, string> {
  const byPatientId = new Map<string, string>()
  for (const row of data.values) {
    const r = rowToObject(data.columns, row)
    const patientId = str(r.patientInternalId)
    if (!patientId) continue
    byPatientId.set(patientId, str(r.referralType) || 'Unknown')
  }
  return byPatientId
}

function patientName(patient: GreyfinchPatient): string {
  const name = [patient.person?.firstName, patient.person?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  return name || 'Unnamed patient'
}

function unmappedPatientDetails(patient: GreyfinchPatient): UnmappedReferralPatient {
  return {
    id: patient.id,
    name: patientName(patient),
    createdAt: patient.createdAt,
    location: patient.primaryLocation?.name ?? 'Unknown location',
  }
}

function buildReferralSources(
  patients: GreyfinchPatient[],
  referralTypeByPatientId: Map<string, string>,
): { referralSources: ReferralSourceSummary[]; unmappedReferralPatients: UnmappedReferralPatient[] } {
  const byReferralType = new Map<string, { npl: number; npeKept: number }>()
  const unmappedReferralPatients: UnmappedReferralPatient[] = []

  for (const patient of patients) {
    const referralType = referralTypeByPatientId.get(patient.id)
    if (!referralType) {
      unmappedReferralPatients.push(unmappedPatientDetails(patient))
      continue
    }

    const current = byReferralType.get(referralType) ?? { npl: 0, npeKept: 0 }
    current.npl += 1
    if (isKept(patient)) current.npeKept += 1
    byReferralType.set(referralType, current)
  }

  const referralSources = Array.from(byReferralType.entries())
    .map(([referralType, value]) => ({
      referralType,
      npl: value.npl,
      npeKept: value.npeKept,
      conversionRate: value.npl > 0 ? (value.npeKept / value.npl) * 100 : 0,
    }))
    .sort((a, b) => b.npl - a.npl)

  return { referralSources, unmappedReferralPatients }
}

async function dbGet(definition: PeriodDefinition): Promise<SourceAnalysisResult | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const { db } = await import('@/lib/db')
    const cutoff = new Date(Date.now() - CACHE_TTL_MS)
    const rows = await db
      .select({ data: analyticsCache.data })
      .from(analyticsCache)
      .where(
        and(
          eq(analyticsCache.startDate, definition.startDate),
          eq(analyticsCache.endDate, definition.endDate),
          eq(analyticsCache.dataType, cacheDataType(definition.locationIds)),
          gt(analyticsCache.createdAt, cutoff)
        )
      )
      .orderBy(analyticsCache.createdAt)
      .limit(1)

    if (rows.length === 0) return null
    const parsed = JSON.parse(rows[0].data)
    return isSourceAnalysisResult(parsed) ? parsed : null
  } catch (error) {
    console.warn('[analysis-period] DB cache read failed:', error)
    return null
  }
}

async function dbSet(definition: PeriodDefinition, data: SourceAnalysisResult): Promise<void> {
  if (!process.env.DATABASE_URL) return
  try {
    const { db } = await import('@/lib/db')
    await db.insert(analyticsCache).values({
      startDate: definition.startDate,
      endDate: definition.endDate,
      dataType: cacheDataType(definition.locationIds),
      data: JSON.stringify(data),
    })
  } catch (error) {
    console.warn('[analysis-period] DB cache write failed:', error)
  }
}

function withCosts(definition: PeriodDefinition, source: SourceAnalysisResult, cached: boolean): AnalysisPeriodResult {
  const acquisitionCosts = totalCosts(definition.acquisitionCosts)
  return {
    ...source,
    periodId: definition.id,
    name: definition.name,
    totals: {
      ...source.totals,
      acquisitionCosts,
      netAfterCosts: source.totals.netProduction - acquisitionCosts,
    },
    cached,
  }
}

async function fetchSourceAnalysis(definition: PeriodDefinition, signal?: AbortSignal): Promise<SourceAnalysisResult> {
  const locationIds = sortedLocationIds(definition.locationIds)
  signal?.throwIfAborted()
  const patientsData = await greyfinchService.makeGraphQLRequest(
    GQL_PATIENTS_FOR_PERIOD_WITH_SCHEDULING_STATUS,
    {
      createdAtGte: utcBoundaryForPracticeDate(definition.startDate),
      createdAtLt: utcBoundaryForPracticeDate(addDays(definition.endDate, 1)),
      locationIds,
    },
    { signal }
  ) as PatientsForPeriodResponse

  const patients = patientsData.patients ?? []
  signal?.throwIfAborted()
  const [practiceMonitor, patientReferrals] = await Promise.all([
    fetchReport('PRACTICE_MONITOR', { startDate: definition.startDate, endDate: definition.endDate, locationIds }, { signal }),
    fetchReport('PATIENT_REFERRALS', { startDate: definition.startDate, endDate: definition.endDate, locationIds }, { signal }),
  ])

  const referralTypeByPatientId = parseReferralRowsByPatientId(patientReferrals)
  const { referralSources, unmappedReferralPatients } = buildReferralSources(patients, referralTypeByPatientId)
  const npl = patients.length
  const npe = patients.filter(isScheduled).length
  const npeKept = patients.filter(isKept).length
  const netProduction = parsePracticeMonitorNetProduction(practiceMonitor)

  return {
    startDate: definition.startDate,
    endDate: definition.endDate,
    locationIds,
    totals: { npl, npe, npeKept, netProduction },
    referralSources,
    unmappedReferralPatients,
  }
}

export async function evaluateAnalysisPeriod(
  definition: PeriodDefinition,
  options: { refresh?: boolean; signal?: AbortSignal } = {},
): Promise<AnalysisPeriodResult> {
  options.signal?.throwIfAborted()
  const key = cacheKey(definition.startDate, definition.endDate, definition.locationIds)

  if (!options.refresh) {
    const l1 = l1Cache.get(key)
    if (l1 && Date.now() - l1.fetchedAt < CACHE_TTL_MS) {
      return withCosts(definition, l1.data, true)
    }

    const db = await dbGet(definition)
    if (db) {
      l1Cache.set(key, { data: db, fetchedAt: Date.now() })
      return withCosts(definition, db, true)
    }
  }

  const source = await fetchSourceAnalysis(definition, options.signal)
  options.signal?.throwIfAborted()
  l1Cache.set(key, { data: source, fetchedAt: Date.now() })
  void dbSet(definition, source)
  return withCosts(definition, source, false)
}
