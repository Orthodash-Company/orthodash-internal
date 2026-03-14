'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { startOfWeek, format } from 'date-fns'
import { CheckCircle, AlertCircle, RefreshCw, Database, Users, Calendar, DollarSign, BookOpen, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { PRACTICE_TZ } from '@/lib/services/greyfinch/queries'
import { LocationSchema } from '@/lib/services/greyfinch/types'
import { type DataCounts, type Location as DashboardLocation } from '@/shared/types'

interface PracticeSnapshotProps {
  greyfinchData?: unknown
  locations?: DashboardLocation[]
  isRefreshingGreyfinchData?: boolean
  onRefreshGreyfinchData?: () => Promise<boolean>
  initialCounts?: DataCounts
  onCountsUpdate?: (counts: DataCounts) => void
  onDataLoadingChange?: (isLoading: boolean) => void
}

interface LocationCounts {
  activeTxPatients: number
  appointments: number
  newPatientsCreated: number
  caseStarts: number
}

type GreyfinchLocation = z.infer<typeof LocationSchema>

const FALLBACK_LOCATIONS = [
  { id: '097eb1d8-ec62-45d9-8c21-d08af1cf66c8', name: 'Gilbert' },
  { id: '4a2bf9bd-222b-4690-9d12-5fc95daa7d93', name: 'Phoenix-Ahwatukee' },
] as const

const metricCards = [
  {
    key: 'patients',
    label: 'Patients',
    tooltip: 'Active treatment patients (status is not "new patient lead") from the PRACTICE_MONITOR report for the selected date range.',
    icon: Users,
    iconClassName: 'text-blue-500',
  },
  {
    key: 'appointments',
    label: 'Appointments',
    tooltip: 'Completed bookings from the PRACTICE_EFFICIENCY report for the selected date range.',
    icon: Calendar,
    iconClassName: 'text-purple-500',
  },
  {
    key: 'leads',
    label: 'Leads',
    tooltip: 'New patients who have not yet had an appointment. Exact report and column mapping pending Postman validation.',
    icon: DollarSign,
    iconClassName: 'text-orange-500',
    tbd: true,
  },
  {
    key: 'bookings',
    label: 'Bookings',
    tooltip: 'Patients with exam/child or exam/adult status with a future appointment scheduled. Exact report and column mapping pending Postman validation.',
    icon: BookOpen,
    iconClassName: 'text-red-500',
    tbd: true,
  },
] as const

const tbdBadge = <span className="text-sm font-medium text-gray-400">TBD</span>

const liveCountsResponseSchema = z.object({
  success: z.literal(true),
  byLocation: z.record(z.string(), z.object({
    activeTxPatients: z.number(),
    appointments: z.number(),
    newPatientsCreated: z.number(),
    caseStarts: z.number(),
  })),
  startDate: z.string(),
  endDate: z.string(),
})

const locationsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    locations: z.array(LocationSchema),
    lastUpdated: z.string(),
  }),
})

function nowInTZ(tz: string): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    }).formatToParts(new Date()).map((part) => [part.type, part.value])
  )

  return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
}

const reduceCounts = (locations: LocationCounts[]): DataCounts => (
  locations.reduce<DataCounts>(
    (acc, loc) => ({
      patients: (acc.patients ?? 0) + loc.activeTxPatients,
      appointments: (acc.appointments ?? 0) + loc.appointments,
      activeTxPatients: (acc.activeTxPatients ?? 0) + loc.activeTxPatients,
      newPatientsCreated: (acc.newPatientsCreated ?? 0) + loc.newPatientsCreated,
      caseStarts: (acc.caseStarts ?? 0) + loc.caseStarts,
    }),
    {}
  )
)

async function fetchLocations(): Promise<GreyfinchLocation[]> {
  const response = await fetch('/api/greyfinch/locations', { cache: 'no-store' })
  const json = await response.json()

  if (!response.ok) {
    throw new Error(typeof json?.error === 'string' ? json.error : 'Unable to fetch Greyfinch locations.')
  }

  const parsed = locationsResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error('Received an invalid Greyfinch locations response.')
  }

  return parsed.data.data.locations
}

async function fetchLiveCounts(startDate: string, endDate: string): Promise<Record<string, LocationCounts>> {
  const params = new URLSearchParams({ startDate, endDate })
  const response = await fetch(`/api/greyfinch/live-counts?${params.toString()}`, { cache: 'no-store' })
  const json = await response.json()

  if (!response.ok) {
    throw new Error(typeof json?.error === 'string' ? json.error : 'Unable to fetch Greyfinch live counts.')
  }

  const parsed = liveCountsResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error('Received an invalid Greyfinch live counts response.')
  }

  return parsed.data.byLocation
}

