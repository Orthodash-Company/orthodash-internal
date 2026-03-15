'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SimpleHeader } from '../layout/SimpleHeader';
import { HorizontalFixedColumnLayout } from './HorizontalFixedColumnLayout';
import { EnhancedAIAnalysis } from '../ai/EnhancedAIAnalysis';
import { LocationsManager } from '../integrations/LocationsManager';
import { ConnectionsTab } from '../integrations/ConnectionsTab';
import { SessionManager } from '../sessions/SessionManager';
import { PDFReportGenerator } from '../reports/PDFReportGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Settings, FileText, Trash2, BarChart3 } from 'lucide-react';
import { PeriodConfig, Location, CompactCost } from '@/shared/types';
import { DASHBOARD_LOCATION_IDS, PRACTICE_TZ } from '@/lib/services/greyfinch/queries';
import { type Location as GreyfinchLocation } from '@/lib/services/greyfinch/types';
import { buildPeriodSummary, type PeriodQuery } from '@/lib/period-summary';
import type { PeriodAnalyticsResponse } from '@/lib/services/greyfinch/parsers';
import { type PeriodFilterConfig } from '@/hooks/use-session-manager';
import { useToast } from '@/hooks/use-toast';

function createDefaultPeriod(): PeriodConfig {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: PRACTICE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const today = new Date(`${todayStr}T00:00:00`)
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)

  return {
    id: `period-${Date.now()}`,
    name: 'This Week',
    title: 'This Week',
    locationId: 'all',
    locationIds: [],
    startDate: monday,
    endDate: today,
    visualizations: [],
  }
}

