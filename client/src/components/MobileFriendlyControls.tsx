import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Settings, 
  Plus, 
  RefreshCw, 
  Download, 
  Share2, 
  ChevronDown,
  Calendar,
  MapPin,
  Filter
} from "lucide-react";
import { GreyfinchDataModal } from "./GreyfinchDataModal";
import { PDFExporter } from "./PDFExporter";
import { ShareModal } from "./ShareModal";
import { PeriodConfig, Location } from "@shared/types";

interface MobileFriendlyControlsProps {
  periods: PeriodConfig[];
  locations: Location[];
  onAddPeriod: (periodData: Omit<PeriodConfig, 'id'>) => void;
  onUpdateAnalysis: () => void;
  onExport: () => void;
  onShare: () => void;
  onGreyfinchDataSelected: (selection: any) => void;
}

export function MobileFriendlyControls({
  periods,
  locations,
  onAddPeriod,
  onUpdateAnalysis,
  onExport,
  onShare,
  onGreyfinchDataSelected
}: MobileFriendlyControlsProps) {
  const [controlsOpen, setControlsOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  return (
    <>
      {/* Mobile Controls Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Button
              onClick={() => onAddPeriod({ 
                name: `Period ${periods.length + 1}`,
                title: `Period ${periods.length + 1}`,
                locationId: 'all',
                startDate: new Date(),
                endDate: new Date()
              })}
              size="sm"
              className="flex items-center gap-1 px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
            
            <Button
              onClick={async () => {
                setRefreshing(true);
                try {
                  await onUpdateAnalysis();
                  toast({
                    title: "Data Refreshed",
                    description: "Analytics data has been updated successfully."
                  });
                } catch (error) {
                  toast({
                    title: "Refresh Failed",
                    description: "Unable to refresh data. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setRefreshing(false);
                }
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 px-3"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onExport}
              variant="outline"
              size="sm"
              className="px-3"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <ShareModal
              reportData={{}}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              }
            />

            <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="px-3">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              
              <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Dashboard Settings</SheetTitle>
                  <SheetDescription>
                    Configure your analytics dashboard
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {/* Data Source */}
                  <Card>
                    <CardContent className="pt-4">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Data Source
                      </h3>
                      <GreyfinchDataModal
                        onDataSelected={onGreyfinchDataSelected}
                        trigger={
                          <Button variant="outline" className="w-full justify-start">
                            <MapPin className="mr-2 h-4 w-4" />
                            Configure Greyfinch Data
                          </Button>
                        }
                      />
                    </CardContent>
                  </Card>

                  {/* Period Summary */}
                  <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded}>
                    <Card>
                      <CardContent className="pt-4">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-0">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Period Summary ({periods.length})
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="space-y-3 mt-3">
                          {periods.map((period) => {
                            const location = locations.find(l => l.id.toString() === period.locationId);
                            return (
                              <div key={period.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">{period.title}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {location?.name || 'All Locations'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {period.startDate.toLocaleDateString()} - {period.endDate.toLocaleDateString()}
                                </p>
                              </div>
                            );
                          })}
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>

                  {/* Quick Actions */}
                  <Card>
                    <CardContent className="pt-4">
                      <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => { 
                            onAddPeriod({ 
                              name: `Period ${periods.length + 1}`,
                              title: `Period ${periods.length + 1}`,
                              locationId: 'all',
                              startDate: new Date(),
                              endDate: new Date()
                            }); 
                            setControlsOpen(false); 
                          }}
                          variant="outline" 
                          className="w-full justify-start"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Period
                        </Button>
                        <Button 
                          onClick={() => { onUpdateAnalysis(); setControlsOpen(false); }}
                          variant="outline" 
                          className="w-full justify-start"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh All Data
                        </Button>
                        <PDFExporter
                          reportData={onExport()}
                          reportName="ORTHODASH Analytics Report"
                          trigger={
                            <Button 
                              variant="outline" 
                              className="w-full justify-start"
                              onClick={() => setControlsOpen(false)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export Report
                            </Button>
                          }
                        />
                        <Button 
                          onClick={() => { onShare(); setControlsOpen(false); }}
                          variant="outline" 
                          className="w-full justify-start"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Dashboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop Controls - Hidden on mobile */}
      <div className="hidden lg:block">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GreyfinchDataModal 
                  onDataSelected={onGreyfinchDataSelected}
                />
                
                <Button onClick={() => onAddPeriod({ 
                  name: `Period ${periods.length + 1}`,
                  title: `Period ${periods.length + 1}`,
                  locationId: 'all',
                  startDate: new Date(),
                  endDate: new Date()
                })} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Period
                </Button>
                
                <Button onClick={onUpdateAnalysis} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <PDFExporter
                  reportData={onExport()}
                  reportName="ORTHODASH Analytics Report"
                />
                <Button onClick={onShare} variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active Periods:</span>
              {periods.map((period) => (
                <Badge key={period.id} variant="secondary">
                  {period.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}