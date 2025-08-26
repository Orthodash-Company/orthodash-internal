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
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Save current session
  const saveSession = useCallback(async (sessionData: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionData,
          userId: user.id
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save session: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: "Session saved successfully",
      });

      // Reload sessions
      await loadSessions();
      return result.data;
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Failed to save session",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, loadSessions]);

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

  // Auto-save current session data
  const autoSaveSession = useCallback(async (data: {
    greyfinchData?: any;
    acquisitionCosts?: any;
    periods?: any[];
    aiSummary?: any;
  }) => {
    if (!user?.id) return;
    
    const sessionName = `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    
    try {
      await saveSession({
        name: sessionName,
        description: "Auto-saved session",
        ...data
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [user?.id, saveSession]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    currentSession,
    isLoading,
    loadSessions,
    saveSession,
    loadSession,
    deleteSession,
    updateSession,
    autoSaveSession,
    setCurrentSession
  };
}
