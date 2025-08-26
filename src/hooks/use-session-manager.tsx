import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { toast } from '@/hooks/use-toast';

interface SessionData {
  id?: number;
  name: string;
  description?: string;
  greyfinchData?: any;
  acquisitionCosts?: any;
  periods?: any[];
  aiSummary?: any;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export function useSessionManager() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [cachedData, setCachedData] = useState<any>(null);

  // Load all sessions
  const loadSessions = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Don't show error toast for session loading failures
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Cache current session data (no API call)
  const cacheSessionData = useCallback((sessionData: {
    greyfinchData?: any;
    acquisitionCosts?: any;
    periods?: any[];
    aiSummary?: any;
  }) => {
    const sessionName = `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    
    const cachedSession = {
      name: sessionName,
      description: "Cached session data",
      ...sessionData,
      cachedAt: new Date().toISOString()
    };
    
    setCachedData(cachedSession);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('orthodash_cached_session', JSON.stringify(cachedSession));
    }
  }, []);

  // Save cached session to database (only called on page exit/refresh)
  const saveCachedSession = useCallback(async () => {
    if (!user?.id || !cachedData) return;
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...cachedData,
          userId: user.id
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save session: ${response.status}`);
      }

      const result = await response.json();
      console.log('Session saved successfully:', result);
      
      // Clear cached data after successful save
      setCachedData(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orthodash_cached_session');
      }
      
      // Reload sessions
      await loadSessions();
      return result.data;
    } catch (error) {
      console.error('Error saving session:', error);
      // Don't show error toast - this is background operation
    }
  }, [user?.id, cachedData, loadSessions]);

  // Load a specific session
  const loadSession = useCallback(async (sessionId: number) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }
      const session = await response.json();
      setCurrentSession(session);
      return session;
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Error",
        description: "Failed to load session",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: number) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Session deleted successfully",
      });

      // Reload sessions
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, loadSessions]);

  // Update a session
  const updateSession = useCallback(async (sessionId: number, sessionData: Partial<SessionData>) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionData,
          userId: user.id
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: "Session updated successfully",
      });

      // Reload sessions
      await loadSessions();
      return result.data;
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, loadSessions]);

  // Load cached session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('orthodash_cached_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCachedData(parsed);
        } catch (error) {
          console.error('Error parsing cached session:', error);
        }
      }
    }
  }, []);

  // Save session on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (cachedData) {
        // Use sendBeacon for reliable data sending on page unload
        const data = JSON.stringify({
          ...cachedData,
          userId: user?.id
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/sessions', data);
        } else {
          // Fallback to synchronous XMLHttpRequest
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/sessions', false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cachedData, user?.id]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    currentSession,
    cachedData,
    isLoading,
    loadSessions,
    cacheSessionData,
    saveCachedSession,
    loadSession,
    deleteSession,
    updateSession,
    setCurrentSession
  };
}
