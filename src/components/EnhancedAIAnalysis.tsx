'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Download, Share2, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target } from 'lucide-react'
import { toast } from 'sonner'

interface AIAnalysisData {
  success: boolean
  analysisType: string
  period: string
  summary: {
    overview: string
    keyInsights: string[]
    performanceMetrics: {
      totalProduction: number
      totalRevenue: number
      totalNetProduction: number
      profitMargin: number
      roi: number
      noShowRate: number
    }
  }
  locationComparison: {
    gilbert: {
      performance: {
        patients: number
        appointments: number
        leads: number
        production: number
        revenue: number
        netProduction: number
        acquisitionCosts: number
      }
      insights: string[]
    }
    phoenix: {
      performance: {
        patients: number
        appointments: number
        leads: number
        production: number
        revenue: number
        netProduction: number
        acquisitionCosts: number
      }
      insights: string[]
    }
  }
  trends: {
    weekly: Array<{ week: string; gilbert: number; phoenix: number; total: number }>
    monthly: Array<{ month: string; gilbert: number; phoenix: number; total: number }>
    analysis: string
  }
  recommendations?: {
    immediate: string[]
    strategic: string[]
    financial: string[]
  }
  dataQuality: {
    completeness: string
    recommendations: string[]
  }
  generatedAt: string
}

interface EnhancedAIAnalysisProps {
  selectedPeriods?: string[]
  selectedLocations?: string[]
  onAnalysisComplete?: (data: AIAnalysisData) => void
}

