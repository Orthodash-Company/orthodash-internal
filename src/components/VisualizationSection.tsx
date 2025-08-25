import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "./charts/PieChart";
import { ColumnChart } from "./charts/ColumnChart";
import { SplineChart } from "./charts/SplineChart";
import { StackedColumnChart } from "./charts/StackedColumnChart";
import { X, Settings } from "lucide-react";

interface VisualizationOption {
  id: string;
  type: 'doughnut' | 'column' | 'spline' | 'stacked' | 'stacked-column';
  title: string;
  description: string;
  summary: string;
  explanation: string;
  icon: React.ComponentType<any>;
  options: string[];
}

interface VisualizationSectionProps {
  visualization: VisualizationOption;
  data: any;
  onRemove: () => void;
  onConfigure?: () => void;
  isLoading?: boolean;
}

export function VisualizationSection({ 
  visualization, 
  data, 
  onRemove, 
  onConfigure, 
  isLoading = false 
}: VisualizationSectionProps) {
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const defaultData = {
      pieData: [
        { x: 'Digital', y: 45, text: '45%' },
        { x: 'Professional', y: 35, text: '35%' },
        { x: 'Direct', y: 20, text: '20%' }
      ],
      columnData: [
        { x: 'Digital', digital: 45, professional: 0, direct: 0 },
        { x: 'Professional', digital: 0, professional: 35, direct: 0 },
        { x: 'Direct', digital: 0, professional: 0, direct: 20 }
      ],
      splineData: [
        { x: 'Jan', digital: 30, professional: 25, direct: 15 },
        { x: 'Feb', digital: 35, professional: 30, direct: 18 },
        { x: 'Mar', digital: 40, professional: 28, direct: 22 },
        { x: 'Apr', digital: 45, professional: 35, direct: 20 }
      ]
    };

    switch (visualization.type) {
      case 'doughnut':
        return <PieChart data={data?.pieData || defaultData.pieData} />;
      case 'column':
        return <ColumnChart data={data?.columnData || defaultData.columnData} />;
      case 'spline':
        return <SplineChart data={data?.splineData || defaultData.splineData} />;
      case 'stacked':
      case 'stacked-column':
        return <StackedColumnChart data={data?.columnData || defaultData.columnData} />;
      default:
        return <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">Chart not available</div>;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg">{visualization.title}</CardTitle>
          <p className="text-sm text-gray-600 mt-1">{visualization.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {onConfigure && (
            <Button variant="ghost" size="sm" onClick={onConfigure}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* AI Summary */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">AI Summary</h4>
          <p className="text-sm text-blue-800">{visualization.summary}</p>
        </div>

        {/* Chart */}
        <div className="mb-4">
          {renderChart()}
        </div>

        {/* Explanation */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Data Explanation</h4>
          <p className="text-sm text-gray-700">{visualization.explanation}</p>
        </div>

        {/* Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Options</h4>
          <div className="flex flex-wrap gap-2">
            {visualization.options.map((option, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {option}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}