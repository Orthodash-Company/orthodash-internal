import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Header } from "@/components/Header";
import { PeriodColumn } from "@/components/PeriodColumn";
import { CostManagement } from "@/components/CostManagement";
import { RefreshCw, Download, Share2, Plus, X } from "lucide-react";
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

export default function Dashboard() {
  // State for managing multiple periods
  const [periods, setPeriods] = useState<PeriodConfig[]>([
    {
      id: 'period-1',
      title: 'Period A',
      locationId: 'all',
      startDate: new Date(2024, 0, 1), // Jan 1, 2024
      endDate: new Date(2024, 2, 31)  // Mar 31, 2024
    },
    {
      id: 'period-2', 
      title: 'Period B',
      locationId: 'all',
      startDate: new Date(2024, 3, 1), // Apr 1, 2024
      endDate: new Date(2024, 5, 30)  // Jun 30, 2024
    }
  ]);

  // Query for locations
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  // Create queries for all periods dynamically
  const periodQueries = periods.map((period) => {
    const locationParam = period.locationId === 'all' ? '' : `&locationId=${period.locationId}`;
    
    return useQuery({
      queryKey: ['/api/analytics', period.id, period.locationId, format(period.startDate, 'yyyy-MM-dd'), format(period.endDate, 'yyyy-MM-dd')],
      queryFn: async () => {
        const response = await fetch(`/api/analytics?startDate=${format(period.startDate, 'yyyy-MM-dd')}&endDate=${format(period.endDate, 'yyyy-MM-dd')}${locationParam}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        return response.json();
      },
    });
  });

  // Query for Greyfinch connection status
  const { data: greyfinchStatus } = useQuery({
    queryKey: ['/api/test-greyfinch'],
    queryFn: async () => {
      const response = await fetch('/api/test-greyfinch');
      return response.json();
    },
  });

  // Handle adding a new period column
  const handleAddPeriod = () => {
    const newPeriod: PeriodConfig = {
      id: `period-${Date.now()}`,
      title: `Period ${String.fromCharCode(65 + periods.length)}`, // A, B, C, etc.
      locationId: 'all',
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 2, 31)
    };
    setPeriods(prev => [...prev, newPeriod]);
  };

  // Handle removing a period column
  const handleRemovePeriod = (periodId: string) => {
    if (periods.length > 1) { // Keep at least one period
      setPeriods(prev => prev.filter(p => p.id !== periodId));
    }
  };

  // Handle updating a period configuration
  const handleUpdatePeriod = (periodId: string, updates: Partial<PeriodConfig>) => {
    setPeriods(prev => prev.map(p => 
      p.id === periodId ? { ...p, ...updates } : p
    ));
  };

  const handleUpdateAnalysis = () => {
    periodQueries.forEach(query => query.refetch());
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share functionality to be implemented');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Section */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Period Comparison Settings</CardTitle>
            <Button onClick={handleAddPeriod} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Period
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Global Update Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleUpdateAnalysis} 
                  className="px-8"
                  disabled={periodQueries.some(q => q.isLoading)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update All Analysis
                </Button>
              </div>
              
              {/* Period Configuration Grid */}
              <div className="grid gap-4">
                {periods.map((period, index) => (
                  <Card key={period.id} className="p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">{period.title}</h4>
                      {periods.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemovePeriod(period.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Location</Label>
                        <Select 
                          value={period.locationId} 
                          onValueChange={(value) => handleUpdatePeriod(period.id, { locationId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id.toString()}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Start Date</Label>
                        <DatePicker 
                          date={period.startDate} 
                          setDate={(date) => handleUpdatePeriod(period.id, { startDate: date || new Date() })} 
                          placeholder="Select start date"
                        />
                      </div>
                      
                      <div>
                        <Label>End Date</Label>
                        <DatePicker 
                          date={period.endDate} 
                          setDate={(date) => handleUpdatePeriod(period.id, { endDate: date || new Date() })} 
                          placeholder="Select end date"
                        />
                      </div>
                      
                      <div>
                        <Label>Title</Label>
                        <input 
                          type="text" 
                          value={period.title}
                          onChange={(e) => handleUpdatePeriod(period.id, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Period name"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Columns with Horizontal Scroll */}
        <div className="mb-8">
          <div className="relative">
            {/* Header with period count */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Analytics Comparison ({periods.length} Period{periods.length !== 1 ? 's' : ''})
              </h2>
              {periods.length > 1 && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span>Scroll to view more periods</span>
                  <div className="text-gray-400">→</div>
                </div>
              )}
            </div>
            
            {/* Horizontal scrolling container with better mobile support */}
            <div className="overflow-x-auto scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
              <div className="flex gap-4 sm:gap-6 min-w-fit pb-4">
                {periods.map((period, index) => {
                  const query = periodQueries[index];
                  const previousData = index > 0 ? periodQueries[index - 1]?.data : undefined;
                  
                  return (
                    <div key={period.id} className="flex-shrink-0 w-[350px] sm:w-[420px] lg:w-[450px]">
                      <PeriodColumn
                        title={period.title}
                        dateRange={`${format(period.startDate, 'MMM d')} - ${format(period.endDate, 'MMM d, yyyy')}`}
                        data={query?.data}
                        comparison={previousData}
                        isLoading={query?.isLoading}
                      />
                    </div>
                  );
                })}
                
                {/* Add Period Button Column */}
                <div className="flex-shrink-0 w-[350px] sm:w-[420px] lg:w-[450px] flex items-center justify-center">
                  <Card className="h-full min-h-[600px] w-full border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-200 hover:shadow-md">
                    <CardContent className="flex flex-col items-center justify-center h-full p-8">
                      <Button 
                        onClick={handleAddPeriod}
                        variant="ghost"
                        className="flex flex-col items-center gap-4 p-8 h-full w-full hover:bg-blue-50 transition-colors rounded-lg"
                      >
                        <div className="rounded-full bg-blue-100 p-6 transition-colors hover:bg-blue-200">
                          <Plus className="h-12 w-12 text-blue-500" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-700">Add New Period</h3>
                          <p className="text-sm text-gray-500 mt-2 max-w-xs">
                            Compare additional time ranges or locations
                          </p>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            {/* Improved scroll indicators with fade effect */}
            {periods.length > 1 && (
              <>
                {/* Right fade indicator */}
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent pointer-events-none flex items-center justify-end pr-4">
                  <div className="bg-white rounded-full p-2 shadow-sm border">
                    <div className="text-gray-400 text-xs">→</div>
                  </div>
                </div>
                
                {/* Left fade indicator (when scrolled) */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent pointer-events-none hidden">
                  <div className="bg-white rounded-full p-2 shadow-sm border ml-4 mt-8">
                    <div className="text-gray-400 text-xs">←</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cost Management */}
        <div className="mb-8">
          <CostManagement
            locationId={periods[0]?.locationId === 'all' ? null : parseInt(periods[0]?.locationId || '0')}
            period={format(periods[0]?.startDate || new Date(), 'yyyy-MM')}
          />
        </div>

        {/* Data Source Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Data Source</h3>
                <p className="text-sm text-gray-600">Connected to Greyfinch API</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${greyfinchStatus?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {greyfinchStatus?.status === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>API Endpoint:</strong> https://connect.greyfinch.com/api-reference<br />
                <strong>Status:</strong> {greyfinchStatus?.message || 'Testing connection...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 space-y-3">
        <Button
          onClick={handleExport}
          className="bg-primary hover:bg-primary/90 rounded-full p-3"
          size="sm"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleShare}
          className="bg-secondary hover:bg-secondary/90 rounded-full p-3"
          size="sm"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
