'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PeriodConfig, type AnalysisPeriodResult } from '@/shared/types'

interface PeriodQueryShape {
  data?: AnalysisPeriodResult | null
  isLoading?: boolean
  error?: unknown
}

interface EnhancedAIAnalysisProps {
  periods?: PeriodConfig[]
  periodQueries?: PeriodQueryShape[]
  selectedLocations?: string[]
  onAnalysisComplete?: (data: AnalysisResult) => void
}

type PerPeriodResult = {
  title: string
  summary: string
  keyInsights: string[]
  recommendations: string[]
}

type AnalysisResult = {
  periods: PerPeriodResult[]
  comparison: string | null
}

function formatDate(d: Date | string | undefined) {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function EnhancedAIAnalysis({
  periods = [],
  periodQueries = [],
  onAnalysisComplete,
}: EnhancedAIAnalysisProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasData = periodQueries.some((q) => q?.data)
  const isAnyLoading = periodQueries.some((q) => q?.isLoading)

  const generate = useCallback(async () => {
    const payload = periods
      .map((period, i) => {
        const q = periodQueries[i]
        const d = q?.data
        if (!d) return null
        return {
          title: period.title || period.name,
          startDate: formatDate(period.startDate),
          endDate: formatDate(period.endDate),
          data: {
            totals: d.totals,
            referralSources: d.referralSources,
            unmappedReferralPatientCount: d.unmappedReferralPatients.length,
          },
        }
      })
      .filter(Boolean)

    if (payload.length === 0) {
      setError('No periods with loaded data. Wait for data to finish loading.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periods: payload }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed')
      const analysisResult: AnalysisResult = { periods: json.periods ?? [], comparison: json.comparison ?? null }
      setResult(analysisResult)
      onAnalysisComplete?.(analysisResult)
      toast({ title: 'Analysis complete' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      toast({ title: 'Analysis failed', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [periods, periodQueries, toast])

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#1C1F4F]/50" />
          <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[#1C1F4F]/40">AI Analysis</span>
        </div>
        <Button
          size="sm"
          onClick={generate}
          disabled={isLoading || isAnyLoading || !hasData}
          className="h-7 px-3 text-xs bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white rounded-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 mr-1.5" />
              {result ? 'Regenerate' : 'Generate Analysis'}
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* No data yet placeholder */}
      {!result && !isLoading && !error && (
        <Card className="shadow-sm border border-[#1C1F4F]/10">
          <CardContent className="py-8 text-center">
            <Sparkles className="h-6 w-6 text-[#1C1F4F]/20 mx-auto mb-2" />
            <p className="text-sm text-[#1C1F4F]/40">
              {!hasData
                ? 'Load period data first, then generate an AI analysis.'
                : 'Click "Generate Analysis" to get AI-powered insights for each period.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {periods.map((p) => (
            <Card key={p.id} className="shadow-sm border border-[#1C1F4F]/10 animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-3 w-24 bg-[#1C1F4F]/10 rounded" />
                <div className="h-4 w-32 bg-[#1C1F4F]/10 rounded mt-1" />
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                <div className="h-3 w-full bg-[#1C1F4F]/10 rounded" />
                <div className="h-3 w-4/5 bg-[#1C1F4F]/10 rounded" />
                <div className="h-3 w-3/5 bg-[#1C1F4F]/10 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Per-period results */}
      {result && !isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.periods.map((periodResult, i) => (
              <Card key={i} className="shadow-sm border border-[#1C1F4F]/10 flex flex-col">
                <CardHeader className="pb-2">
                  <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1C1F4F]/40 mb-0.5">
                    AI Analysis
                  </div>
                  <div className="text-sm font-semibold text-[#1C1F4F]">{periodResult.title}</div>
                </CardHeader>

                <CardContent className="space-y-4 pb-5 flex-1">
                  {/* Summary */}
                  <p className="text-xs text-[#1C1F4F]/70 leading-relaxed">{periodResult.summary}</p>

                  {/* Key Insights */}
                  {periodResult.keyInsights.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1C1F4F]/40 mb-2">
                        Key Insights
                      </div>
                      <ul className="space-y-1.5">
                        {periodResult.keyInsights.map((insight, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 text-[#1C1F4F]/30 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-[#1C1F4F]/70">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {periodResult.recommendations.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1C1F4F]/40 mb-2">
                        Recommendations
                      </div>
                      <ul className="space-y-1.5">
                        {periodResult.recommendations.map((rec, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1C1F4F]/30 mt-1.5 flex-shrink-0" />
                            <span className="text-xs text-[#1C1F4F]/70">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cross-period comparison */}
          {result.comparison && (
            <Card className="shadow-sm border border-[#1C1F4F]/10">
              <CardContent className="py-4 px-5">
                <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1C1F4F]/40 mb-1.5">
                  Period Comparison
                </div>
                <p className="text-xs text-[#1C1F4F]/70 leading-relaxed">{result.comparison}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
