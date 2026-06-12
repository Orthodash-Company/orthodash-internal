'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { FolderOpen, Trash2, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SavedSession } from '@/hooks/use-session-manager'

const PAGE_SIZE = 5

interface SessionManagerProps {
  sessions: SavedSession[]
  sessionsLoading: boolean
  onRestoreSession: (session: SavedSession) => boolean
  onDeleteSession: (sessionId: number) => Promise<void>
  activeSessionId?: number | null
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1 pt-1">
      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => onChange(page - 1)} disabled={page === 1}>
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      {Array.from({ length: total }, (_, i) => i + 1).map(p => (
        <Button key={p} type="button" variant={p === page ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => onChange(p)}>
          {p}
        </Button>
      ))}
      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => onChange(page + 1)} disabled={page === total}>
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function SessionManager({ sessions, sessionsLoading, onRestoreSession, onDeleteSession, activeSessionId }: SessionManagerProps) {
  const [sessionPage, setSessionPage] = useState(1)
  const { toast } = useToast()

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sessions]
  )

  const sessionPages = Math.max(1, Math.ceil(sortedSessions.length / PAGE_SIZE))
  const safeSessionPage = Math.min(sessionPage, sessionPages)

  const visibleSessions = useMemo(() => {
    const start = (safeSessionPage - 1) * PAGE_SIZE
    return sortedSessions.slice(start, start + PAGE_SIZE)
  }, [sortedSessions, safeSessionPage])

  const handleRestore = (session: SavedSession) => {
    const restored = onRestoreSession(session)
    if (restored) {
      toast({ title: 'Session restored', description: `"${session.name}" has been restored. Data will re-fetch.` })
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await onDeleteSession(sessionId)
    } catch {
      toast({ title: 'Delete failed', description: 'Could not delete the session.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#1C1F4F]">Saved Sessions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Restore prior period definitions. Use Save or Save As above Analysis Periods to store changes.</p>
      </div>

      <div className="space-y-3">
        {sessionsLoading && <p className="text-sm text-muted-foreground text-center py-4">Loading sessions...</p>}
        {!sessionsLoading && sortedSessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No saved sessions yet</p>
          </div>
        )}
        {visibleSessions.map(session => (
          <Card key={session.id} className="p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {session.name}
                  {activeSessionId === session.id && <span className="ml-2 text-[10px] uppercase tracking-wide text-[#1C1F4F]/40">Current</span>}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{Array.isArray(session.periods) ? session.periods.length : 0}{' '}period{(Array.isArray(session.periods) ? session.periods.length : 0) !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleRestore(session)}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Restore
                </Button>
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteSession(session.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        <Pagination page={safeSessionPage} total={sessionPages} onChange={setSessionPage} />
      </div>
    </div>
  )
}
