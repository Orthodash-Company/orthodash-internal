import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Target,
  Users,
  DollarSign,
  Calendar,
  Settings
} from 'lucide-react';

interface ChartOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'financial' | 'operational' | 'trends';
}

interface ChartSelectorModalProps {
  selectedCharts: string[];
  onChartsChange: (chartIds: string[]) => void;
  trigger?: React.ReactNode;
}

const CHART_OPTIONS: ChartOption[] = [
  {
    id: 'referral-sources',
    name: 'Referral Sources',
    description: 'Breakdown of lead sources (Digital, Professional, Direct)',
    icon: <PieChart className="h-4 w-4" />,
    category: 'operational'
  },
  {
    id: 'conversion-rates',
    name: 'Conversion Rates',
    description: 'Lead to appointment conversion rates by source',
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'operational'
  },
  {
    id: 'weekly-trends',
    name: 'Weekly Trends',
    description: 'Appointment and revenue trends over time',
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'trends'
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Revenue, production, and net production overview',
    icon: <DollarSign className="h-4 w-4" />,
    category: 'financial'
  },
  {
    id: 'patient-metrics',
    name: 'Patient Metrics',
    description: 'Total patients, appointments, and bookings',
    icon: <Users className="h-4 w-4" />,
    category: 'operational'
  },
  {
    id: 'no-show-analysis',
    name: 'No-Show Analysis',
    description: 'No-show rates and patterns',
    icon: <Target className="h-4 w-4" />,
    category: 'operational'
  }
];

const CATEGORY_LABELS = {
  financial: 'Financial Charts',
  operational: 'Operational Charts', 
  trends: 'Trend Analysis'
};

export function ChartSelectorModal({ 
  selectedCharts, 
  onChartsChange, 
  trigger 
}: ChartSelectorModalProps) {
  const [open, setOpen] = useState(false);

  const handleChartToggle = (chartId: string) => {
    const isSelected = selectedCharts.includes(chartId);
    if (isSelected) {
      onChartsChange(selectedCharts.filter(id => id !== chartId));
    } else {
      onChartsChange([...selectedCharts, chartId]);
    }
  };

  const handleSelectAll = () => {
    onChartsChange(CHART_OPTIONS.map(chart => chart.id));
  };

  const handleClearAll = () => {
    onChartsChange([]);
  };

  const selectedChartObjects = CHART_OPTIONS.filter(chart => selectedCharts.includes(chart.id));

  // Group charts by category
  const chartsByCategory = CHART_OPTIONS.reduce((acc, chart) => {
    if (!acc[chart.category]) {
      acc[chart.category] = [];
    }
    acc[chart.category].push(chart);
    return acc;
  }, {} as Record<string, ChartOption[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Select Charts ({selectedCharts.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden sm:max-w-4xl max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Charts to Display
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 h-full">
          {/* Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Quick Actions:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-8"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-8"
              >
                Clear All
              </Button>
            </div>
            <Badge variant="secondary" className="text-sm">
              {selectedCharts.length} charts selected
            </Badge>
          </div>

          {/* Selected Charts Preview */}
          {selectedChartObjects.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium text-blue-900 mb-2 block">
                Selected Charts:
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedChartObjects.map(chart => (
                  <Badge key={chart.id} variant="default" className="text-xs">
                    {chart.icon}
                    <span className="ml-1">{chart.name}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Chart Categories */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {Object.entries(chartsByCategory).map(([category, charts]) => (
              <div key={category} className="space-y-3">
                <Label className="text-lg font-semibold text-gray-900">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {charts.map(chart => {
                    const isSelected = selectedCharts.includes(chart.id);
                    return (
                      <div
                        key={chart.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleChartToggle(chart.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleChartToggle(chart.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                {chart.icon}
                              </div>
                              <Label className="font-medium cursor-pointer">
                                {chart.name}
                              </Label>
                            </div>
                            <p className="text-sm text-gray-600">
                              {chart.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setOpen(false)}
              disabled={selectedCharts.length === 0}
            >
              Apply Charts ({selectedCharts.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
