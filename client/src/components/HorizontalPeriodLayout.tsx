import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PeriodColumn } from "./PeriodColumn";
import { Plus, X, Edit3, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

interface PeriodConfig {
  id: string;
  title: string;
  locationId: string;
  startDate: Date;
  endDate: Date;
}

interface Location {
  id: number;
  name: string;
  greyfinchId?: string;
}

interface HorizontalPeriodLayoutProps {
  periods: PeriodConfig[];
  locations: Location[];
  periodQueries: any[];
  onAddPeriod: () => void;
  onRemovePeriod: (periodId: string) => void;
  onUpdatePeriod: (periodId: string, updates: Partial<PeriodConfig>) => void;
}

export function HorizontalPeriodLayout({
  periods,
  locations,
  periodQueries,
  onAddPeriod,
  onRemovePeriod,
  onUpdatePeriod
}: HorizontalPeriodLayoutProps) {
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

  // Touch handlers for mobile swipe
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleTouchStart = (e: TouchEvent) => {
      isScrolling = true;
      startX = e.touches[0].pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolling) return;
      e.preventDefault();
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX) * 2; // Adjust scroll speed
      container.scrollLeft = scrollLeft - walk;
    };

    const handleTouchEnd = () => {
      isScrolling = false;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

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
              <Button
                onClick={onAddPeriod}
                size="sm"
                className="h-8 px-3"
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

      {/* Horizontal Scrolling Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none'
        }}
      >
        {periods.map((period, index) => {
          const query = periodQueries[index];
          const location = locations.find(l => l.id.toString() === period.locationId);
          
          return (
            <div 
              key={period.id} 
              id={`period-${period.id}`}
              className="flex-shrink-0 snap-center"
              style={{ 
                width: 'calc(100vw - 2rem)',
                maxWidth: '420px'
              }}
            >
              <Card className="h-full border-2 transition-all duration-200 hover:shadow-lg">
                {/* Period Header */}
                <CardHeader className="pb-4 space-y-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const newTitle = prompt('Enter new period name:', period.title);
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

                {/* Period Content */}
                <CardContent className="pt-0">
                  <PeriodColumn
                    period={period}
                    query={query}
                    locations={locations}
                    onUpdatePeriod={onUpdatePeriod}
                    isCompact={true}
                  />
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Add Period Card */}
        <div 
          className="flex-shrink-0 snap-center"
          style={{ 
            width: 'calc(100vw - 2rem)',
            maxWidth: '420px'
          }}
        >
          <Card 
            className="h-full border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
            onClick={onAddPeriod}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500 hover:text-blue-600 transition-colors">
              <Plus className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">Add New Period</h3>
              <p className="text-sm text-center">
                Compare data across different time ranges and locations
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scroll Indicators - Mobile Only */}
      <div className="lg:hidden mt-4 flex justify-center">
        <div className="flex gap-2">
          {periods.concat([{ id: 'add', title: 'Add', locationId: '', startDate: new Date(), endDate: new Date() }]).map((_, index) => (
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