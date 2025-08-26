'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { MapPin, Database, RefreshCw, CheckCircle, Users, DollarSign, Calendar, Download } from 'lucide-react'

interface Location {
  id: string;
  name: string;
  greyfinchId?: string;
  address?: string;
  patientCount?: number;
  isLiveData?: boolean;
  isSelected?: boolean;
}

export function LocationsManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPullingData, setIsPullingData] = useState(false);
  const [pullProgress, setPullProgress] = useState<{
    organizations: number;
    locations: number;
    patients: number;
    appointments: number;
    treatments: number;
  } | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Load existing locations from localStorage or API
    const savedLocations = localStorage.getItem('orthodash-locations');
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    }

    // Check if Greyfinch is connected
    const savedCredentials = localStorage.getItem('greyfinch-credentials');
    if (savedCredentials) {
      setIsConnected(true);
    }
  }, []);

  const handlePullAllData = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to pull data",
        variant: "destructive"
      });
      return;
    }

    setIsPullingData(true);
    setPullProgress(null);
    
    try {
      const response = await fetch('/api/greyfinch/pull-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        setPullProgress(data.data);
        toast({
          title: "Data Pull Successful",
          description: `Successfully pulled data from Greyfinch API`,
        });
        
        // Refresh locations after data pull
        await loadLocations();
      } else {
        toast({
          title: "Data Pull Failed",
          description: data.message || "Failed to pull data from Greyfinch",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pull data from Greyfinch",
        variant: "destructive"
      });
    } finally {
      setIsPullingData(false);
    }
  };

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/greyfinch/test');
      const data = await response.json();
      
      if (data.success && data.locations) {
        const enhancedLocations = data.locations.map((loc: any) => ({
          ...loc,
          isSelected: selectedLocation?.id === loc.id
        }));
        setLocations(enhancedLocations);
        localStorage.setItem('orthodash-locations', JSON.stringify(enhancedLocations));
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    const updatedLocations = locations.map(loc => ({
      ...loc,
      isSelected: loc.id === location.id
    }));
    setLocations(updatedLocations);
    setSelectedLocation(location);
    localStorage.setItem('orthodash-locations', JSON.stringify(updatedLocations));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Practice Locations
          </h3>
          <p className="text-gray-600">Select a practice location to view analytics data</p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={loadLocations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <div className="h-5 w-5 text-orange-600">⚠️</div>
          )}
          <span className={`font-medium ${isConnected ? 'text-green-800' : 'text-orange-800'}`}>
            {isConnected ? 'Connected to Greyfinch API' : 'Not connected to Greyfinch API'}
          </span>
        </div>
        {isConnected && (
          <p className="text-green-700 text-sm mt-1">
            Ready to pull live data from your practice management system
          </p>
        )}
      </div>

      {/* Data Pull Section */}
      {isConnected && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Live Data Integration
            </CardTitle>
            <CardDescription className="text-blue-700">
              Pull comprehensive data from your Greyfinch practice management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {pullProgress?.patients || 0}
                  </div>
                  <div className="text-xs text-gray-500">Patients</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {pullProgress?.locations || 0}
                  </div>
                  <div className="text-xs text-gray-500">Locations</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {pullProgress?.appointments || 0}
                  </div>
                  <div className="text-xs text-gray-500">Appointments</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {pullProgress?.treatments || 0}
                  </div>
                  <div className="text-xs text-gray-500">Treatments</div>
                </div>
              </div>
              
              <Button 
                onClick={handlePullAllData} 
                disabled={isPullingData}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isPullingData ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Pulling Data...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Pull All Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Locations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="font-medium text-gray-900">Available Locations</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadLocations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {locations.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No locations found</p>
            <p className="text-gray-400 text-sm">Connect to Greyfinch API to load your practice locations</p>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  location.isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className={`h-4 w-4 ${location.isSelected ? 'text-white' : 'text-gray-500'}`} />
                    <div>
                      <div className={`font-medium ${location.isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {location.name}
                      </div>
                      {location.address && (
                        <div className={`text-sm ${location.isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                          {location.address}
                        </div>
                      )}
                    </div>
                  </div>
                  {location.patientCount && (
                    <Badge variant={location.isSelected ? "secondary" : "outline"}>
                      {location.patientCount} patients
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Location Confirmation */}
      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Selected: {selectedLocation.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
