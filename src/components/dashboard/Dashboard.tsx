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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, FileText, BarChart3, RefreshCw, Save, Copy } from 'lucide-react';

import { PeriodConfig, Location, type AnalysisPeriodResult, type PeriodQuery } from '@/shared/types';
import { GILBERT_UUID, PHOENIX_UUID, PRACTICE_TZ } from '@/lib/services/greyfinch/queries';
import { useSessionManager, type PeriodFilterConfig, type SavedSession } from '@/hooks/use-session-manager';
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
    acquisitionCosts: [],
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

const formatDateForSession = (value: Date | string | undefined): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const periodFiltersFromConfigs = (periods: PeriodConfig[]): PeriodFilterConfig[] => {
  return periods.map((period) => ({
    id: period.id,
    name: period.title || period.name,
    startDate: formatDateForSession(period.startDate),
    endDate: formatDateForSession(period.endDate),
    locationIds: period.locationIds ?? [],
    acquisitionCosts: period.acquisitionCosts ?? [],
  }))
}

const serializePeriodFilters = (filters: PeriodFilterConfig[]) => {
  return JSON.stringify(filters.map((filter) => ({
    id: filter.id,
    name: filter.name,
    startDate: filter.startDate,
    endDate: filter.endDate,
    locationIds: filter.locationIds ?? [],
    acquisitionCosts: filter.acquisitionCosts ?? [],
  })))
}

