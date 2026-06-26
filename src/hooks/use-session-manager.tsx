import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { toast } from '@/hooks/use-toast';
import type { CompactCost } from '@/shared/types';

export interface PeriodFilterConfig {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  locationIds: string[];
  referralSources?: string[];
  referralSource?: string; // Legacy single-select sessions
  acquisitionCosts?: CompactCost[];
}

export interface SavedSession {
  id: number;
  name: string;
  periods: PeriodFilterConfig[];
  snapshotStartDate?: string;
  snapshotEndDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Normalises the raw jsonb stored in the DB — handles the old array format
// (just PeriodFilterConfig[]) and the new object format that also carries
// snapshot dates.
function normalizeSession(raw: Record<string, unknown>): SavedSession {
  let periods: PeriodFilterConfig[] = []
  let snapshotStartDate: string | undefined
  let snapshotEndDate: string | undefined

  if (Array.isArray(raw.periods)) {
    // Legacy format: periods column is a plain array
    periods = raw.periods as PeriodFilterConfig[]
  } else if (raw.periods && typeof raw.periods === 'object') {
    // New format: { periods, snapshotStartDate, snapshotEndDate }
    const p = raw.periods as Record<string, unknown>
    periods = Array.isArray(p.periods) ? (p.periods as PeriodFilterConfig[]) : []
    snapshotStartDate = typeof p.snapshotStartDate === 'string' ? p.snapshotStartDate : undefined
    snapshotEndDate   = typeof p.snapshotEndDate   === 'string' ? p.snapshotEndDate   : undefined
  }

  return {
    id:          raw.id          as number,
    name:        raw.name        as string,
    periods,
    snapshotStartDate,
    snapshotEndDate,
    isActive:    raw.isActive    as boolean,
    createdAt:   raw.createdAt   as string,
    updatedAt:   raw.updatedAt   as string,
  }
}

export function useSessionManager() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const loadSessions = useCallback(async () => {
    if (!user?.id) {
      loadAbortRef.current?.abort();
      setSessions([]);
      setIsLoading(false);
      return;
    }

    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions', { signal: controller.signal });
      if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.status}`);
      const data = await response.json();
      const normalized = (data.sessions ?? [])
        .filter((s: Record<string, unknown>) => s.isActive !== false)
        .map(normalizeSession)
      setSessions(normalized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Error loading sessions:', error);
    } finally {
      if (loadAbortRef.current === controller) {
        loadAbortRef.current = null;
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  const saveSession = useCallback(async (
    name: string,
    periodFilters: PeriodFilterConfig[],
    snapshotStartDate?: string,
    snapshotEndDate?: string,
  ) => {
    if (!user?.id) return;

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, periods: periodFilters, snapshotStartDate, snapshotEndDate }),
    });

    if (!response.ok) throw new Error(`Failed to save session: ${response.status}`);

    const result = await response.json();
    await loadSessions();
    return result.session as SavedSession;
  }, [user?.id, loadSessions]);

  const updateSession = useCallback(async (
    sessionId: number,
    name: string,
    periodFilters: PeriodFilterConfig[],
    snapshotStartDate?: string,
    snapshotEndDate?: string,
  ) => {
    if (!user?.id) return;

    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, periods: periodFilters, snapshotStartDate, snapshotEndDate }),
    });

    if (!response.ok) throw new Error(`Failed to update session: ${response.status}`);

    const result = await response.json();
    await loadSessions();
    return result.session as SavedSession;
  }, [user?.id, loadSessions]);

  const deleteSession = useCallback(async (sessionId: number) => {
    if (!user?.id) return;

    const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete session: ${response.status}`);

    toast({ title: 'Session deleted' });
    await loadSessions();
  }, [user?.id, loadSessions]);

  useEffect(() => {
    loadSessions();
    return () => { loadAbortRef.current?.abort(); };
  }, [loadSessions]);

  return { sessions, isLoading, loadSessions, saveSession, updateSession, deleteSession };
}
