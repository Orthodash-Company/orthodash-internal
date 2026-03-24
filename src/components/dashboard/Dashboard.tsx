'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SimpleHeader } from '../layout/SimpleHeader';
import { HorizontalFixedColumnLayout } from './HorizontalFixedColumnLayout';
import { EnhancedAIAnalysis } from '../ai/EnhancedAIAnalysis';
import { ConnectionsTab } from '../integrations/ConnectionsTab';
import { SessionManager } from '../sessions/SessionManager';
import { PDFReportGenerator } from '../reports/PDFReportGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, FileText, Trash2, BarChart3 } from 'lucide-react';

import { PeriodConfig, Location, CompactCost } from '@/shared/types';
import { GILBERT_UUID, PHOENIX_UUID, PRACTICE_TZ } from '@/lib/services/greyfinch/queries';
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
    name: 'Period A',
    title: 'Period A',
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

const LOCATIONS: Location[] = [
  { id: 1, name: 'Gilbert', greyfinchId: GILBERT_UUID, timeZone: PRACTICE_TZ, isActive: true },
  { id: 2, name: 'Phoenix-Ahwatukee', greyfinchId: PHOENIX_UUID, timeZone: PRACTICE_TZ, isActive: true },
]

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [periods, setPeriods] = useState<PeriodConfig[]>(() => [createDefaultPeriod()]);
  const [periodQueries, setPeriodQueries] = useState<PeriodQuery[]>([]);
  const [acquisitionCosts, setAcquisitionCosts] = useState<CompactCost[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<{ periods: { title: string; summary: string; keyInsights: string[]; recommendations: string[] }[]; comparison: string | null } | null>(null);
  const [periodAnalyticsData, setPeriodAnalyticsData] = useState<Record<string, PeriodAnalyticsResponse | null>>({});
  const [periodAnalyticsLoading, setPeriodAnalyticsLoading] = useState<Record<string, boolean>>({});
  const [periodAnalyticsError, setPeriodAnalyticsError] = useState<Record<string, string | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const lastFetchedPeriodKeysRef = useRef<Record<string, string>>({});

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
      setPeriods([]);
      setPeriodQueries([]);
      setAcquisitionCosts([]);
      setAiAnalysis(null);
      localStorage.removeItem('orthodash-sessions');
    }
  };


  // Fetch period-analytics data for a single period
  const fetchPeriodAnalytics = useCallback(async (period: PeriodConfig, refresh = false) => {
    if (!period.startDate || !period.endDate) return;
    const startDate = formatLocalDateForApi(period.startDate);
    const endDate = formatLocalDateForApi(period.endDate);
    // Map numeric location IDs → Greyfinch UUIDs
    const selectedIds = period.locationIds || [];
    const uuids = (selectedIds.length > 0
      ? selectedIds.map((id) => LOCATIONS.find((l) => l.id.toString() === id)?.greyfinchId)
      : LOCATIONS.map((l) => l.greyfinchId)
    ).filter(Boolean) as string[];
    if (uuids.length === 0) return;
    // Clear stale data so PeriodColumn shows a loading indicator during refetch
    setPeriodAnalyticsData((prev) => ({ ...prev, [period.id]: null }));
    setPeriodAnalyticsLoading((prev) => ({ ...prev, [period.id]: true }));
    setPeriodAnalyticsError((prev) => ({ ...prev, [period.id]: null }));
    try {
      const params = new URLSearchParams({ startDate, endDate, locationIds: uuids.join(',') });
      if (refresh) params.set('refresh', 'true');
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
  }, [LOCATIONS]);

  // Trigger period-analytics fetch when a period's dates or LOCATIONS change
  useEffect(() => {
    for (const period of periods) {
      if (!period.startDate || !period.endDate) continue;
      // locationIds intentionally excluded — API always returns all LOCATIONS; filtering is client-side
      const key = `${period.id}:${formatLocalDateForApi(period.startDate)}:${formatLocalDateForApi(period.endDate)}`;
      if (lastFetchedPeriodKeysRef.current[period.id] !== key) {
        lastFetchedPeriodKeysRef.current[period.id] = key;
        void fetchPeriodAnalytics(period);
      }
    }
  }, [periods, LOCATIONS, fetchPeriodAnalytics]);

  // Build periodQueries from fetched period-analytics data, filtering location rows client-side
  const periodQueriesMemo = useMemo((): PeriodQuery[] => {
    return periods.map((period) => {
      const rawData = periodAnalyticsData[period.id]
      const selectedIds = period.locationIds ?? []

      // If specific LOCATIONS are selected, filter the location rows before summarising
      let filteredData = rawData
      if (rawData && selectedIds.length > 0) {
        const selectedNames = new Set(
          selectedIds
            .map((id) => LOCATIONS.find((l) => l.id.toString() === id)?.name)
            .filter(Boolean) as string[]
        )
        filteredData = {
          ...rawData,
          locations: rawData.locations.filter((loc: { location: string }) => selectedNames.has(loc.location)),
        }
      }

      return {
        data: buildPeriodSummary(filteredData),
        isLoading: periodAnalyticsLoading[period.id] ?? false,
        error: periodAnalyticsError[period.id] ?? null,
      }
    })
  }, [periods, periodAnalyticsData, periodAnalyticsLoading, periodAnalyticsError, LOCATIONS]);

  useEffect(() => {
    setPeriodQueries(periodQueriesMemo);
  }, [periodQueriesMemo]);

  // Retry a failed period fetch by clearing cached error and re-fetching
  const handleRetryPeriod = useCallback((periodId: string) => {
    const period = periods.find((p) => p.id === periodId)
    if (!period) return
    lastFetchedPeriodKeysRef.current[periodId] = '' // Force re-fetch
    void fetchPeriodAnalytics(period)
  }, [periods, fetchPeriodAnalytics]);

  // Bypass cache and re-fetch fresh data from Greyfinch
  const handleRefreshPeriod = useCallback((periodId: string) => {
    const period = periods.find((p) => p.id === periodId)
    if (!period) return
    lastFetchedPeriodKeysRef.current[periodId] = '' // Force re-fetch next time too
    void fetchPeriodAnalytics(period, true)
  }, [periods, fetchPeriodAnalytics]);

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
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">

      <SimpleHeader />

      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Settings / Sessions tabs */}
          <div ref={tabsRef}>
            <Tabs value={activeTab || "export"} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 bg-white border border-[#1C1F4F]/10 rounded-xl shadow-sm">
                <TabsTrigger
                  value="export"
                  className="rounded-lg text-xs sm:text-sm font-medium text-[#1C1F4F]/50 data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger
                  value="connections"
                  className="rounded-lg text-xs sm:text-sm font-medium text-[#1C1F4F]/50 data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Connections
                </TabsTrigger>
              </TabsList>

              <TabsContent value="export" className="mt-4">
                <Card className="shadow-sm border-[#1C1F4F]/8">
                  <CardContent className="pt-6">
                    <SessionManager
                      periods={periods}
                      onRestoreSession={handleRestoreSession}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="connections" className="mt-4">
                <Card className="shadow-sm border-[#1C1F4F]/8">
                  <CardContent className="pt-6">
                    <ConnectionsTab />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Analysis Periods */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#1C1F4F]/50" />
                <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[#1C1F4F]/40">Analysis Periods</span>
              </div>
              <button
                onClick={handleClearData}
                className="text-[10px] font-medium text-[#1C1F4F]/30 hover:text-red-500 transition-colors tracking-wide uppercase"
              >
                Clear Data
              </button>
            </div>
            <Card className="shadow-sm border-[#1C1F4F]/8 overflow-hidden">
              <CardContent className="p-4">
                <HorizontalFixedColumnLayout
                  periods={periods}
                  locations={LOCATIONS}
                  periodQueries={periodQueries}
                  onAddPeriod={handleAddPeriod}
                  onRemovePeriod={handleRemovePeriod}
                  onUpdatePeriod={handleUpdatePeriod}
                  onRetryPeriod={handleRetryPeriod}
                  onRefreshPeriod={handleRefreshPeriod}
                />
              </CardContent>
            </Card>
          </div>

          {/* Enhanced AI Analysis */}
          <EnhancedAIAnalysis
            periods={periods}
            periodQueries={periodQueries}
            selectedLocations={LOCATIONS.map(l => l.name)}
            onAnalysisComplete={(data) => setAiAnalysis(data)}
          />

          {/* PDF Report Generator */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />PDF Report Generator</CardTitle>
              <CardDescription>
                Generate a PDF report with all period data{aiAnalysis ? ' and AI insights' : ''}. Generate AI analysis first to include it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFReportGenerator
                periods={periods}
                periodQueries={periodQueries}
                acquisitionCosts={acquisitionCosts}
                aiAnalysis={aiAnalysis}
              />
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
