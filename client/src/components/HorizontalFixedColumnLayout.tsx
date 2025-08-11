import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataVisualizationModal } from "./DataVisualizationModal";
import { PeriodColumn } from "./PeriodColumn";
import { AddColumnModal } from "./AddColumnModal";
import { Plus, X, Edit3, Calendar, MapPin, Save } from "lucide-react";
import { format } from "date-fns";
import { PeriodConfig, Location, VisualizationOption } from "@shared/types";

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

  // Auto-scroll to the right when new periods are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [periods.length]);

  return (
    <div className="relative">
      {/* Period Navigation - Mobile Only */}
      <div className="lg:hidden mb-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Analytics Periods ({periods.length})
              </CardTitle>
              <AddColumnModal 
                locations={locations}
                onAddPeriod={onAddPeriod}
                existingPeriodsCount={periods.length}
              >
                <Button
                  size="sm"
                  className="h-8 px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </AddColumnModal>
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
          
          return (
            <div 
              key={period.id} 
              id={`period-${period.id}`}
              className="flex-shrink-0 snap-center overflow-y-auto"
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
                        className="h-8 w-8 p-0 text-gray-500 hover:text-[#1d1d52] hover:bg-gray-100"
                        onClick={() => {
                          const newTitle = prompt('Edit period name:', period.title);
                          if (newTitle && newTitle.trim()) {
                            onUpdatePeriod(period.id, { title: newTitle.trim() });
                          }
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <CardTitle className="text-lg font-semibold">
                        {period.title}
                      </CardTitle>
                    </div>
                    
                    {periods.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onRemovePeriod(period.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Period Info */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(period.startDate, 'MMM d')} - {format(period.endDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{location?.name || 'All Locations'}</span>
                    </div>
                  </div>
                </CardHeader>

                {/* Add Visualization Button */}
                <div className="px-6 pb-4">
                  <DataVisualizationModal
                    onSelectVisualization={(viz) => {
                      const currentViz = period.visualizations || [];
                      onUpdatePeriod(period.id, { 
                        visualizations: [...currentViz, viz] 
                      });
                    }}
                  />
                </div>

                {/* Period Content */}
                <CardContent className="pt-0 space-y-4">
                  <PeriodColumn
                    period={period}
                    query={query}
                    locations={locations}
                    onUpdatePeriod={onUpdatePeriod}
                    isCompact={true}
                  />
                  
                  {/* Visualizations Waterfall */}
                  {period.visualizations?.map((viz, vizIndex) => (
                    <div key={`${period.id}-${viz.id}-${vizIndex}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{viz.title}</h4>
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
                      </div>
                      <p className="text-sm text-gray-600">{viz.description}</p>
                    </div>
                  ))}
                  
                  {/* Save as Template Button */}
                  {(period.visualizations?.length || 0) > 0 && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          const templateName = prompt('Enter template name:', `${period.title} Template`);
                          if (templateName && templateName.trim()) {
                            // TODO: Implement template saving
                            console.log('Saving template:', templateName, period);
                          }
                        }}
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

        {/* Add Column Modal - Fixed Position */}
        <div 
          className="flex-shrink-0 snap-center sticky-add-column"
          style={{ 
            width: 'calc(100vw - 2rem)',
            maxWidth: '420px',
            height: '100%'
          }}
        >
          <AddColumnModal 
            locations={locations}
            onAddPeriod={onAddPeriod}
            existingPeriodsCount={periods.length}
          />
        </div>
      </div>

      {/* Scroll Indicators - Mobile Only */}
      <div className="lg:hidden mt-4 flex justify-center">
        <div className="flex gap-2">
          {periods.concat([{ id: 'add', name: 'Add', title: 'Add', locationId: '', startDate: new Date(), endDate: new Date() }]).map((_, index) => (
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