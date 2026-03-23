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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CHART_OPTIONS: ChartOption[] = [
  {
    id: 'referral-sources',
    name: 'Referral Sources',
    description: 'Pie chart: 6-bucket breakdown — DDS, Family, Friend, 7UP, Community & Events, Online. DDS drills down by individual doctor.',
    icon: <PieChart className="h-4 w-4" />,
    category: 'operational'
  },
  {
    id: 'conversion-rates',
    name: 'Conversion Rates',
    description: 'Conversion % per referral bucket — how many new patients from each source generated net production.',
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'operational'
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Bar chart: Gross Production, Net Production, Net Collection, and Acquisition Costs side by side.',
    icon: <DollarSign className="h-4 w-4" />,
    category: 'financial'
  },
  {
    id: 'patient-metrics',
    name: 'Patient Funnel',
    description: 'Bar chart: NPL → NPE Scheduled → NPE Kept → NPE No Show funnel volumes.',
    icon: <Users className="h-4 w-4" />,
    category: 'operational'
  },
];

const CATEGORY_LABELS = {
  financial: 'Financial Charts',
  operational: 'Operational Charts', 
  trends: 'Trend Analysis'
};

export function ChartSelectorModal({ 
  selectedCharts, 
  onChartsChange, 
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ChartSelectorModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;

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
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Select Charts ({selectedCharts.length})
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="flex max-w-4xl max-h-[80vh] max-w-[95vw] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Charts to Display
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex min-h-0 flex-1 flex-col gap-4">
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
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
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
