import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BarChart3, PieChart, LineChart, TrendingUp, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface DataVisualizationModalProps {
  onSelectVisualization: (visualization: VisualizationOption) => void;
  isLoading?: boolean;
}

const visualizationOptions: VisualizationOption[] = [
  {
    id: 'doughnut-referral-sources',
    type: 'doughnut',
    title: 'Doughnut Chart - Referral Sources',
    description: 'Customizable colors and data labels showing referral source distribution',
    summary: 'A circular visualization that clearly shows the proportion of patients coming from different referral sources, making it easy to identify your most valuable referral channels.',
    explanation: 'This chart displays referral sources as segments of a doughnut, with customizable colors and percentage labels. You can analyze patterns by office or view total practice data to understand which marketing channels drive the most new patients.',
    icon: PieChart,
    options: ['By Office', 'Total Practice', 'Custom Colors', 'Show Percentages']
  },
  {
    id: 'column-multi-series',
    type: 'column',
    title: 'Column Chart - Multiple Series',
    description: 'Referral Sources and TC Conversion Rates comparison',
    summary: 'Side-by-side columns comparing referral volume against treatment coordinator conversion rates, revealing which sources provide the highest quality leads.',
    explanation: 'This multi-series column chart shows both referral volumes and TC conversion rates, allowing you to identify not just which sources bring the most patients, but which ones convert best. Essential for optimizing marketing spend and TC training focus.',
    icon: BarChart3,
    options: ['Total Practice', 'By Treatment Coordinator', 'By Office', 'Show Conversion %']
  },
  {
    id: 'spline-multi-series',
    type: 'spline',
    title: 'Spline Chart - Referral Source Trends',
    description: 'Multi-series trend analysis of referral sources over time',
    summary: 'Smooth trend lines showing how different referral sources perform over time, helping identify seasonal patterns and growth trends in your patient acquisition.',
    explanation: 'This spline chart tracks referral source performance across time periods, revealing seasonal trends, marketing campaign effectiveness, and long-term growth patterns. Critical for strategic planning and budget allocation.',
    icon: LineChart,
    options: ['Monthly Trends', 'Quarterly View', 'By Source Type', 'Smooth Curves']
  },
  {
    id: 'stacked-marker',
    type: 'stacked',
    title: 'Stacked Chart with Markers',
    description: 'Referral source composition with trend markers',
    summary: 'A stacked area chart with markers showing how your referral mix changes over time, highlighting shifts in patient acquisition patterns.',
    explanation: 'This visualization combines stacked areas showing referral source composition with markers indicating key events or changes. Perfect for understanding how your referral mix evolves and identifying successful strategies.',
    icon: TrendingUp,
    options: ['Area Fill', 'Trend Markers', 'Cumulative View', 'Percentage Stack']
  },
  {
    id: 'stacked-column',
    type: 'stacked-column',
    title: 'Stacked Column Chart - Referral Sources',
    description: 'Vertical stacked columns showing referral source breakdown',
    summary: 'Stacked columns displaying referral source composition for different time periods or locations, making it easy to compare referral mix across segments.',
    explanation: 'This chart stacks referral sources within columns representing different time periods or offices. Ideal for comparing how referral patterns differ between locations or change over time, helping identify best practices to replicate.',
    icon: BarChart2,
    options: ['By Time Period', 'By Office', '100% Stack', 'Show Totals']
  }
];

export function DataVisualizationModal({ onSelectVisualization, isLoading = false }: DataVisualizationModalProps) {
  const [selectedOption, setSelectedOption] = useState<VisualizationOption | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSelectVisualization = (option: VisualizationOption) => {
    setSelectedOption(option);
    onSelectVisualization(option);
    setOpen(false);
    
    // Show success message
    toast({
      title: "Visualization Added",
      description: `${option.title} has been added to your dashboard.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Visualization</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Data Visualization</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {visualizationOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Card 
                    key={option.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                    onClick={() => handleSelectVisualization(option)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-sm font-semibold">{option.title}</CardTitle>
                          <CardDescription className="text-xs">{option.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Summary</h4>
                          <p className="text-xs text-gray-600">{option.summary}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Analysis</h4>
                          <p className="text-xs text-gray-600">{option.explanation}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Options</h4>
                          <div className="flex flex-wrap gap-1">
                            {option.options.map((opt, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {opt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && visualizationOptions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Visualizations Available</h3>
              <p className="text-gray-500 max-w-sm">
                There are no data visualizations available at the moment. Check back later for new options.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}