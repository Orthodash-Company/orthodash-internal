import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  MapPin, 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";

interface GreyfinchLocation {
  id: string;
  name: string;
  address: string;
  patientCount: number;
  lastSync: string;
}

interface DataSelection {
  locations: string[];
  metrics: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface GreyfinchStatus {
  status: 'connected' | 'mock' | 'error';
  dataSource?: string;
  message?: string;
}

const AVAILABLE_METRICS = [
  { id: 'patients', label: 'Patient Data', icon: Users, description: 'Demographics, referral sources, status' },
  { id: 'appointments', label: 'Appointments', icon: Calendar, description: 'Scheduling, no-shows, types' },
  { id: 'treatments', label: 'Treatments', icon: Activity, description: 'Treatment plans, procedures, revenue' },
  { id: 'referrals', label: 'Referral Sources', icon: TrendingUp, description: 'Marketing channels, conversion rates' },
];

interface GreyfinchDataModalProps {
  onDataSelected: (selection: DataSelection) => void;
  trigger?: React.ReactNode;
}

export function GreyfinchDataModal({ onDataSelected, trigger }: GreyfinchDataModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['patients', 'appointments']);

  // Query Greyfinch connection status and available locations
  const { data: greyfinchStatus, isLoading: statusLoading } = useQuery<GreyfinchStatus>({
    queryKey: ['/api/test-greyfinch'],
    enabled: open,
  });

  // Query available locations from Greyfinch
  const { data: locations = [], isLoading: locationsLoading } = useQuery<GreyfinchLocation[]>({
    queryKey: ['/api/greyfinch/locations'],
    enabled: open && greyfinchStatus?.status === 'connected',
    queryFn: async () => {
      const response = await fetch('/api/greyfinch/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
  });

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocations(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleSelectAllLocations = () => {
    setSelectedLocations(locations.map(loc => loc.id));
  };

  const handleClearLocations = () => {
    setSelectedLocations([]);
  };

  const handleConfirmSelection = () => {
    const selection: DataSelection = {
      locations: selectedLocations,
      metrics: selectedMetrics,
      dateRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        end: new Date()
      }
    };
    
    onDataSelected(selection);
    setOpen(false);
  };

  const isConnected = greyfinchStatus?.status === 'connected';
  const canProceed = selectedLocations.length > 0 && selectedMetrics.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Select Greyfinch Data
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Greyfinch Data Selection
          </DialogTitle>
          <DialogDescription>
            Choose which locations and data types to include in your analytics dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking connection...</span>
                </div>
              ) : isConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Connected to Greyfinch API</span>
                  <Badge variant="secondary" className="ml-2">
                    {greyfinchStatus?.dataSource || 'Live Data'}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Using mock data - Greyfinch API not connected</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Practice Locations ({locations.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSelectAllLocations}
                    disabled={locations.length === 0}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearLocations}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {locationsLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading locations...</span>
                </div>
              ) : locations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedLocations.includes(location.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleLocationToggle(location.id)}
                    >
                      <Checkbox
                        checked={selectedLocations.includes(location.id)}
                        onChange={() => handleLocationToggle(location.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {location.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {location.address}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-400">
                            {location.patientCount} patients
                          </span>
                          <span className="text-xs text-gray-400">
                            Last sync: {new Date(location.lastSync).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No locations found</p>
                  <p className="text-xs">Check your Greyfinch API connection</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Type Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_METRICS.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedMetrics.includes(metric.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleMetricToggle(metric.id)}
                    >
                      <Checkbox
                        checked={selectedMetrics.includes(metric.id)}
                        onChange={() => handleMetricToggle(metric.id)}
                      />
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {metric.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selection Summary */}
          {(selectedLocations.length > 0 || selectedMetrics.length > 0) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Selection Summary</span>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>{selectedLocations.length} location(s) selected</p>
                  <p>{selectedMetrics.length} data type(s) selected</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!canProceed}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply Data Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}