export function PracticeSnapshot({
  greyfinchData,
  locations,
  isRefreshingGreyfinchData = false,
  onRefreshGreyfinchData,
  initialCounts,
  onCountsUpdate,
  onDataLoadingChange,
}: PracticeSnapshotProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isPullingAllData, setIsPullingAllData] = useState(false)
  const [lastPullTime, setLastPullTime] = useState<string | null>(null)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const locationDropdownRef = useRef<HTMLDivElement>(null)
  const locationErrorToastRef = useRef<string | null>(null)
  const countsErrorToastRef = useRef<string | null>(null)

  const tz = locations?.find((location) => location.timeZone)?.timeZone ?? PRACTICE_TZ
  const now = nowInTZ(tz)
  const [startDate, setStartDate] = useState(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(now, 'yyyy-MM-dd'))

  const locationsQuery = useQuery({
    queryKey: ['greyfinch', 'locations'],
    queryFn: fetchLocations,
    enabled: Boolean(user?.id) && !locations?.length,
    staleTime: 5 * 60 * 1000,
  })

  const liveCountsQuery = useQuery({
    queryKey: ['greyfinch', 'live-counts', startDate, endDate],
    queryFn: () => fetchLiveCounts(startDate, endDate),
    enabled: Boolean(user?.id),
  })

  const availableLocations = useMemo(() => {
    if (locations && locations.length > 0) {
      return locations
        .filter((location) => location.greyfinchId)
        .map((location) => ({ id: location.greyfinchId as string, name: location.name }))
    }

    if (locationsQuery.data && locationsQuery.data.length > 0) {
      return locationsQuery.data.map((location) => ({ id: location.id, name: location.name }))
    }

    return [...FALLBACK_LOCATIONS]
  }, [locations, locationsQuery.data])

  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(
    () => availableLocations.map((location) => location.id)
  )

  useEffect(() => {
    setSelectedLocationIds(availableLocations.map((location) => location.id))
  }, [availableLocations])

  useEffect(() => {
    if (!locationsQuery.error) {
      locationErrorToastRef.current = null
      return
    }

    const message = locationsQuery.error instanceof Error
      ? locationsQuery.error.message
      : 'Unable to fetch Greyfinch locations.'

    if (locationErrorToastRef.current === message) return

    locationErrorToastRef.current = message
    toast({
      title: 'Failed to fetch locations.',
      description: message,
      variant: 'destructive',
    })
  }, [locationsQuery.error, toast])

  useEffect(() => {
    if (!liveCountsQuery.error) {
      countsErrorToastRef.current = null
      return
    }

    const message = liveCountsQuery.error instanceof Error
      ? liveCountsQuery.error.message
      : 'Unable to fetch Greyfinch live counts.'

    if (countsErrorToastRef.current === message) return

    countsErrorToastRef.current = message
    toast({
      title: 'Failed to fetch live counts.',
      description: message,
      variant: 'destructive',
    })
  }, [liveCountsQuery.error, toast])

  useEffect(() => {
    if (!liveCountsQuery.data) return
    onCountsUpdate?.(reduceCounts(Object.values(liveCountsQuery.data)))
  }, [liveCountsQuery.data, onCountsUpdate])

  const toggleLocation = useCallback((id: string) => {
    setSelectedLocationIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter((value) => value !== id)
      }

      return [...prev, id]
    })
  }, [])

  const dataCounts = useMemo<DataCounts>(() => {
    const rawByLocation = liveCountsQuery.data ?? {}
    const filtered = Object.entries(rawByLocation).filter(([id]) => selectedLocationIds.includes(id))

    if (filtered.length === 0) {
      return initialCounts ?? {}
    }

    return reduceCounts(filtered.map(([, location]) => location))
  }, [initialCounts, liveCountsQuery.data, selectedLocationIds])

  const isConnected = Boolean(user?.id) && (Boolean(greyfinchData) || locationsQuery.isSuccess || Boolean(locations?.length))
  const isLoadingCounts = liveCountsQuery.isLoading || liveCountsQuery.isFetching
  const isLoadingLocations = locationsQuery.isLoading || locationsQuery.isFetching

  useEffect(() => {
    onDataLoadingChange?.(isRefreshingGreyfinchData || isPullingAllData || isLoadingCounts || isLoadingLocations)
  }, [isRefreshingGreyfinchData, isPullingAllData, isLoadingCounts, isLoadingLocations, onDataLoadingChange])

  const handlePullAllData = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to pull data.',
        variant: 'destructive',
      })
      return
    }

    if (isPullingAllData || isRefreshingGreyfinchData) return

    setIsPullingAllData(true)

    try {
      if (onRefreshGreyfinchData) {
        const success = await onRefreshGreyfinchData()
        if (!success) {
          throw new Error('Failed to refresh Greyfinch connection data.')
        }
      }

      await Promise.all([
        liveCountsQuery.refetch(),
        locations?.length ? Promise.resolve() : locationsQuery.refetch(),
      ])

      setLastPullTime(new Date().toLocaleString())
    } catch (error) {
      toast({
        title: 'Data Pull Failed',
        description: error instanceof Error ? error.message : 'Failed to pull data from Greyfinch. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPullingAllData(false)
    }
  }, [isPullingAllData, isRefreshingGreyfinchData, liveCountsQuery, locations?.length, locationsQuery, onRefreshGreyfinchData, toast, user?.id])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setLocationDropdownOpen(false)
      }
    }

    if (locationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [locationDropdownOpen])

  const locationDisplayText = useMemo(() => {
    if (selectedLocationIds.length === availableLocations.length) return 'All locations'

    return availableLocations
      .filter((location) => selectedLocationIds.includes(location.id))
      .map((location) => location.name)
      .join(', ')
  }, [availableLocations, selectedLocationIds])

  const showCountsSkeleton = !liveCountsQuery.data || isLoadingCounts || isRefreshingGreyfinchData

  const countsDisplay = useMemo(() => (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {metricCards.map((card) => {
        const Icon = card.icon

        return (
          <Tooltip key={card.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white p-3 text-center transition-colors hover:border-[#1C1F4F]/30 hover:bg-gray-50"
              >
                <Icon className={`mx-auto mb-1.5 h-5 w-5 ${card.iconClassName}`} />
                {showCountsSkeleton ? (
                  <Skeleton className="mx-auto mb-1.5 h-7 w-14 bg-gray-200" />
                ) : (
                  <div className="text-xl font-bold text-[#1C1F4F]">
                    {'tbd' in card ? tbdBadge : (dataCounts[card.key] ?? 0)}
                  </div>
                )}
                <div className="mt-0.5 text-xs text-gray-500 underline decoration-dotted decoration-[#1d1d52]/35 underline-offset-4">
                  {card.label}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-56 text-center">
              {card.tooltip}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  ), [dataCounts, showCountsSkeleton])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#1C1F4F]">
            <Database className="h-4 w-4" />
            Practice Snapshot
          </h3>
          <p className="mt-0.5 text-xs text-[#1C1F4F]/50">Key metrics from Greyfinch for the selected date range and locations</p>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-1.5 text-xs font-medium">
          {isConnected ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600">Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-500">Not connected</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1" ref={locationDropdownRef}>
          <label className="mb-1 block text-xs font-medium text-gray-400">Locations</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLocationDropdownOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-[#1C1F4F] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/30"
            >
              <span className="truncate">{locationDisplayText}</span>
              <ChevronDown className={`ml-1.5 h-3 w-3 shrink-0 text-gray-400 transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {locationDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md">
                {availableLocations.map((location) => {
                  const active = selectedLocationIds.includes(location.id)

                  return (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => toggleLocation(location.id)}
                      className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                    >
                      <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${active ? 'border-[#1C1F4F] bg-[#1C1F4F]' : 'border-gray-300'}`}>
                        {active && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className={active ? 'font-medium text-[#1C1F4F]' : 'text-gray-600'}>{location.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-[120px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-400">Start</label>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-[#1C1F4F] focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/30"
          />
        </div>

        <div className="min-w-[120px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-400">End</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={format(nowInTZ(tz), 'yyyy-MM-dd')}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-[#1C1F4F] focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/30"
          />
        </div>
      </div>

      {countsDisplay}

      <div className="flex items-center gap-3">
        <Button
          onClick={handlePullAllData}
          disabled={isPullingAllData || isLoadingCounts || isRefreshingGreyfinchData || !isConnected}
          className="bg-[#1C1F4F] text-white hover:bg-[#1C1F4F]/90"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {isPullingAllData || isLoadingCounts || isRefreshingGreyfinchData ? 'Refreshing...' : 'Pull All Data'}
        </Button>
        {lastPullTime && (
          <p className="text-xs text-gray-400">Last pulled: {lastPullTime}</p>
        )}
      </div>
    </div>
  )
}

export default PracticeSnapshot
