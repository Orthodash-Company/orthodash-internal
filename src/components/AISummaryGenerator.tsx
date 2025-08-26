import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, TrendingUp, Target, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PeriodConfig, AnalyticsData } from "@/shared/types";
import { useAuth } from "@/hooks/use-auth";

interface AISummary {
  recommendations: string[];
  deepDive: {
    insights: string[];
    externalLinks: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
  comparativeAnalysis: {
    nationalAverages: {
      [key: string]: string;
    };
    performance: string[];
  };
  acquisitionCosts: {
    summary: string;
    breakdown: {
      manual: number;
      meta: number;
      google: number;
      total: number;
    };
    insights: string[];
    recommendations: string[];
  };
}

interface AISummaryGeneratorProps {
  periods: PeriodConfig[];
  periodData: { [key: string]: AnalyticsData };
}

export function AISummaryGenerator({ periods, periodData }: AISummaryGeneratorProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate summaries",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Fetch acquisition cost data for all periods
      const acquisitionCostData: any = {};
      
      for (const period of periods) {
        try {
          // Construct period string from startDate (YYYY-MM format)
          const periodString = `${period.startDate.getFullYear()}-${String(period.startDate.getMonth() + 1).padStart(2, '0')}`;
          const costResponse = await fetch(
            `/api/acquisition-costs?locationId=${period.locationId || ''}&period=${periodString}&userId=${user.id}`
          );
          if (costResponse.ok) {
            const costData = await costResponse.json();
            acquisitionCostData[periodString] = costData;
          }
        } catch (error) {
          console.error(`Error fetching costs for period ${period.name}:`, error);
        }
      }

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          periods, 
          periodData,
          acquisitionCostData,
          userId: user.id
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.status}`);
      }
      
      const data = await response.json();
      setSummary(data);
      toast({
        title: "AI Summary Generated",
        description: "Your comprehensive analytics summary has been generated successfully."
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate summary",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#1d1d52]" />
            AI Analytics Summary
          </CardTitle>
          <Button 
            onClick={handleGenerateSummary}
            disabled={isGenerating || Object.keys(periodData).length === 0}
            className="bg-[#1d1d52] hover:bg-[#1d1d52]/90 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!summary ? (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Generate AI-Powered Insights</h3>
            <p className="text-sm">
              Get comprehensive analysis including acquisition costs, performance metrics, and actionable recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Key Recommendations
              </h3>
              <div className="space-y-2">
                {summary.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Acquisition Costs Summary */}
            {summary.acquisitionCosts && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Acquisition Cost Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      ${summary.acquisitionCosts.breakdown.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Total Costs</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      ${summary.acquisitionCosts.breakdown.manual.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Manual</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      ${summary.acquisitionCosts.breakdown.meta.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Meta Ads</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      ${summary.acquisitionCosts.breakdown.google.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Google Ads</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {summary.acquisitionCosts.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Deep Dive Insights */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Deep Dive Insights</h3>
              <div className="space-y-2">
                {summary.deepDive.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* External Links */}
            {summary.deepDive.externalLinks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Additional Resources</h3>
                <div className="space-y-2">
                  {summary.deepDive.externalLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">{link.title}</div>
                        <div className="text-xs text-gray-600">{link.description}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comparative Analysis */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Comparative Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">National Averages</h4>
                  <div className="space-y-1">
                    {Object.entries(summary.comparativeAnalysis.nationalAverages).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="space-y-1">
                    {summary.comparativeAnalysis.performance.map((metric, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}