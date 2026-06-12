'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useToast } from '@/hooks/use-toast'
import { PeriodConfig, type AnalysisPeriodResult } from '@/shared/types'

interface PerPeriodAIResult {
  title: string
  summary: string
  keyInsights: string[]
  recommendations: string[]
}

interface AIAnalysis {
  periods: PerPeriodAIResult[]
  comparison: string | null
}

interface PeriodQueryShape {
  data?: AnalysisPeriodResult | null
  isLoading?: boolean
}

interface PDFReportGeneratorProps {
  periods: PeriodConfig[]
  periodQueries: PeriodQueryShape[]
  aiAnalysis?: AIAnalysis | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDollar(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number) {
  return n.toFixed(1) + '%'
}

function fmtDate(d: Date | string | undefined) {
  if (!d) return '-'
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function brand(doc: jsPDF) { doc.setTextColor(28, 31, 79) }
function gray(doc: jsPDF) { doc.setTextColor(100, 100, 100) }
function white(doc: jsPDF) { doc.setTextColor(255, 255, 255) }

function ensureSpace(doc: jsPDF, y: number, needed: number, pageH: number): number {
  if (y + needed > pageH - 20) {
    doc.addPage()
    return 24
  }
  return y
}

function sectionHeader(doc: jsPDF, title: string, y: number, pageW: number): number {
  doc.setFillColor(240, 240, 245)
  doc.rect(16, y - 4, pageW - 32, 10, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  brand(doc)
  doc.text(title.toUpperCase(), 20, y + 3)
  doc.setFont('helvetica', 'normal')
  return y + 12
}

function wrappedText(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH = 5): number {
  const lines = doc.splitTextToSize(String(text), maxW) as string[]
  doc.text(lines, x, y)
  return y + lines.length * lineH
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

function buildPdf(
  periods: PeriodConfig[],
  periodQueries: PeriodQueryShape[],
  aiAnalysis: AIAnalysis | null | undefined,
) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  let y = 0

  // ── Cover page ──────────────────────────────────────────────────────────────
  doc.setFillColor(28, 31, 79)
  doc.rect(0, 0, pageW, 50, 'F')

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  white(doc)
  doc.text('Team Orthodontics', pageW / 2, 22, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Practice Analytics Report', pageW / 2, 33, { align: 'center' })

  doc.setFontSize(9)
  doc.setTextColor(200, 200, 220)
  doc.text(
    'Generated ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    pageW / 2, 43, { align: 'center' }
  )

  y = 65

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  brand(doc)
  doc.text('Analysis Periods', 20, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  gray(doc)
  periods.forEach((p, i) => {
    const q = periodQueries[i]
    const status = q?.data ? '[loaded]' : '[no data]'
    const range = p.startDate && p.endDate
      ? fmtDate(p.startDate) + ' - ' + fmtDate(p.endDate)
      : 'No dates set'
    doc.text(status + '  ' + (p.title || p.name) + '   ' + range, 24, y)
    y += 6
  })

  // ── Per-period pages ─────────────────────────────────────────────────────────
  periods.forEach((period, idx) => {
    const q = periodQueries[idx]
    const data = q?.data
    if (!data) return

    doc.addPage()
    y = 20

    // Period title bar
    doc.setFillColor(28, 31, 79)
    doc.rect(0, 0, pageW, 14, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    white(doc)
    doc.text(period.title || period.name, pageW / 2, 9, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    if (period.startDate && period.endDate) {
      doc.text(fmtDate(period.startDate) + ' - ' + fmtDate(period.endDate), pageW / 2, 13, { align: 'center' })
    }

    y = 24

    // PATIENT FUNNEL
    y = sectionHeader(doc, 'Patient Funnel', y, pageW)
    autoTable(doc, {
      head: [['Stage', 'Count']],
      body: [
        ['NPL (New Patient Leads)', String(data.totals.npl)],
        ['NPE Scheduled', String(data.totals.npe)],
        ['NPE Kept', String(data.totals.npeKept)],
      ],
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [28, 31, 79], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'center' } },
      margin: { left: 16, right: 16 },
    })
    y = (doc as any).lastAutoTable.finalY + 8

    // REFERRAL SOURCES
    const referralEntries = data.referralSources
    if (referralEntries.length > 0) {
      y = ensureSpace(doc, y, 40 + referralEntries.length * 8, pageH)
      y = sectionHeader(doc, 'Referral Sources', y, pageW)
      const total = referralEntries.reduce((s, source) => s + source.npl, 0)

      const rows: string[][] = []
      for (const source of referralEntries) {
        rows.push([
          source.referralType,
          String(source.npl),
          String(source.npeKept),
          fmtPct(source.conversionRate),
        ])
      }
      rows.push(['Total', String(total), '', ''])

      autoTable(doc, {
        head: [['Source', 'NPL', 'NPE Kept', 'Conversion']],
        body: rows,
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: [28, 31, 79], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
        margin: { left: 16, right: 16 },
      })
      y = (doc as any).lastAutoTable.finalY + 8
    }

    // FINANCIAL
    y = ensureSpace(doc, y, 50, pageH)
    y = sectionHeader(doc, 'Financial', y, pageW)
    const financialRows: string[][] = [
      ['Net Production', fmtDollar(data.totals.netProduction)],
      ['Acquisition Costs', '-' + fmtDollar(data.totals.acquisitionCosts)],
      ['Net After Costs', fmtDollar(data.totals.netAfterCosts)],
    ]
    autoTable(doc, {
      head: [['Metric', 'Amount']],
      body: financialRows,
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [28, 31, 79], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 16, right: 16 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  })

  // ── AI ANALYSIS ───────────────────────────────────────────────────────────────
  if (aiAnalysis && aiAnalysis.periods.length > 0) {
    doc.addPage()
    y = 20

    doc.setFillColor(28, 31, 79)
    doc.rect(0, 0, pageW, 14, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    white(doc)
    doc.text('AI Analysis', pageW / 2, 9, { align: 'center' })

    y = 24

    for (const pr of aiAnalysis.periods) {
      y = ensureSpace(doc, y, 30, pageH)
      y = sectionHeader(doc, pr.title, y, pageW)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      gray(doc)
      y = wrappedText(doc, pr.summary, 20, y, pageW - 40) + 4

      if (pr.keyInsights.length > 0) {
        y = ensureSpace(doc, y, 20, pageH)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        brand(doc)
        doc.text('Key Insights', 20, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        gray(doc)
        for (const insight of pr.keyInsights) {
          y = ensureSpace(doc, y, 10, pageH)
          y = wrappedText(doc, '- ' + insight, 24, y, pageW - 44) + 2
        }
        y += 3
      }

      if (pr.recommendations.length > 0) {
        y = ensureSpace(doc, y, 20, pageH)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        brand(doc)
        doc.text('Recommendations', 20, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        gray(doc)
        for (const rec of pr.recommendations) {
          y = ensureSpace(doc, y, 10, pageH)
          y = wrappedText(doc, '> ' + rec, 24, y, pageW - 44) + 2
        }
        y += 5
      }
    }

    if (aiAnalysis.comparison) {
      y = ensureSpace(doc, y, 30, pageH)
      y = sectionHeader(doc, 'Period Comparison', y, pageW)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      gray(doc)
      wrappedText(doc, aiAnalysis.comparison, 20, y, pageW - 40)
    }
  }

  // ── Page numbers ──────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(170, 170, 170)
    doc.text('Page ' + i + ' of ' + totalPages, pageW - 16, pageH - 8, { align: 'right' })
    doc.text('Team Orthodontics - Orthodash', 16, pageH - 8)
  }

  return doc
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PDFReportGenerator({
  periods,
  periodQueries,
  aiAnalysis,
}: PDFReportGeneratorProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const hasData = periodQueries.some((q) => q?.data)

  const generate = useCallback(async () => {
    setIsGenerating(true)
    try {
      const doc = buildPdf(periods, periodQueries, aiAnalysis ?? null)
      const fileName = 'team-ortho-report-' + new Date().toISOString().split('T')[0] + '.pdf'
      doc.save(fileName)
      toast({ title: 'PDF downloaded' })
    } catch (e) {
      console.error('PDF generation error:', e)
      toast({ title: 'Failed to generate PDF', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }, [periods, periodQueries, aiAnalysis, toast])

  return (
    <Button
      onClick={generate}
      disabled={isGenerating || !hasData}
      className="bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </>
      )}
    </Button>
  )
}
