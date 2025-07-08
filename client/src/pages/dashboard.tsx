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
import { RefreshCw, Download, Share2 } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [periodAStart, setPeriodAStart] = useState<Date>(new Date(2024, 0, 1)); // Jan 1, 2024
  const [periodAEnd, setPeriodAEnd] = useState<Date>(new Date(2024, 2, 31)); // Mar 31, 2024
  const [periodBStart, setPeriodBStart] = useState<Date>(new Date(2024, 3, 1)); // Apr 1, 2024
  const [periodBEnd, setPeriodBEnd] = useState<Date>(new Date(2024, 5, 30)); // Jun 30, 2024

  // Query for locations
  const { data: locations = [] } = useQuery({
    queryKey: ['/api/locations'],
  });

  // Query for Period A analytics
  const { data: periodAData, isLoading: isLoadingA, refetch: refetchA } = useQuery({
    queryKey: ['/api/analytics', selectedLocation, format(periodAStart, 'yyyy-MM-dd'), format(periodAEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const locationParam = selectedLocation === 'all' ? '' : `&locationId=${selectedLocation}`;
      const response = await fetch(`/api/analytics?startDate=${format(periodAStart, 'yyyy-MM-dd')}&endDate=${format(periodAEnd, 'yyyy-MM-dd')}${locationParam}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  // Query for Period B analytics
  const { data: periodBData, isLoading: isLoadingB, refetch: refetchB } = useQuery({
    queryKey: ['/api/analytics', selectedLocation, format(periodBStart, 'yyyy-MM-dd'), format(periodBEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const locationParam = selectedLocation === 'all' ? '' : `&locationId=${selectedLocation}`;
      const response = await fetch(`/api/analytics?startDate=${format(periodBStart, 'yyyy-MM-dd')}&endDate=${format(periodBEnd, 'yyyy-MM-dd')}${locationParam}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  // Query for Greyfinch connection status
  const { data: greyfinchStatus } = useQuery({
    queryKey: ['/api/test-greyfinch'],
    queryFn: async () => {
      const response = await fetch('/api/test-greyfinch');
      return response.json();
    },
  });

  const handleUpdateAnalysis = () => {
    refetchA();
    refetchB();
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
          <CardHeader>
            <CardTitle>Comparison Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Period A Start</Label>
                <DatePicker 
                  date={periodAStart} 
                  setDate={setPeriodAStart} 
                  placeholder="Select start date"
                />
              </div>
              <div>
                <Label>Period A End</Label>
                <DatePicker 
                  date={periodAEnd} 
                  setDate={setPeriodAEnd} 
                  placeholder="Select end date"
                />
              </div>
              <div>
                <Button 
                  onClick={handleUpdateAnalysis} 
                  className="w-full mt-6"
                  disabled={isLoadingA || isLoadingB}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Analysis
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div></div>
              <div>
                <Label>Period B Start</Label>
                <DatePicker 
                  date={periodBStart} 
                  setDate={setPeriodBStart} 
                  placeholder="Select start date"
                />
              </div>
              <div>
                <Label>Period B End</Label>
                <DatePicker 
                  date={periodBEnd} 
                  setDate={setPeriodBEnd} 
                  placeholder="Select end date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PeriodColumn
            title="Period A"
            dateRange={`${format(periodAStart, 'MMM d')} - ${format(periodAEnd, 'MMM d, yyyy')}`}
            data={periodAData}
            isLoading={isLoadingA}
          />
          <PeriodColumn
            title="Period B"
            dateRange={`${format(periodBStart, 'MMM d')} - ${format(periodBEnd, 'MMM d, yyyy')}`}
            data={periodBData}
            comparison={periodAData}
            isLoading={isLoadingB}
          />
        </div>

        {/* Cost Management */}
        <div className="mb-8">
          <CostManagement
            locationId={selectedLocation === 'all' ? null : parseInt(selectedLocation)}
            period={format(periodAStart, 'yyyy-MM')}
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
