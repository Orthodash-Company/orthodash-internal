'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, RefreshCw, MapPin, Database, Users, Calendar, DollarSign } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Location {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
}

interface DataCounts {
  patients?: number;
  locations?: number;
  appointments?: number;
  treatments?: number;
  [key: string]: number | undefined;
}

interface LocationsManagerProps {
  onGreyfinchDataUpdate?: (data: any) => void;
}

export function LocationsManager({ onGreyfinchDataUpdate }: LocationsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataCounts, setDataCounts] = useState<DataCounts>({});
  const [lastPullTime, setLastPullTime] = useState<string | null>(null);

  useEffect(() => {
    // Always check connection on mount, regardless of user state
    // This will use environment variables automatically
    checkConnectionAndFetchLocations();
  }, []);

  // Also check when user changes
  useEffect(() => {
    if (user?.id) {
      // Re-check connection when user is available
      checkConnectionAndFetchLocations();
    }
  }, [user?.id]);

  const checkConnectionAndFetchLocations = async () => {
    setIsLoading(true);
    try {
      // Always try to connect using environment variables first
      // The API will automatically use GREYFINCH_API_KEY from environment
      const url = '/api/greyfinch/test';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setLocations(data.locations || []);
        
        // Update data counts from the connection test
        if (data.connectionTest) {
          const newDataCounts = {
            patients: data.connectionTest.patients || 0,
            locations: data.connectionTest.locations || 0,
            appointments: data.connectionTest.appointments || 0,
            treatments: data.connectionTest.treatments || 0,
            companies: data.connectionTest.companies || 0,
            leads: data.connectionTest.leads || 0,
            apps: data.connectionTest.apps || 0,
            appointmentBookings: data.connectionTest.appointmentBookings || 0
          };
          setDataCounts(newDataCounts);
          
          // Pass data to parent component
          if (onGreyfinchDataUpdate) {
            onGreyfinchDataUpdate(newDataCounts);
          }
        }
        
        toast({
          title: "Greyfinch Connected",
          description: "Successfully connected to Greyfinch API.",
        });
      } else {
        setIsConnected(false);
        setLocations([]);
        setDataCounts({});
        toast({
          title: "Greyfinch Not Connected",
          description: data.error || "Failed to connect to Greyfinch API. Please check credentials in Connections tab.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking Greyfinch connection:', error);
      setIsConnected(false);
      setLocations([]);
      setDataCounts({});
      toast({
        title: "Connection Error",
        description: "Could not reach Greyfinch API. Please check your network and credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullAllData = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to pull data.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Initialize database first
      const initResponse = await fetch('/api/db/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!initResponse.ok) {
        throw new Error('Database initialization failed');
      }
      
      // Pull basic counts using environment variables
      const response = await fetch('/api/greyfinch/basic-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id
          // API key will be automatically loaded from environment variables
        }),
      });
      const data = await response.json();

      if (data.success) {
        // Update data counts with basic Greyfinch data
        setDataCounts({
          patients: data.data.counts.patients || 0,
          locations: data.data.counts.locations || 0,
          appointments: data.data.counts.appointments || 0,
          leads: data.data.counts.leads || 0
        });
        
        setLastPullTime(new Date().toLocaleString());
        
        // Pass the basic data to parent component
        if (onGreyfinchDataUpdate) {
          onGreyfinchDataUpdate({
            counts: data.data.counts,
            pulledAt: data.data.pulledAt
          });
        }
        
        toast({
          title: "Basic Data Pull Successful",
          description: `Successfully pulled basic counts from Greyfinch. Found ${data.data.counts.locations || 0} locations, ${data.data.counts.appointments || 0} appointments, and ${data.data.counts.leads || 0} leads. Detailed data will be pulled in the background while you set up analysis periods.`,
        });
      } else {
        toast({
          title: "Data Pull Failed",
          description: data.message || "Failed to pull basic data from Greyfinch.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error pulling basic data:', error);
      toast({
        title: "Data Pull Failed",
        description: "Failed to pull basic data from Greyfinch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#1C1F4F] flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Live Data Integration
          </CardTitle>
          <CardDescription className="text-[#1C1F4F]/70">
            Pull comprehensive data from your Greyfinch practice management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              ) : isConnected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isLoading ? 'Checking connection...' : 
                 isConnected ? 'Connected to Greyfinch API' : 
                 'Not connected to Greyfinch API'}
              </span>
            </div>
            <Button
              onClick={checkConnectionAndFetchLocations}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Data Counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-[#1C1F4F]">{dataCounts.patients || 0}</div>
              <div className="text-sm text-gray-600">Patients</div>
            </div>
            <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-[#1C1F4F]">{dataCounts.locations || 0}</div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
            <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-[#1C1F4F]">{dataCounts.appointments || 0}</div>
              <div className="text-sm text-gray-600">Appointments</div>
            </div>
            <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-[#1C1F4F]">{dataCounts.leads || 0}</div>
              <div className="text-sm text-gray-600">Leads</div>
            </div>
          </div>

          {/* Pull Data Button */}
          <Button
            onClick={handlePullAllData}
            disabled={isLoading || !isConnected}
            className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading ? 'Pulling Data...' : 'Pull All Data'}
          </Button>



          {lastPullTime && (
            <p className="text-xs text-gray-500 text-center">
              Last pulled: {lastPullTime}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Locations */}
      <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#1C1F4F] flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Available Locations
            </div>
            <Button
              onClick={checkConnectionAndFetchLocations}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription className="text-[#1C1F4F]/70">
            Practice locations available for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length > 0 ? (
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-[#1C1F4F]" />
                    <div>
                      <div className="font-medium">{location.name}</div>
                      {location.address && (
                        <div className="text-sm text-gray-600">{location.address}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={selectedLocation || ''} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={location.id}>Use</SelectItem>
                        <SelectItem value="">Don't use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No locations found</p>
              <p className="text-sm">Connect to Greyfinch API to load your practice locations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
