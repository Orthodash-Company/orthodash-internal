'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Brain, TrendingUp, DollarSign, Users, Calendar, Target } from 'lucide-react';
import { greyfinchService } from '@/lib/services/greyfinch';

interface AISummaryGeneratorProps {
  periods: any[];
  periodData: any;
}

interface AISummary {
  summary: string;
  insights: string[];
  recommendations: string[];
  kpis: {
    roas: number;
    roi: number;
    acquisitionCost: number;
    lifetimeValue: number;
    conversionRate: number;
  };
  acquisitionCosts: any[];
}

export function AISummaryGenerator({ periods, periodData }: AISummaryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<AISummary | null>(null);
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

    if (!periods || periods.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please add analysis periods before generating a summary.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get Greyfinch data for analysis
      const greyfinchAnalytics = greyfinchService.generateAnalyticsFromGreyfinchData();
      
      // Fetch acquisition cost data for all periods
      const acquisitionCostPromises = periods.map(async (period) => {
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

      // Prepare data for AI analysis
      const analysisData = {
        periods: periods.map((period, index) => ({
          ...period,
          acquisitionCosts: allAcquisitionCosts[index] || { manual: [], api: [], totals: {} }
        })),
        greyfinchData: greyfinchAnalytics,
        userId: user.id
      };

      console.log('Sending analysis data:', {
        periodsCount: analysisData.periods.length,
        hasGreyfinchData: !!analysisData.greyfinchData,
        userId: analysisData.userId
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
      
      if (!data.summary) {
        throw new Error('Invalid response from AI summary service');
      }
      
      setSummary(data);
      toast({
        title: "AI Summary Generated",
        description: "Your comprehensive analysis is ready!",
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Powered Analytics Summary
        </CardTitle>
        <CardDescription>
          Generate comprehensive insights and recommendations using AI analysis of your practice data
        </CardDescription>
      </CardHeader>
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

        {summary && (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold text-blue-600">{summary.kpis.roas.toFixed(2)}x</div>
                <div className="text-sm text-gray-600">ROAS</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold text-green-600">{summary.kpis.roi.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">ROI</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-bold text-purple-600">${summary.kpis.acquisitionCost}</div>
                <div className="text-sm text-gray-600">Avg Cost</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-lg font-bold text-orange-600">${summary.kpis.lifetimeValue}</div>
                <div className="text-sm text-gray-600">LTV</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <div className="text-lg font-bold text-red-600">{summary.kpis.conversionRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Conv Rate</div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Executive Summary</h3>
              <p className="text-blue-800 leading-relaxed">{summary.summary}</p>
            </div>

            {/* Key Insights */}
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

            {/* Strategic Recommendations */}
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

            {/* Acquisition Cost Analysis */}
            {summary.acquisitionCosts.length > 0 && (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}