const LOCATIONS: Location[] = [
  { id: 1, name: 'Gilbert', greyfinchId: GILBERT_UUID, timeZone: PRACTICE_TZ, isActive: true },
  { id: 2, name: 'Phoenix-Ahwatukee', greyfinchId: PHOENIX_UUID, timeZone: PRACTICE_TZ, isActive: true },
]

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    sessions,
    isLoading: sessionsLoading,
    saveSession,
    updateSession,
    deleteSession,
  } = useSessionManager();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [periods, setPeriods] = useState<PeriodConfig[]>(() => [createDefaultPeriod()]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [activeSessionName, setActiveSessionName] = useState<string | null>(null);
  const [lastSavedSessionSnapshot, setLastSavedSessionSnapshot] = useState<string | null>(null);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [periodQueries, setPeriodQueries] = useState<PeriodQuery[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<{ periods: { title: string; summary: string; keyInsights: string[]; recommendations: string[] }[]; comparison: string | null } | null>(null);
  const [periodAnalyticsData, setPeriodAnalyticsData] = useState<Record<string, AnalysisPeriodResult | null>>({});
  const [periodAnalyticsLoading, setPeriodAnalyticsLoading] = useState<Record<string, boolean>>({});
  const [periodAnalyticsError, setPeriodAnalyticsError] = useState<Record<string, string | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const lastFetchKeysRef = useRef<Record<string, string>>({});
  const analysisFetchAbortRef = useRef<Record<string, AbortController>>({});
  const analysisFetchSeqRef = useRef<Record<string, number>>({});

  const currentPeriodFilters = useMemo(() => periodFiltersFromConfigs(periods), [periods]);
  const currentSessionSnapshot = useMemo(
    () => serializePeriodFilters(currentPeriodFilters),
    [currentPeriodFilters],
  );
  const hasUnsavedSessionChanges = lastSavedSessionSnapshot !== null && currentSessionSnapshot !== lastSavedSessionSnapshot;

  useEffect(() => {
    if (lastSavedSessionSnapshot === null) {
      setLastSavedSessionSnapshot(currentSessionSnapshot);
    }
  }, [currentSessionSnapshot, lastSavedSessionSnapshot]);

  useEffect(() => {
    if (!hasUnsavedSessionChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedSessionChanges]);

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

  const saveSnapshotForSession = useCallback((session: SavedSession, filters: PeriodFilterConfig[]) => {
    setActiveSessionId(session.id);
    setActiveSessionName(session.name);
    setLastSavedSessionSnapshot(serializePeriodFilters(filters));
  }, []);

  const handleSaveSession = useCallback(async () => {
    if (periods.length === 0) {
      toast({ title: 'No periods', description: 'Add at least one analysis period to save.', variant: 'destructive' });
      return;
    }

    const filters = periodFiltersFromConfigs(periods);
    const sessionName = activeSessionId
      ? activeSessionName
      : window.prompt('Name this session', activeSessionName || 'New Analysis Session')?.trim();

    if (!sessionName) return;

    setSessionSaving(true);
    try {
      const savedSession = activeSessionId
        ? await updateSession(activeSessionId, sessionName, filters)
        : await saveSession(sessionName, filters);

      if (savedSession) {
        saveSnapshotForSession(savedSession, filters);
        toast({ title: activeSessionId ? 'Session updated' : 'Session saved', description: `"${sessionName}" is up to date.` });
      }
    } catch {
      toast({ title: 'Save failed', description: 'Could not save the session.', variant: 'destructive' });
    } finally {
      setSessionSaving(false);
    }
  }, [activeSessionId, activeSessionName, periods, saveSession, saveSnapshotForSession, toast, updateSession]);

  const handleSaveAsSession = useCallback(async () => {
    if (periods.length === 0) {
      toast({ title: 'No periods', description: 'Add at least one analysis period to save.', variant: 'destructive' });
      return;
    }

    const defaultName = activeSessionName ? `${activeSessionName} Copy` : 'New Analysis Session';
    const sessionName = window.prompt('Save as', defaultName)?.trim();
    if (!sessionName) return;

    const filters = periodFiltersFromConfigs(periods);
    setSessionSaving(true);
    try {
      const savedSession = await saveSession(sessionName, filters);
      if (savedSession) {
        saveSnapshotForSession(savedSession, filters);
        toast({ title: 'Session saved', description: `"${sessionName}" has been saved.` });
      }
    } catch {
      toast({ title: 'Save failed', description: 'Could not save the session.', variant: 'destructive' });
    } finally {
      setSessionSaving(false);
    }
  }, [activeSessionName, periods, saveSession, saveSnapshotForSession, toast]);

  const handleDeleteSession = useCallback(async (sessionId: number) => {
    await deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setActiveSessionName(null);
      setLastSavedSessionSnapshot(null);
    }
  }, [activeSessionId, deleteSession]);

  const handleClearData = () => {
    if (hasUnsavedSessionChanges && !window.confirm('You have unsaved session changes. Clear data anyway?')) {
      return;
    }

    if (window.confirm('Are you sure you want to clear all data? This will remove all analysis periods, costs, and data. This action cannot be undone.')) {
      Object.values(analysisFetchAbortRef.current).forEach((controller) => controller.abort());
      analysisFetchAbortRef.current = {};
      analysisFetchSeqRef.current = {};
      lastFetchKeysRef.current = {};
      setPeriods([]);
      setPeriodQueries([]);
      setPeriodAnalyticsData({});
      setPeriodAnalyticsLoading({});
      setPeriodAnalyticsError({});
      setAiAnalysis(null);
      setActiveSessionId(null);
      setActiveSessionName(null);
      setLastSavedSessionSnapshot(serializePeriodFilters([]));
      localStorage.removeItem('orthodash-sessions');
    }
  };


  const buildApiPeriod = useCallback((period: PeriodConfig) => {
    if (!period.startDate || !period.endDate) return null
    const selectedIds = period.locationIds || []
    const greyfinchLocationIds = (selectedIds.length > 0
      ? selectedIds.map((id) => LOCATIONS.find((l) => l.id.toString() === id)?.greyfinchId)
      : LOCATIONS.map((l) => l.greyfinchId)
    ).filter(Boolean) as string[]
    if (greyfinchLocationIds.length === 0) return null

    return {
      id: period.id,
      name: period.title || period.name,
      startDate: formatLocalDateForApi(period.startDate),
      endDate: formatLocalDateForApi(period.endDate),
      locationIds: greyfinchLocationIds,
      acquisitionCosts: period.acquisitionCosts ?? [],
    }
  }, [])

  const fetchAnalysisPeriods = useCallback(async (targetPeriods: PeriodConfig[], refresh = false) => {
    const apiPeriods = targetPeriods.map(buildApiPeriod).filter(Boolean)
    if (apiPeriods.length === 0) return

    const controller = new AbortController();

    const loadingIds = apiPeriods.map((period) => period!.id)
    for (const id of loadingIds) {
      analysisFetchAbortRef.current[id]?.abort()
      analysisFetchAbortRef.current[id] = controller
      analysisFetchSeqRef.current[id] = (analysisFetchSeqRef.current[id] ?? 0) + 1
    }
    const fetchSeqById = Object.fromEntries(
      loadingIds.map((id) => [id, analysisFetchSeqRef.current[id] ?? 0])
    )
    const activeIds = () => loadingIds.filter((id) => analysisFetchSeqRef.current[id] === fetchSeqById[id])

    setPeriodAnalyticsLoading((prev) => ({
      ...prev,
      ...Object.fromEntries(loadingIds.map((id) => [id, true])),
    }))
    setPeriodAnalyticsError((prev) => ({
      ...prev,
      ...Object.fromEntries(loadingIds.map((id) => [id, null])),
    }))

    try {
      const res = await fetch('/api/analysis-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ periods: apiPeriods, refresh }),
      });
      const json = await res.json();
      const ids = activeIds()
      if (ids.length === 0) return;
      if (json.success && Array.isArray(json.periods)) {
        const activeIdSet = new Set(ids)
        setPeriodAnalyticsData((prev) => ({
          ...prev,
          ...Object.fromEntries(
            json.periods
              .filter((result: AnalysisPeriodResult) => activeIdSet.has(result.periodId))
              .map((result: AnalysisPeriodResult) => [result.periodId, result])
          ),
        }));
      } else {
        const message = typeof json.error === 'string' ? json.error : 'Fetch failed'
        const ids = activeIds()
        setPeriodAnalyticsError((prev) => ({
          ...prev,
          ...Object.fromEntries(ids.map((id) => [id, message])),
        }))
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const ids = activeIds()
      if (ids.length === 0) return;
      setPeriodAnalyticsError((prev) => ({
        ...prev,
        ...Object.fromEntries(ids.map((id) => [id, String(e)])),
      }))
    } finally {
      const ids = activeIds()
      if (ids.length === 0) return;
      setPeriodAnalyticsLoading((prev) => ({
        ...prev,
        ...Object.fromEntries(ids.map((id) => [id, false])),
      }))
      for (const id of ids) {
        if (analysisFetchAbortRef.current[id] === controller) {
          delete analysisFetchAbortRef.current[id]
        }
      }
    }
  }, [buildApiPeriod]);

  useEffect(() => {
    return () => {
      Object.values(analysisFetchAbortRef.current).forEach((controller) => controller.abort());
    };
  }, []);

  // Trigger analysis fetch when period definitions change
  useEffect(() => {
    const currentIds = new Set(periods.map((period) => period.id))
    const changedPeriods: PeriodConfig[] = []

    for (const period of periods) {
      const apiPeriod = buildApiPeriod(period)
      const key = JSON.stringify(apiPeriod)
      if (key !== lastFetchKeysRef.current[period.id]) {
        lastFetchKeysRef.current[period.id] = key
        if (apiPeriod) changedPeriods.push(period)
      }
    }

    for (const id of Object.keys(lastFetchKeysRef.current)) {
      if (!currentIds.has(id)) {
        analysisFetchAbortRef.current[id]?.abort()
        delete analysisFetchAbortRef.current[id]
        delete analysisFetchSeqRef.current[id]
        delete lastFetchKeysRef.current[id]
      }
    }

    if (changedPeriods.length > 0) {
      void fetchAnalysisPeriods(changedPeriods, false)
    }
  }, [periods, buildApiPeriod, fetchAnalysisPeriods]);

  // Build periodQueries from fetched period analysis
  const periodQueriesMemo = useMemo((): PeriodQuery[] => {
    return periods.map((period) => {
      return {
        data: periodAnalyticsData[period.id] ?? null,
        isLoading: periodAnalyticsLoading[period.id] ?? false,
        error: periodAnalyticsError[period.id] ?? null,
      }
    })
  }, [periods, periodAnalyticsData, periodAnalyticsLoading, periodAnalyticsError]);

  useEffect(() => {
    setPeriodQueries(periodQueriesMemo);
  }, [periodQueriesMemo]);

  // Retry a failed period fetch by clearing cached error and re-fetching
  const handleRetryPeriod = useCallback((periodId: string) => {
    const period = periods.find((p) => p.id === periodId)
    if (!period) return
    delete lastFetchKeysRef.current[periodId]
    void fetchAnalysisPeriods([period], false)
  }, [periods, fetchAnalysisPeriods]);

  // Bypass cache and re-fetch one period fresh from Greyfinch
  const handleRefreshPeriod = useCallback((periodId: string) => {
    const period = periods.find((p) => p.id === periodId)
    if (!period) return
    delete lastFetchKeysRef.current[periodId]
    void fetchAnalysisPeriods([period], true)
  }, [periods, fetchAnalysisPeriods]);

  // Bypass cache and re-fetch all periods fresh from Greyfinch
  const handleRefreshAllPeriods = useCallback(() => {
    lastFetchKeysRef.current = {}
    void fetchAnalysisPeriods(periods, true)
  }, [periods, fetchAnalysisPeriods]);

  // Restore a saved session — re-populate period configs so data re-fetches fresh
  const handleRestoreSession = useCallback((session: SavedSession) => {
    if (hasUnsavedSessionChanges && !window.confirm('You have unsaved session changes. Restore another session and discard them?')) {
      return false;
    }

    const periodFilters = Array.isArray(session.periods) ? session.periods : [];
    const restored: PeriodConfig[] = periodFilters.map(f => ({
      id: f.id,
      name: f.name,
      title: f.name,
      locationId: 'all',
      locationIds: f.locationIds ?? [],
      startDate: f.startDate ? new Date(`${f.startDate}T00:00:00`) : undefined,
      endDate: f.endDate ? new Date(`${f.endDate}T00:00:00`) : undefined,
      acquisitionCosts: f.acquisitionCosts ?? [],
      visualizations: [],
    }))
    setPeriods(restored);
    setActiveSessionId(session.id);
    setActiveSessionName(session.name);
    setLastSavedSessionSnapshot(serializePeriodFilters(periodFilters));
    return true;
  }, [hasUnsavedSessionChanges]);

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
                      sessions={sessions}
                      sessionsLoading={sessionsLoading}
                      onRestoreSession={handleRestoreSession}
                      onDeleteSession={handleDeleteSession}
                      activeSessionId={activeSessionId}
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
            <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#1C1F4F]/50" />
                  <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[#1C1F4F]/40">Analysis Periods</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#1C1F4F]/50">
                  <span className="font-medium text-[#1C1F4F]/70">{activeSessionName || 'Unsaved Session'}</span>
                  {hasUnsavedSessionChanges && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Unsaved changes
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide border-[#1C1F4F]/10 text-[#1C1F4F]/60 hover:text-[#1C1F4F]"
                  onClick={handleSaveSession}
                  disabled={periods.length === 0 || sessionSaving}
                >
                  <Save className="h-3 w-3" />
                  {sessionSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide border-[#1C1F4F]/10 text-[#1C1F4F]/60 hover:text-[#1C1F4F]"
                  onClick={handleSaveAsSession}
                  disabled={periods.length === 0 || sessionSaving}
                >
                  <Copy className="h-3 w-3" />
                  Save As
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide border-[#1C1F4F]/10 text-[#1C1F4F]/50 hover:text-[#1C1F4F]"
                  onClick={handleRefreshAllPeriods}
                  disabled={periods.length === 0 || Object.values(periodAnalyticsLoading).some(Boolean)}
                >
                  <RefreshCw className={`h-3 w-3 ${Object.values(periodAnalyticsLoading).some(Boolean) ? 'animate-spin' : ''}`} />
                  Refresh All
                </Button>
                <button
                  onClick={handleClearData}
                  className="text-[10px] font-medium text-[#1C1F4F]/30 hover:text-red-500 transition-colors tracking-wide uppercase"
                >
                  Clear Data
                </button>
              </div>
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
                aiAnalysis={aiAnalysis}
              />
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
