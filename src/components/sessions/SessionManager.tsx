'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Save, FolderOpen, Trash2, RotateCcw, FileText, Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSessionManager, type PeriodFilterConfig } from '@/hooks/use-session-manager'
import type { PeriodConfig } from '@/shared/types'

const PAGE_SIZE = 5

interface SessionManagerProps {
  periods: PeriodConfig[]
  onRestoreSession: (periodFilters: PeriodFilterConfig[]) => void
}

interface SavedReport {
  id: number
  name: string
  type: string
  createdAt: string
}

const formatDateForFilter = (value: Date | string | undefined): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ── simple pagination helper ──────────────────────────────────────────────────
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1 pt-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      {Array.from({ length: total }, (_, i) => i + 1).map(p => (
        <Button
          key={p}
          type="button"
          variant={p === page ? 'default' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0 text-xs"
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onChange(page + 1)}
        disabled={page === total}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ── reports data hook ─────────────────────────────────────────────────────────
function useReports() {
  const [reports, setReports] = useState<SavedReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/reports')
      if (!res.ok) throw new Error('Failed to load reports')
      const data = await res.json()
      setReports(data.reports ?? [])
    } catch (err) {
      console.error('Error loading reports:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPdf = useCallback(async (id: number): Promise<Blob> => {
    const res = await fetch(`/api/reports/${id}`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to generate PDF')
    return res.blob()
  }, [])

  const viewReport = useCallback(async (report: SavedReport) => {
    const win = window.open('', '_blank')
    if (!win) throw new Error('popup-blocked')
    win.document.title = report.name
    win.document.body.innerHTML = '<div style="font-family:system-ui;padding:24px">Preparing report…</div>'
    setActiveId(report.id)
    try {
      const blob = await fetchPdf(report.id)
      const url = URL.createObjectURL(blob)
      win.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      win.close()
      throw new Error('failed')
    } finally {
      setActiveId(null)
    }
  }, [fetchPdf])

  const downloadReport = useCallback(async (report: SavedReport) => {
    setActiveId(report.id)
    try {
      const blob = await fetchPdf(report.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setActiveId(null)
    }
  }, [fetchPdf])

  const deleteReport = useCallback(async (id: number) => {
    await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    setReports(prev => prev.filter(r => r.id !== id))
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  return { reports, isLoading, activeId, viewReport, downloadReport, deleteReport }
}

// ── component ─────────────────────────────────────────────────────────────────
export function SessionManager({ periods, onRestoreSession }: SessionManagerProps) {
  const { sessions, isLoading: sessionsLoading, saveSession, deleteSession } = useSessionManager()
  const { reports, isLoading: reportsLoading, activeId: reportActiveId, viewReport, downloadReport, deleteReport } = useReports()
  const [saveName, setSaveName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [sessionPage, setSessionPage] = useState(1)
  const [reportPage, setReportPage] = useState(1)
  const { toast } = useToast()

  // newest-first, paginated
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sessions]
  )
  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [reports]
  )

  const sessionPages = Math.max(1, Math.ceil(sortedSessions.length / PAGE_SIZE))
  const reportPages  = Math.max(1, Math.ceil(sortedReports.length  / PAGE_SIZE))

  const visibleSessions = useMemo(() => {
    const start = (sessionPage - 1) * PAGE_SIZE
    return sortedSessions.slice(start, start + PAGE_SIZE)
  }, [sortedSessions, sessionPage])

  const visibleReports = useMemo(() => {
    const start = (reportPage - 1) * PAGE_SIZE
    return sortedReports.slice(start, start + PAGE_SIZE)
  }, [sortedReports, reportPage])

  // clamp pages if items are deleted
  useEffect(() => { setSessionPage(p => Math.min(p, Math.max(1, sessionPages))) }, [sessionPages])
  useEffect(() => { setReportPage(p => Math.min(p, Math.max(1, reportPages))) },  [reportPages])

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!saveName.trim()) {
      toast({ title: 'Name required', description: 'Enter a name for this session.', variant: 'destructive' })
      return
    }
    if (periods.length === 0) {
      toast({ title: 'No periods', description: 'Add at least one analysis period to save.', variant: 'destructive' })
      return
    }
    setIsSaving(true)
    try {
      const periodFilters: PeriodFilterConfig[] = periods.map(p => ({
        id: p.id,
        name: p.name,
        startDate: formatDateForFilter(p.startDate),
        endDate: formatDateForFilter(p.endDate),
        locationIds: p.locationIds ?? [],
      }))
      await saveSession(saveName.trim(), periodFilters)
      setSaveName('')
      setSessionPage(1)
      toast({ title: 'Session saved', description: `"${saveName.trim()}" has been saved.` })
    } catch {
      toast({ title: 'Save failed', description: 'Could not save the session.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestore = (session: { name: string; periods: any[] }) => {
    const filters: PeriodFilterConfig[] = Array.isArray(session.periods) ? session.periods : []
    onRestoreSession(filters)
    toast({ title: 'Session restored', description: `"${session.name}" has been restored. Data will re-fetch.` })
  }

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteSession(sessionId)
    } catch {
      toast({ title: 'Delete failed', description: 'Could not delete the session.', variant: 'destructive' })
    }
  }

  const handleViewReport = async (report: SavedReport) => {
    try {
      await viewReport(report)
    } catch (err: any) {
      toast({
        title: err?.message === 'popup-blocked' ? 'Pop-up blocked' : 'Preview failed',
        description: err?.message === 'popup-blocked' ? 'Allow pop-ups to preview the report.' : 'Could not open the report.',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadReport = async (report: SavedReport) => {
    try {
      await downloadReport(report)
      toast({ title: 'Report downloaded' })
    } catch {
      toast({ title: 'Download failed', description: 'Could not download the report.', variant: 'destructive' })
    }
  }

  const handleDeleteReport = async (reportId: number) => {
    try {
      await deleteReport(reportId)
      toast({ title: 'Report deleted' })
    } catch {
      toast({ title: 'Delete failed', description: 'Could not delete the report.', variant: 'destructive' })
    }
  }

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Sessions ── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1C1F4F]">Saved Sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Save the current period filters to revisit later. Data re-fetches fresh on restore.</p>
        </div>

        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Session name (e.g. Q1 2025 Review)"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <Button
              onClick={handleSave}
              disabled={isSaving || !saveName.trim()}
              className="bg-[#1d1d52] hover:bg-[#1d1d52]/90 shrink-0"
            >
              {isSaving ? 'Saving...' : 'Save Session'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-6">
            {periods.length} period{periods.length !== 1 ? 's' : ''} will be saved
          </p>
        </Card>

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
                  <p className="font-medium text-sm truncate">{session.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {Array.isArray(session.periods) ? session.periods.length : 0}{' '}
                      period{(Array.isArray(session.periods) ? session.periods.length : 0) !== 1 ? 's' : ''}
                    </span>
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
          <Pagination page={sessionPage} total={sessionPages} onChange={setSessionPage} />
        </div>
      </div>

      {/* ── Reports ── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1C1F4F]">Exported Reports</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Each PDF export is automatically logged here.</p>
        </div>

        <div className="space-y-3">
          {reportsLoading && <p className="text-sm text-muted-foreground text-center py-4">Loading reports...</p>}
          {!reportsLoading && sortedReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No exported reports yet</p>
              <p className="text-xs mt-1">Generate a PDF report below — it will appear here automatically.</p>
            </div>
          )}
          {visibleReports.map(report => (
            <Card key={report.id} className="p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-sm truncate">{report.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewReport(report)}
                    disabled={reportActiveId === report.id}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadReport(report)}
                    disabled={reportActiveId === report.id}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteReport(report.id)}
                    disabled={reportActiveId === report.id}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          <Pagination page={reportPage} total={reportPages} onChange={setReportPage} />
        </div>
      </div>

    </div>
  )
}
