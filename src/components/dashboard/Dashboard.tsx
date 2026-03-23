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
import { Button } from '@/components/ui/button';
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
  const [aiSummary, setAiSummary] = useState<Record<string, unknown> | null>(null);
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
      setAiSummary(null);
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tabs Container */}
          <Card className="shadow-sm" ref={tabsRef}>
            <CardHeader className="pb-4">
              <Tabs value={activeTab || "export"} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-10 sm:h-12 bg-[#1C1F4F]/5 border border-[#1C1F4F]/10">
                  <TabsTrigger
                    value="export"
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 text-xs sm:text-sm"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Sessions & Reports
                  </TabsTrigger>
                  <TabsTrigger
                    value="connections"
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 text-xs sm:text-sm"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Connections
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="export" className="mt-6">
                  <SessionManager
                    periods={periods}
                    onRestoreSession={handleRestoreSession}
                  />
                </TabsContent>

                <TabsContent value="connections" className="mt-6">
                  <ConnectionsTab />
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

          {/* Enhanced AI Analysis */}
          <EnhancedAIAnalysis
            periods={periods}
            periodQueries={periodQueries}
            selectedLocations={LOCATIONS.map(l => l.name)}
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
                greyfinchData={null}
                periods={periods}
                acquisitionCosts={acquisitionCosts}
                aiSummary={aiSummary}
                selectedPeriod={periods.length > 0 ? periods[0] : undefined}
                selectedCharts={[]}
                periodData={periods.length > 0 ? (periodQueries[0]?.data ?? undefined) : undefined}
              />
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
