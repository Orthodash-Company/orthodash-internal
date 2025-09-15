'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Brain, TrendingUp, DollarSign, Users, Calendar, Target, Eye, EyeOff } from 'lucide-react';
import { greyfinchService } from '@/lib/services/greyfinch';

interface AISummaryGeneratorProps {
  periods: any[];
  periodData: any[];
  locations: any[];
  greyfinchData: any;
  acquisitionCosts: any;
}

interface AISummary {
  summary: string;
  insights: string[];
  recommendations: string[];
  strategicRecommendations?: string[];
  kpis: {
    roas: number;
    roi: number;
    acquisitionCost: number;
    lifetimeValue: number;
    conversionRate: number;
  };
  acquisitionCosts: any[];
  dataRecommendations?: string[];
  nationalComparison?: any;
  marketingOptimization?: any;
}

export function AISummaryGenerator({ periods, periodData, locations, greyfinchData, acquisitionCosts }: AISummaryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [showRawResponse, setShowRawResponse] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGenerateSummary = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate AI summaries.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get any available Greyfinch data from localStorage
      let greyfinchAnalytics = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('greyfinchData');
        if (stored) {
          greyfinchAnalytics = JSON.parse(stored);
        }
      }
      
      // Fetch any available acquisition cost data for periods
      const acquisitionCostPromises = (periods || []).map(async (period) => {
        try {
          const response = await fetch(`/api/acquisition-costs?locationId=&period=${period.startDate?.toISOString().split('T')[0]}&userId=${user.id}`);
          if (response.ok) {
            return response.json();
          }
          return null;
        } catch (error) {
          console.error(`Error fetching costs for period ${period.id}:`, error);
          return null;
        }
      });

      const acquisitionCostData = await Promise.all(acquisitionCostPromises);
      const allAcquisitionCosts = acquisitionCostData.filter(data => data !== null);

      // Prepare comprehensive data for AI analysis
      const analysisData = {
        periods: (periods || []).map((period, index) => ({
          ...period,
          data: periodData[index]?.data || null,
          acquisitionCosts: allAcquisitionCosts[index] || { manual: [], api: [], totals: {} },
          locationData: {
            selectedLocationIds: period.locationIds || [period.locationId || 'all'].filter(id => id !== 'all'),
            selectedLocationNames: (period.locationIds || [period.locationId || 'all'].filter((id: any) => id !== 'all'))
              .map((id: any) => locations.find(loc => loc.id.toString() === id)?.name || 'Unknown Location')
          }
        })),
        locations: locations || [],
        greyfinchData: greyfinchData || greyfinchAnalytics || {},
        acquisitionCosts: acquisitionCosts || {},
        periodQueries: periodData || [],
        userId: user.id,
        availableData: {
          hasPeriods: (periods || []).length > 0,
          hasGreyfinchData: !!(greyfinchData || greyfinchAnalytics),
          hasAcquisitionCosts: allAcquisitionCosts.length > 0,
          hasLocationData: (locations || []).length > 0,
          hasPeriodQueries: (periodData || []).length > 0,
          hasComparisons: (periods || []).length > 1 || (locations || []).length > 1,
          totalPeriods: (periods || []).length,
          totalLocations: (locations || []).length,
          totalAcquisitionCosts: allAcquisitionCosts.length,
          totalPeriodQueries: (periodData || []).length
        },
        comparisons: {
          periodComparisons: (periods || []).length > 1 ? {
            periods: periods.map((period, index) => ({
              name: period.title,
              data: periodData[index]?.data || null,
              locationIds: period.locationIds || [period.locationId || 'all'].filter(id => id !== 'all'),
              dateRange: {
                start: period.startDate,
                end: period.endDate
              }
            }))
          } : null,
          locationComparisons: (locations || []).length > 1 ? {
            locations: locations.map(location => ({
              id: location.id,
              name: location.name,
              data: periodData.map(query => query?.data).filter(Boolean)
            }))
          } : null
        }
      };

      console.log('Sending comprehensive analysis data to ChatGPT:', {
        periodsCount: analysisData.periods.length,
        locationsCount: analysisData.locations.length,
        hasGreyfinchData: !!analysisData.greyfinchData,
        hasPeriodQueries: analysisData.periodQueries.length > 0,
        hasComparisons: !!(analysisData.comparisons.periodComparisons || analysisData.comparisons.locationComparisons),
        availableData: analysisData.availableData,
        userId: analysisData.userId,
        dataStructure: {
          periods: analysisData.periods.map(p => ({ name: p.title, hasData: !!p.data, locationCount: p.locationData.selectedLocationIds.length })),
          locations: analysisData.locations.map(l => ({ name: l.name, id: l.id })),
          comparisons: {
            periodComparisons: analysisData.comparisons.periodComparisons ? 'Available' : 'None',
            locationComparisons: analysisData.comparisons.locationComparisons ? 'Available' : 'None'
          }
        }
      });

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to generate summary: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Store the raw response for debugging
      setRawResponse(JSON.stringify(data, null, 2));
      
      if (!data.summary) {
        throw new Error('Invalid response from AI summary service');
      }
      
      // Normalize the response to handle different field names
      const normalizedSummary: AISummary = {
        summary: data.summary || 'No summary available',
        insights: data.insights || data.keyInsights || ['No insights available'],
        recommendations: data.recommendations || data.strategicRecommendations || ['No recommendations available'],
        strategicRecommendations: data.strategicRecommendations,
        kpis: data.kpis || {
          roas: 0,
          roi: 0,
          acquisitionCost: 0,
          lifetimeValue: 0,
          conversionRate: 0
        },
        acquisitionCosts: data.acquisitionCosts || [],
        dataRecommendations: data.dataRecommendations,
        nationalComparison: data.nationalComparison,
        marketingOptimization: data.marketingOptimization
      };
      
      setSummary(normalizedSummary);
      toast({
        title: "AI Summary Generated",
        description: `Generated comprehensive analysis using ${analysisData.availableData.totalPeriods} periods, ${analysisData.availableData.totalLocations} locations, ${analysisData.availableData.hasGreyfinchData ? 'Greyfinch data' : 'available data'}, and ${analysisData.availableData.hasComparisons ? 'comparison data' : 'single period data'}.`,
      });
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred while generating the AI summary.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="space-y-6">
        <Button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating AI Summary...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Generate Comprehensive AI Summary
            </>
          )}
        </Button>

        {/* Raw Response Preview */}
        {rawResponse && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Raw OpenAI Response</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRawResponse(!showRawResponse)}
                className="h-8 px-3"
              >
                {showRawResponse ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show
                  </>
                )}
              </Button>
            </div>
            {showRawResponse && (
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-96">
                {rawResponse}
              </pre>
            )}
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold text-blue-600">{summary.kpis?.roas?.toFixed(2) || '0.00'}x</div>
                <div className="text-sm text-gray-600">ROAS</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold text-green-600">{summary.kpis?.roi?.toFixed(1) || '0.0'}%</div>
                <div className="text-sm text-gray-600">ROI</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-bold text-purple-600">${summary.kpis?.acquisitionCost || '0'}</div>
                <div className="text-sm text-gray-600">Avg Cost</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-lg font-bold text-orange-600">${summary.kpis?.lifetimeValue || '0'}</div>
                <div className="text-sm text-gray-600">LTV</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <div className="text-lg font-bold text-red-600">{summary.kpis?.conversionRate?.toFixed(1) || '0.0'}%</div>
                <div className="text-sm text-gray-600">Conv Rate</div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Executive Summary</h3>
              <p className="text-blue-800 leading-relaxed">{summary.summary}</p>
            </div>

            {/* Key Insights */}
            {summary.insights && summary.insights.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Insights</h3>
                <div className="space-y-2">
                  {summary.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Recommendations */}
            {summary.recommendations && summary.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Strategic Recommendations</h3>
                <div className="space-y-2">
                  {summary.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-green-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* National Comparison */}
            {summary.nationalComparison && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">National Benchmark Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(summary.nationalComparison).map(([key, value]) => (
                    <div key={key} className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-sm text-blue-800 mt-1">{value as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Marketing Optimization */}
            {summary.marketingOptimization && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Marketing Optimization Strategies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(summary.marketingOptimization).map(([key, value]) => (
                    <div key={key} className="p-4 bg-green-50 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-sm text-green-800 mt-1">{value as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acquisition Cost Analysis */}
            {summary.acquisitionCosts && summary.acquisitionCosts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Acquisition Cost Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2">Source</th>
                        <th className="text-left p-2">Cost</th>
                        <th className="text-left p-2">Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.acquisitionCosts.map((cost, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{cost.source}</td>
                          <td className="p-2">${cost.cost}</td>
                          <td className="p-2">{cost.period}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Data Recommendations */}
            {summary.dataRecommendations && summary.dataRecommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Collection Recommendations</h3>
                <div className="space-y-2">
                  {summary.dataRecommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-yellow-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}