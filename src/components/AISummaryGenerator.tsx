import { useState } from "react";
// import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, TrendingUp, Target, ExternalLink } from "lucide-react";
// import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PeriodConfig, AnalyticsData } from "@/shared/types";

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
}

interface AISummaryGeneratorProps {
  periods: PeriodConfig[];
  periodData: { [key: string]: AnalyticsData };
}

export function AISummaryGenerator({ periods, periodData }: AISummaryGeneratorProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ periods, periodData }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.status}`);
      }
      
      const data = await response.json();
      setSummary(data);
      toast({
        title: "AI Summary Generated",
        description: "Your analytics summary has been generated successfully."
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
      
      {summary && (
        <CardContent className="space-y-6">
          {/* Recommendations Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-[#1d1d52]" />
              <h3 className="font-semibold text-lg">Recommendations</h3>
              <Badge variant="secondary">ROAS Optimization</Badge>
            </div>
            <ul className="space-y-2">
              {summary.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#1d1d52] rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Deep Dive Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[#1d1d52]" />
              <h3 className="font-semibold text-lg">Deep Dive Insights</h3>
            </div>
            <div className="space-y-3">
              {summary.deepDive.insights.map((insight, index) => (
                <p key={index} className="text-sm text-gray-700 leading-relaxed">
                  {insight}
                </p>
              ))}
              
              {summary.deepDive.externalLinks.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Additional Resources:</h4>
                  <div className="space-y-2">
                    {summary.deepDive.externalLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:border-[#1d1d52] transition-colors group"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#1d1d52] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm group-hover:text-[#1d1d52]">{link.title}</p>
                          <p className="text-xs text-gray-500">{link.description}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Comparative Analysis Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[#1d1d52]" />
              <h3 className="font-semibold text-lg">Comparative Analysis</h3>
              <Badge variant="outline">vs National Averages</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {Object.entries(summary.comparativeAnalysis.nationalAverages).map(([metric, value]) => (
                <div key={metric} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{metric}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              {summary.comparativeAnalysis.performance.map((analysis, index) => (
                <p key={index} className="text-sm text-gray-700">
                  {analysis}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      )}
      
      {!summary && !isGenerating && (
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Select time periods and click "Generate Summary" to get AI-powered insights about your practice performance.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}