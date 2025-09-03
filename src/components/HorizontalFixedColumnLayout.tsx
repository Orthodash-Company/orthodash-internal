import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SimpleDateInput } from "@/components/ui/simple-date-input";
import { DataVisualizationModal } from "./DataVisualizationModal";
import { PeriodColumn } from "./PeriodColumn";
import { CompactCostManager } from "./CompactCostManager";
import { Plus, X, Edit3, Calendar, MapPin, Save, Minus } from "lucide-react";
import { format } from "date-fns";
import { PeriodConfig, Location, VisualizationOption, CompactCost } from "@/shared/types";

interface HorizontalFixedColumnLayoutProps {
  periods: PeriodConfig[];
  locations: Location[];
  periodQueries: any[];
  onAddPeriod: (period: Omit<PeriodConfig, 'id'>) => void;
  onRemovePeriod: (periodId: string) => void;
  onUpdatePeriod: (periodId: string, updates: Partial<PeriodConfig>) => void;
}

export function HorizontalFixedColumnLayout({
  periods,
  locations,
  periodQueries,
  onAddPeriod,
  onRemovePeriod,
  onUpdatePeriod
}: HorizontalFixedColumnLayoutProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [editingPeriods, setEditingPeriods] = useState<Set<string>>(new Set());
  const [periodCosts, setPeriodCosts] = useState<Record<string, CompactCost[]>>({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Auto-scroll to the right when new periods are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [periods.length]);

  // Handle direct period addition
  const handleDirectAddPeriod = () => {
    const nextPeriodLetter = String.fromCharCode(65 + periods.length);
    const newPeriod: Omit<PeriodConfig, 'id'> = {
      name: `Period ${nextPeriodLetter}`,
      title: `Period ${nextPeriodLetter}`,
      locationId: 'all',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      visualizations: []
    };
    onAddPeriod(newPeriod);
    
    // Show success animation
    setShowSuccessAnimation(true);
    setTimeout(() => setShowSuccessAnimation(false), 3000); // Hide after 3 seconds
  };

  // Handle costs update for a period
  const handleCostsUpdate = (periodId: string, costs: CompactCost[]) => {
    setPeriodCosts(prev => ({
      ...prev,
      [periodId]: costs
    }));
  };

  // Get total costs for a period
  const getPeriodTotalCosts = (periodId: string) => {
    const costs = periodCosts[periodId] || [];
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  };

  return (
    <div className="relative">
      {/* Success Animation */}
      {showSuccessAnimation && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">New column added successfully! 🎉</span>
          </div>
        </div>
      )}

      {/* Period Navigation - Mobile Only */}
      <div className="lg:hidden mb-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Analytics Periods ({periods.length})
              </CardTitle>
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={handleDirectAddPeriod}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {periods.map((period, index) => {
                const location = locations.find(l => l.id.toString() === period.locationId);
                return (
                  <div key={period.id} className="flex-shrink-0">
                    <Badge
                      variant={index === 0 ? "default" : "secondary"}
                      className="cursor-pointer text-xs px-2 py-1"
                      onClick={() => {
                        // Scroll to corresponding period column
                        const periodElement = document.getElementById(`period-${period.id}`);
                        if (periodElement) {
                          periodElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            inline: 'center',
                            block: 'nearest'
                          });
                        }
                      }}
                    >
                      {period.title}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Horizontal Scrolling Container with Fixed Height */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          height: 'calc(100vh - 300px)', // Fixed height to prevent Add Period button from moving
          minHeight: '600px'
        }}
      >
        {periods.map((period, index) => {
          const query = periodQueries[index];
          const location = locations.find(l => l.id.toString() === period.locationId);
          const periodCostsList = periodCosts[period.id] || [];
          
          return (
            <div 
              key={period.id} 
              id={`period-${period.id}`}
              className="flex-shrink-0 snap-center overflow-hidden"
              style={{ 
                width: 'calc(100vw - 2rem)',
                maxWidth: '420px',
                height: '100%'
              }}
            >
              <Card className="h-full border-2 transition-all duration-200 hover:shadow-lg">
                {/* Period Header */}
                <CardHeader className="pb-4 space-y-0 sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editingPeriods.has(period.id) ? 'text-orange-600 bg-orange-50' : 'text-gray-500 hover:text-[#1d1d52] hover:bg-gray-100'}`}
                        onClick={() => {
                          const newEditingPeriods = new Set(editingPeriods);
                          if (editingPeriods.has(period.id)) {
                            newEditingPeriods.delete(period.id);
                          } else {
                            newEditingPeriods.add(period.id);
                          }
                          setEditingPeriods(newEditingPeriods);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <CardTitle className="text-lg font-semibold">
                        {period.title}
                      </CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Remove Period Button */}
                      {periods.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${period.title}? This action cannot be undone.`)) {
                              onRemovePeriod(period.id);
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Add Visualization button */}
                      <DataVisualizationModal
                        onSelectVisualization={(viz) => {
                          const currentViz = period.visualizations || [];
                          onUpdatePeriod(period.id, { 
                            visualizations: [...currentViz, viz] 
                          });
                        }}
                        trigger={
                          <Button
                            size="sm"
                            className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 rounded-lg"
                          >
                            <Plus className="h-4 w-4 text-white" />
                          </Button>
                        }
                      />
                    </div>
                  </div>

                  {/* Period Info */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <button
                        onClick={() => {
                          // Toggle edit mode for this period
                          setEditingPeriods(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(period.id)) {
                              newSet.delete(period.id);
                            } else {
                              newSet.add(period.id);
                            }
                            return newSet;
                          });
                        }}
                        className="hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                        title="Click to edit date range"
                      >
                        {period.startDate && period.endDate ? 
                          `${format(new Date(period.startDate), 'MMM d')} - ${format(new Date(period.endDate), 'MMM d, yyyy')}` : 
                          'Select date range'
                        }
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{location?.name || 'All Locations'}</span>
                    </div>
                  </div>
                </CardHeader>

                                  {/* Period Content */}
                  <CardContent className="pt-0 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                    {/* Date Range Editor - Show when editing */}
                    {editingPeriods.has(period.id) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                          <Calendar className="h-4 w-4" />
                          Edit Date Range
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-blue-700">Start Date</Label>
                            <SimpleDateInput
                              date={period.startDate}
                              setDate={(date) => onUpdatePeriod(period.id, { startDate: date })}
                              placeholder="DD/MM/YYYY"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-blue-700">End Date</Label>
                            <SimpleDateInput
                              date={period.endDate}
                              setDate={(date) => onUpdatePeriod(period.id, { endDate: date })}
                              placeholder="DD/MM/YYYY"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPeriods(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(period.id);
                                return newSet;
                              });
                            }}
                            className="text-blue-700 border-blue-300 hover:bg-blue-100"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Compact Cost Management - Top of Column */}
                    <CompactCostManager
                      periodId={period.id}
                      periodName={period.title}
                      locationId={period.locationId}
                      costs={periodCostsList}
                      onCostsUpdate={handleCostsUpdate}
                    />
                    
                    <PeriodColumn
                      period={period as any} // Type assertion for compatibility
                      query={query}
                      locations={locations}
                      onUpdatePeriod={onUpdatePeriod}
                      onAddPeriod={onAddPeriod}
                      isFirstPeriod={index === 0}
                      isCompact={true}
                      periodCosts={periodCostsList}
                    />
                  
                  {/* Visualizations Waterfall */}
                  {period.visualizations?.map((viz, vizIndex) => (
                    <div key={`${period.id}-${viz.id}-${vizIndex}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{viz.title}</h4>
                        {editingPeriods.has(period.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={() => {
                              const updatedViz = period.visualizations?.filter((_, i) => i !== vizIndex) || [];
                              onUpdatePeriod(period.id, { visualizations: updatedViz });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {editingPeriods.has(period.id) ? (
                        <p className="text-sm text-gray-600">{viz.description}</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">{viz.description}</p>
                          {/* Chart Placeholder - Replace with actual chart component */}
                          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500">
                            {viz.title} Chart Loading...
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Save as Template Button */}
                  {(period.visualizations?.length || 0) > 0 && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const templateName = prompt('Enter template name:', `${period.title} Template`);
                          if (templateName && templateName.trim()) {
                            // Save template to localStorage
                            const templates = JSON.parse(localStorage.getItem('orthodash-templates') || '[]');
                            const newTemplate = {
                              id: Date.now(),
                              name: templateName.trim(),
                              period: {
                                title: period.title,
                                locationId: period.locationId,
                                visualizations: period.visualizations
                              },
                              createdAt: new Date().toISOString()
                            };
                            templates.push(newTemplate);
                            localStorage.setItem('orthodash-templates', JSON.stringify(templates));
                            
                            // Show success message
                            alert(`Template "${templateName}" saved successfully!`);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save as Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Add Column Button - Direct Addition */}
        <div 
          className="flex-shrink-0 snap-center sticky-add-column"
          style={{ 
            width: 'calc(100vw - 2rem)',
            maxWidth: '420px',
            height: '100%'
          }}
        >
          <Card className="h-full border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
            <CardContent className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#1d1d52] flex items-center justify-center mx-auto group-hover:bg-[#1d1d52]/80 transition-colors">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Analysis Period</h3>
                  <p className="text-sm text-gray-600 max-w-48">
                    Compare data across different time periods and locations for comprehensive insights
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleDirectAddPeriod}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Column
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scroll Indicators - Mobile Only */}
      <div className="lg:hidden mt-4 flex justify-center">
        <div className="flex gap-2">
          {Array.from({ length: periods.length + 1 }).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300 transition-colors"
              // You could add active state logic here based on scroll position
            />
          ))}
        </div>
      </div>
    </div>
  );
}