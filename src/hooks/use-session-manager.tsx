import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { toast } from '@/hooks/use-toast';

export interface PeriodFilterConfig {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  locationIds: string[];
}

export interface SavedSession {
  id: number;
  name: string;
  periods: PeriodFilterConfig[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
      setSessions((data.sessions ?? []).filter((s: any) => s.isActive !== false));
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

  const saveSession = useCallback(async (name: string, periodFilters: PeriodFilterConfig[]) => {
    if (!user?.id) return;

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, periods: periodFilters }),
    });

    if (!response.ok) throw new Error(`Failed to save session: ${response.status}`);

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

  return { sessions, isLoading, loadSessions, saveSession, deleteSession };
}
