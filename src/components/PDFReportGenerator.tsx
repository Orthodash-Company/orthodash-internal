'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Download, FileText, BarChart3, TrendingUp, Users, DollarSign, Clock, Target } from 'lucide-react';

interface PDFReportGeneratorProps {
  periods: any[];
  locations: any[];
  greyfinchData: any;
}

export function PDFReportGenerator({ periods, locations, greyfinchData }: PDFReportGeneratorProps) {
  const [reportName, setReportName] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAIInsights, setIncludeAIInsights] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGeneratePDF = async () => {
    if (!reportName.trim()) {
      toast({
        title: "Report Name Required",
        description: "Please enter a name for your report.",
        variant: "destructive"
      });
      return;
    }

    if (selectedPeriods.length === 0) {
      toast({
        title: "Periods Required",
        description: "Please select at least one analysis period.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-pdf-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportName,
          selectedPeriods,
          selectedLocations,
          includeCharts,
          includeAIInsights,
          includeRecommendations,
          greyfinchData,
          userId: user?.id,
          periodData: periods.filter(period => selectedPeriods.includes(period.id))
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "PDF Generated Successfully",
          description: "Your comprehensive report has been downloaded.",
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "An error occurred while generating the PDF report.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePeriod = (periodId: string) => {
    setSelectedPeriods(prev => 
      prev.includes(periodId) 
        ? prev.filter(id => id !== periodId)
        : [...prev, periodId]
    );
  };

  const toggleLocation = (locationId: string) => {
    setSelectedLocations(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Comprehensive PDF Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Name */}
        <div className="space-y-2">
          <Label htmlFor="report-name">Report Name</Label>
          <Input
            id="report-name"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="e.g., Q1 2024 Performance Analysis"
          />
        </div>

        {/* Period Selection */}
        <div className="space-y-2">
          <Label>Analysis Periods</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {periods.map((period) => (
              <div key={period.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`period-${period.id}`}
                  checked={selectedPeriods.includes(period.id)}
                  onCheckedChange={() => togglePeriod(period.id)}
                />
                <Label htmlFor={`period-${period.id}`} className="text-sm">
                  {period.title} ({period.startDate?.toLocaleDateString()} - {period.endDate?.toLocaleDateString()})
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Location Selection */}
        {locations.length > 0 && (
          <div className="space-y-2">
            <Label>Practice Locations</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location.id}`}
                    checked={selectedLocations.includes(location.id)}
                    onCheckedChange={() => toggleLocation(location.id)}
                  />
                  <Label htmlFor={`location-${location.id}`} className="text-sm">
                    {location.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Options */}
        <div className="space-y-3">
          <Label>Report Content</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
              />
              <Label htmlFor="include-charts" className="text-sm">
                Include Charts & Visualizations
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-ai-insights"
                checked={includeAIInsights}
                onCheckedChange={(checked) => setIncludeAIInsights(checked as boolean)}
              />
              <Label htmlFor="include-ai-insights" className="text-sm">
                Include AI-Generated Insights & Summary
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-recommendations"
                checked={includeRecommendations}
                onCheckedChange={(checked) => setIncludeRecommendations(checked as boolean)}
              />
              <Label htmlFor="include-recommendations" className="text-sm">
                Include Business Recommendations
              </Label>
            </div>
          </div>
        </div>

        {/* Greyfinch Data Summary */}
        {greyfinchData && Object.keys(greyfinchData).length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Greyfinch Data Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <div className="font-semibold">{greyfinchData.patients || 0}</div>
                <div className="text-gray-600">Patients</div>
              </div>
              <div className="text-center">
                <BarChart3 className="h-6 w-6 mx-auto mb-1 text-green-500" />
                <div className="font-semibold">{greyfinchData.appointments || 0}</div>
                <div className="text-gray-600">Appointments</div>
              </div>
              <div className="text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                <div className="font-semibold">{greyfinchData.leads || 0}</div>
                <div className="text-gray-600">Leads</div>
              </div>
              <div className="text-center">
                <Target className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                <div className="font-semibold">{greyfinchData.locations || 0}</div>
                <div className="text-gray-600">Locations</div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGeneratePDF}
          disabled={isGenerating || !reportName.trim() || selectedPeriods.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Comprehensive PDF Report
            </>
          )}
        </Button>

        {/* Report Preview */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>This report will include:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Executive Summary with key performance metrics</li>
            <li>Detailed analysis for each selected period</li>
            <li>Greyfinch data integration and insights</li>
            {includeCharts && <li>Interactive charts and visualizations</li>}
            {includeAIInsights && <li>AI-generated insights and trends analysis</li>}
            {includeRecommendations && <li>Strategic business recommendations</li>}
            <li>Performance comparisons across locations</li>
            <li>Actionable next steps and opportunities</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