const formatLocalDateForApi = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshingGreyfinchData, setIsRefreshingGreyfinchData] = useState(false);
  const [isLiveDataPulling, setIsLiveDataPulling] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([]);
  const [periods, setPeriods] = useState<PeriodConfig[]>(() => [createDefaultPeriod()]);
  const [periodQueries, setPeriodQueries] = useState<PeriodQuery[]>([]);
  const [greyfinchData, setGreyfinchData] = useState<unknown>(null);
  const [acquisitionCosts, setAcquisitionCosts] = useState<CompactCost[]>([]);
  const [aiSummary, setAiSummary] = useState<Record<string, unknown> | null>(null);
  const [periodAnalyticsData, setPeriodAnalyticsData] = useState<Record<string, PeriodAnalyticsResponse | null>>({});
  const [periodAnalyticsLoading, setPeriodAnalyticsLoading] = useState<Record<string, boolean>>({});
  const [periodAnalyticsError, setPeriodAnalyticsError] = useState<Record<string, string | null>>({});
  const [greyfinchCounts, setGreyfinchCounts] = useState<Record<string, number | undefined>>({});
  // Current committed snapshot dates — updated by PracticeSnapshot, read by SessionManager on save
  const [snapshotDates, setSnapshotDates] = useState<{ startDate: string; endDate: string } | null>(null);
  // Set on restore — PracticeSnapshot watches this and updates its own state
  const [restoredSnapshotDates, setRestoredSnapshotDates] = useState<{ startDate: string; endDate: string } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const greyfinchRequestRef = useRef<AbortController | null>(null);
  const greyfinchTimeoutRef = useRef<number | null>(null);
  const lastFetchedPeriodKeysRef = useRef<Record<string, string>>({});

  const extractLocationsFromGreyfinchData = useCallback((apiResponse: unknown): Location[] => {
    const data = (apiResponse as { data?: unknown })?.data || apiResponse;

    // New format: data.locations is an array from Greyfinch — filter to dashboard locations only
    const dataObj = data as { locations?: unknown } | null
    if (Array.isArray(dataObj?.locations) && dataObj.locations.length > 0) {
      const filtered = (dataObj.locations as GreyfinchLocation[]).filter((loc) =>
        (DASHBOARD_LOCATION_IDS as readonly string[]).includes(loc.id)
      );
      if (filtered.length > 0) {
        return filtered.map((loc, index) => ({
          id: index + 1,
          name: loc.name,
          greyfinchId: loc.id,
          timeZone: loc.timeZone,
          isActive: true,
        }));
      }
    }

    return [];
  }, []);


  const handleAddPeriod = (period: Omit<PeriodConfig, 'id'>) => {
    const newPeriod: PeriodConfig = {
      ...period,
      id: `period-${Date.now()}`
    };
    setPeriods(prev => [...prev, newPeriod]);
    return newPeriod;
  };

  const handleRemovePeriod = (periodId: string) => {
    setPeriods(prev => prev.filter(p => p.id !== periodId));
  };

  const handleUpdatePeriod = (periodId: string, updates: Partial<PeriodConfig>) => {
    setPeriods(prev => prev.map(p => p.id === periodId ? { ...p, ...updates } : p));
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This will remove all analysis periods, costs, and data. This action cannot be undone.')) {
      // Clear all data
      setPeriods([]);
      setPeriodQueries([]);
      setAcquisitionCosts([]);
      setAiSummary(null);

      // Clear Greyfinch data from localStorage
      localStorage.removeItem('greyfinchData');

      // Reset Greyfinch data state
      setGreyfinchData(null);

      // Clear locations
      setLocations([]);

      // Clear sessions from localStorage (they will be recreated when new data is added)
      localStorage.removeItem('orthodash-sessions');

    }
  };

  const clearGreyfinchRequest = useCallback(() => {
    greyfinchRequestRef.current?.abort();
    greyfinchRequestRef.current = null;

    if (greyfinchTimeoutRef.current !== null) {
      window.clearTimeout(greyfinchTimeoutRef.current);
      greyfinchTimeoutRef.current = null;
    }
  }, []);


  // Fetch period-analytics data for a single period
  const fetchPeriodAnalytics = useCallback(async (period: PeriodConfig) => {
    if (!period.startDate || !period.endDate) return;
    const startDate = formatLocalDateForApi(period.startDate);
    const endDate = formatLocalDateForApi(period.endDate);
    // Map numeric location IDs → Greyfinch UUIDs
    const selectedIds = period.locationIds || [];
    const uuids = (selectedIds.length > 0
      ? selectedIds.map((id) => locations.find((l) => l.id.toString() === id)?.greyfinchId)
      : locations.map((l) => l.greyfinchId)
    ).filter(Boolean) as string[];
    if (uuids.length === 0) return;
    // Clear stale data so PeriodColumn shows a loading indicator during refetch
    setPeriodAnalyticsData((prev) => ({ ...prev, [period.id]: null }));
    setPeriodAnalyticsLoading((prev) => ({ ...prev, [period.id]: true }));
    setPeriodAnalyticsError((prev) => ({ ...prev, [period.id]: null }));
    try {
      const params = new URLSearchParams({ startDate, endDate, locationIds: uuids.join(',') });
      const res = await fetch(`/api/greyfinch/period-analytics?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPeriodAnalyticsData((prev) => ({ ...prev, [period.id]: json.data }));
      } else {
        setPeriodAnalyticsError((prev) => ({ ...prev, [period.id]: json.error || 'Fetch failed' }));
      }
    } catch (e) {
      setPeriodAnalyticsError((prev) => ({ ...prev, [period.id]: String(e) }));
    } finally {
      setPeriodAnalyticsLoading((prev) => ({ ...prev, [period.id]: false }));
    }
  }, [locations]);

  // Load multi-location Greyfinch data from API - pure data fetch without UI state coupling
  const fetchGreyfinchData = useCallback(async () => {
    clearGreyfinchRequest();

    const controller = new AbortController();
    greyfinchRequestRef.current = controller;
    greyfinchTimeoutRef.current = window.setTimeout(() => controller.abort(), 30000);

    setError(null);

    try {
      const response = await fetch('/api/greyfinch/locations?location=all', {
        signal: controller.signal,
        cache: 'no-store',
      })

      if (!response.ok) {
        console.warn('⚠️ Greyfinch analytics fetch failed:', response.status)
        // Leave pre-set defaults in place
        return false
      }

      const apiResponse = await response.json()

      if (apiResponse && apiResponse.data) {
        setGreyfinchData(apiResponse)
        localStorage.setItem('greyfinchData', JSON.stringify(apiResponse))
        const locationArray = extractLocationsFromGreyfinchData(apiResponse)
        setLocations(locationArray)
        return true
      } else {
        console.warn('⚠️ Greyfinch analytics data was missing')
        // Leave pre-set defaults in place
        return false
      }
    } catch (error) {
      console.warn('[Dashboard] Error fetching Greyfinch data:', error instanceof Error ? error.message : error)
      // Leave pre-set defaults in place
      return false
    } finally {
      if (greyfinchRequestRef.current === controller) {
        clearGreyfinchRequest();
      }
    }
  }, [clearGreyfinchRequest, extractLocationsFromGreyfinchData])

  const loadGreyfinchData = useCallback(async () => {
    if (isRefreshingGreyfinchData) {
      return false;
    }

    setIsRefreshingGreyfinchData(true);
    try {
      return await fetchGreyfinchData();
    } finally {
      setIsRefreshingGreyfinchData(false);
    }
  }, [fetchGreyfinchData, isRefreshingGreyfinchData]);

  // Load Greyfinch data on first authenticated render.
  // Dashboard renders immediately using defaults; analytics call runs in the background.
  useEffect(() => {
    if (!user?.id) {
      clearGreyfinchRequest();
      setGreyfinchData(null);
      setLocations([]);
      setIsInitialLoading(false);
      setIsRefreshingGreyfinchData(false);
      return;
    }

    setIsInitialLoading(false);

    // Fetch locations from Greyfinch in the background
    void fetchGreyfinchData();

    return () => {
      clearGreyfinchRequest();
    };
  }, [clearGreyfinchRequest, fetchGreyfinchData, user?.id]);


  // Trigger period-analytics fetch when a period's dates or locations change
  useEffect(() => {
    if (locations.length === 0) return;
    for (const period of periods) {
      if (!period.startDate || !period.endDate) continue;
      // locationIds intentionally excluded — API always returns all locations; filtering is client-side
      const key = `${period.id}:${formatLocalDateForApi(period.startDate)}:${formatLocalDateForApi(period.endDate)}`;
      if (lastFetchedPeriodKeysRef.current[period.id] !== key) {
        lastFetchedPeriodKeysRef.current[period.id] = key;
        void fetchPeriodAnalytics(period);
      }
    }
  }, [periods, locations, fetchPeriodAnalytics]);

  // Build periodQueries from fetched period-analytics data, filtering location rows client-side
  const periodQueriesMemo = useMemo((): PeriodQuery[] => {
    return periods.map((period) => {
      const rawData = periodAnalyticsData[period.id]
      const selectedIds = period.locationIds ?? []

      // If specific locations are selected, filter the location rows before summarising
      let filteredData = rawData
      if (rawData && selectedIds.length > 0) {
        const selectedNames = new Set(
          selectedIds
            .map((id) => locations.find((l) => l.id.toString() === id)?.name)
            .filter(Boolean) as string[]
        )
        filteredData = {
          ...rawData,
          locations: rawData.locations.filter((loc) => selectedNames.has(loc.location)),
        }
      }

      return {
        data: buildPeriodSummary(filteredData),
        isLoading: periodAnalyticsLoading[period.id] ?? false,
        error: periodAnalyticsError[period.id] ?? null,
      }
    })
  }, [periods, periodAnalyticsData, periodAnalyticsLoading, periodAnalyticsError, locations]);

  useEffect(() => {
    setPeriodQueries(periodQueriesMemo);
  }, [periodQueriesMemo]);

  const handleSnapshotDatesChange = useCallback((startDate: string, endDate: string) => {
    setSnapshotDates({ startDate, endDate });
  }, []);

  // Restore a saved session — re-populate period configs so data re-fetches fresh
  const handleRestoreSession = useCallback((
    periodFilters: PeriodFilterConfig[],
    snapshotDates?: { startDate: string; endDate: string },
  ) => {
    const restored: PeriodConfig[] = periodFilters.map(f => ({
      id: f.id,
      name: f.name,
      title: f.name,
      locationId: 'all',
      locationIds: f.locationIds ?? [],
      startDate: f.startDate ? new Date(`${f.startDate}T00:00:00`) : undefined,
      endDate: f.endDate ? new Date(`${f.endDate}T00:00:00`) : undefined,
      visualizations: [],
    }))
    setPeriods(restored)
    if (snapshotDates) {
      setRestoredSnapshotDates(snapshotDates)
    }
  }, []);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="bg-white border border-[#1C1F4F]/20 rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1C1F4F]/20 border-t-[#1C1F4F] mx-auto"></div>
          <p className="text-[#1C1F4F] text-center mt-4 font-medium">Loading Orthodash...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-red-600 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                if (user?.id) {
                  setIsInitialLoading(true);
                  void fetchGreyfinchData().finally(() => {
                    setIsInitialLoading(false);
                  });
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">

      <SimpleHeader />

      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tabs Container */}
          <Card className="shadow-sm" ref={tabsRef}>
            <CardHeader className="pb-4">
              <Tabs value={activeTab || "locations"} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 bg-[#1C1F4F]/5 border border-[#1C1F4F]/10">
                  <TabsTrigger
                    value="locations"
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 text-xs sm:text-sm"
                  >
                    <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Practice</span>
                    <span className="xs:hidden">Practice</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="connections"
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 text-xs sm:text-sm"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Connections</span>
                    <span className="xs:hidden">Conn</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="export"
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 text-xs sm:text-sm"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Sessions & Reports</span>
                    <span className="xs:hidden">Sessions</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="locations" className="mt-4">
                  <LocationsManager
                    greyfinchData={greyfinchData}
                    dashboardLocations={locations}
                    isRefreshingGreyfinchData={isRefreshingGreyfinchData}
                    onRefreshGreyfinchData={loadGreyfinchData}
                    initialCounts={greyfinchCounts}
                    onCountsUpdate={setGreyfinchCounts}
                    onDataLoadingChange={setIsLiveDataPulling}
                    restoredSnapshotDates={restoredSnapshotDates}
                    onSnapshotDatesChange={handleSnapshotDatesChange}
                  />
                </TabsContent>

                <TabsContent value="connections" className="mt-6">
                  <ConnectionsTab />
                </TabsContent>

                <TabsContent value="export" className="mt-6">
                  <SessionManager
                    periods={periods}
                    onRestoreSession={handleRestoreSession}
                    snapshotStartDate={snapshotDates?.startDate}
                    snapshotEndDate={snapshotDates?.endDate}
                  />
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Main Dashboard Content - Analysis Columns */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#1C1F4F]"><BarChart3 className="h-5 w-5" />Analysis Periods</CardTitle>
                  <CardDescription className="text-[#1C1F4F]/70">
                    Create and manage analysis periods for your practice data
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearData}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <HorizontalFixedColumnLayout
                periods={periods}
                locations={locations}
                periodQueries={periodQueries}
                onAddPeriod={handleAddPeriod}
                onRemovePeriod={handleRemovePeriod}
                onUpdatePeriod={handleUpdatePeriod}
              />
            </CardContent>
          </Card>

          {/* Enhanced AI Analysis */}
          <EnhancedAIAnalysis
            periods={periods}
            periodQueries={periodQueries}
            selectedLocations={locations.map(l => l.name)}
            onAnalysisComplete={(data) => {
              const normalizedAiSummary = {
                summary: data.summary.overview,
                insights: data.summary.keyInsights,
                strategicRecommendations: data.recommendations?.strategic || [],
                analysis: data.trends.analysis,
              };
              setAiSummary(normalizedAiSummary)
              localStorage.setItem('orthodash-ai-analysis', JSON.stringify(data))
            }}
          />

          {/* PDF Report Generator */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />PDF Report Generator</CardTitle>
              <CardDescription>
                Generate comprehensive PDF reports with all practice data, analysis, and AI insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFReportGenerator
                greyfinchData={greyfinchData}
                periods={periods}
                acquisitionCosts={acquisitionCosts}
                aiSummary={aiSummary}
                dataCounts={greyfinchCounts}
                isDataFetching={isLiveDataPulling}
                selectedPeriod={periods.length > 0 ? periods[0] : undefined}
                selectedCharts={[]} // Charts are managed locally in PeriodColumn components
                periodData={periods.length > 0 ? (periodQueries[0]?.data ?? undefined) : undefined}
              />
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