export function EnhancedAIAnalysis({ 
  selectedPeriods = [], 
  selectedLocations = [],
  onAnalysisComplete 
}: EnhancedAIAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState<AIAnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateAnalysis = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🤖 Generating comprehensive AI analysis...')
      
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: selectedPeriods.length > 0 ? selectedPeriods[0] : undefined,
          endDate: selectedPeriods.length > 1 ? selectedPeriods[selectedPeriods.length - 1] : undefined,
          location: selectedLocations.length > 0 ? selectedLocations.join(',') : 'all',
          analysisType: 'comprehensive',
          includeRecommendations: true
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate analysis')
      }

      setAnalysisData(data)
      onAnalysisComplete?.(data)
      
      toast.success('AI Analysis completed successfully!')
      console.log('✅ AI Analysis completed:', data)
      
    } catch (error) {
      console.error('❌ AI Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate analysis')
      toast.error('Failed to generate AI analysis')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriods, selectedLocations, onAnalysisComplete])

  const downloadReport = useCallback(() => {
    if (!analysisData) return

    const reportContent = `
# Orthodash Practice Analysis Report
Generated: ${new Date(analysisData.generatedAt).toLocaleDateString()}
Period: ${analysisData.period}

## Executive Summary
${analysisData.summary.overview}

## Key Performance Metrics
- Total Production: $${analysisData.summary.performanceMetrics.totalProduction.toLocaleString()}
- Total Revenue: $${analysisData.summary.performanceMetrics.totalRevenue.toLocaleString()}
- Net Production: $${analysisData.summary.performanceMetrics.totalNetProduction.toLocaleString()}
- Profit Margin: ${analysisData.summary.performanceMetrics.profitMargin.toFixed(1)}%
- ROI: ${analysisData.summary.performanceMetrics.roi.toFixed(1)}%
- No-Show Rate: ${analysisData.summary.performanceMetrics.noShowRate.toFixed(1)}%

## Key Insights
${analysisData.summary.keyInsights.map(insight => `- ${insight}`).join('\n')}

## Location Performance Comparison

### Gilbert Location
- Patients: ${analysisData.locationComparison.gilbert.performance.patients}
- Appointments: ${analysisData.locationComparison.gilbert.performance.appointments}
- Production: $${analysisData.locationComparison.gilbert.performance.production.toLocaleString()}
- Revenue: $${analysisData.locationComparison.gilbert.performance.revenue.toLocaleString()}
- Net Production: $${analysisData.locationComparison.gilbert.performance.netProduction.toLocaleString()}

### Phoenix-Ahwatukee Location
- Patients: ${analysisData.locationComparison.phoenix.performance.patients}
- Appointments: ${analysisData.locationComparison.phoenix.performance.appointments}
- Production: $${analysisData.locationComparison.phoenix.performance.production.toLocaleString()}
- Revenue: $${analysisData.locationComparison.phoenix.performance.revenue.toLocaleString()}
- Net Production: $${analysisData.locationComparison.phoenix.performance.netProduction.toLocaleString()}

## Recommendations
${analysisData.recommendations ? `
### Immediate Actions
${analysisData.recommendations.immediate.map(rec => `- ${rec}`).join('\n')}

### Strategic Recommendations
${analysisData.recommendations.strategic.map(rec => `- ${rec}`).join('\n')}

### Financial Optimization
${analysisData.recommendations.financial.map(rec => `- ${rec}`).join('\n')}
` : ''}

## Data Quality Assessment
${analysisData.dataQuality.completeness}

### Data Quality Recommendations
${analysisData.dataQuality.recommendations.map(rec => `- ${rec}`).join('\n')}
`

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orthodash-analysis-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Report downloaded successfully!')
  }, [analysisData])

  const shareReport = useCallback(() => {
    if (!analysisData) return
    
    const shareText = `Orthodash Practice Analysis Report - ${analysisData.period}\n\n` +
      `Key Insights:\n${analysisData.summary.keyInsights.slice(0, 3).map(insight => `• ${insight}`).join('\n')}\n\n` +
      `Total Production: $${analysisData.summary.performanceMetrics.totalProduction.toLocaleString()}\n` +
      `Profit Margin: ${analysisData.summary.performanceMetrics.profitMargin.toFixed(1)}%\n\n` +
      `Generated: ${new Date(analysisData.generatedAt).toLocaleDateString()}`

    if (navigator.share) {
      navigator.share({
        title: 'Orthodash Practice Analysis',
        text: shareText,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success('Report summary copied to clipboard!')
    }
  }, [analysisData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI-Powered Practice Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of Gilbert and Phoenix-Ahwatukee locations with actionable insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={generateAnalysis} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" />
              )}
              {isLoading ? 'Analyzing...' : 'Generate Analysis'}
            </Button>
            
            {analysisData && (
              <>
                <Button 
                  variant="outline" 
                  onClick={downloadReport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={shareReport}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisData && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>Period: {analysisData.period}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysisData.summary.overview}</p>
            </CardContent>
          </Card>

          {/* Key Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Total Production</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(analysisData.summary.performanceMetrics.totalProduction)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(analysisData.summary.performanceMetrics.totalRevenue)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Profit Margin</span>
                  </div>
                  <p className="text-2xl font-bold">{formatPercentage(analysisData.summary.performanceMetrics.profitMargin)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">ROI</span>
                  </div>
                  <p className="text-2xl font-bold">{formatPercentage(analysisData.summary.performanceMetrics.roi)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">No-Show Rate</span>
                  </div>
                  <p className="text-2xl font-bold">{formatPercentage(analysisData.summary.performanceMetrics.noShowRate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.summary.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Location Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Gilbert */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Gilbert</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">Patients</span>
                      </div>
                      <p className="text-lg font-semibold">{analysisData.locationComparison.gilbert.performance.patients}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">Appointments</span>
                      </div>
                      <p className="text-lg font-semibold">{analysisData.locationComparison.gilbert.performance.appointments}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">Production</span>
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(analysisData.locationComparison.gilbert.performance.production)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">Revenue</span>
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(analysisData.locationComparison.gilbert.performance.revenue)}</p>
                    </div>
                  </div>
                  {analysisData.locationComparison.gilbert.insights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Insights:</p>
                      {analysisData.locationComparison.gilbert.insights.map((insight, index) => (
                        <p key={index} className="text-xs text-muted-foreground">• {insight}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phoenix */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Phoenix-Ahwatukee</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">Patients</span>
                      </div>
                      <p className="text-lg font-semibold">{analysisData.locationComparison.phoenix.performance.patients}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">Appointments</span>
                      </div>
                      <p className="text-lg font-semibold">{analysisData.locationComparison.phoenix.performance.appointments}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">Production</span>
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(analysisData.locationComparison.phoenix.performance.production)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">Revenue</span>
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(analysisData.locationComparison.phoenix.performance.revenue)}</p>
                    </div>
                  </div>
                  {analysisData.locationComparison.phoenix.insights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Insights:</p>
                      {analysisData.locationComparison.phoenix.insights.map((insight, index) => (
                        <p key={index} className="text-xs text-muted-foreground">• {insight}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysisData.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle>Strategic Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Immediate Actions */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Immediate Actions</h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.immediate.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Strategic Recommendations */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Strategic Recommendations</h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.strategic.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Financial Optimization */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Financial Optimization</h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.financial.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Quality */}
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">{analysisData.dataQuality.completeness}</p>
                <div>
                  <p className="text-sm font-medium mb-2">Recommendations:</p>
                  <div className="space-y-1">
                    {analysisData.dataQuality.recommendations.map((rec, index) => (
                      <p key={index} className="text-xs text-muted-foreground">• {rec}</p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
