'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, RefreshCw, MapPin, Database, Users, Calendar, DollarSign, BookOpen } from 'lucide-react';
import { Location as DashboardLocation } from '@/shared/types';

interface Location {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  greyfinchId?: string;
}

interface DataCounts {
  patients?: number;
  locations?: number;
  appointments?: number;
  leads?: number;
  bookings?: number;
  [key: string]: number | undefined;
}

interface MetricCardDefinition {
  key: keyof DataCounts;
  label: string;
  tooltip: string;
  icon: typeof Users;
  iconClassName: string;
}

interface LocationsManagerProps {
  greyfinchData?: any;
  dashboardLocations?: DashboardLocation[];
  isRefreshingGreyfinchData?: boolean;
  onGreyfinchDataUpdate?: (data: any) => void;
  onRefreshGreyfinchData?: () => Promise<boolean>;
  initialCounts?: DataCounts;
  onCountsUpdate?: (counts: DataCounts) => void;
  onDataLoadingChange?: (isLoading: boolean) => void;
}

// Dynamic connection status component - updated for production deployment
export function LocationsManager({
  greyfinchData,
  dashboardLocations,
  isRefreshingGreyfinchData = false,
  onGreyfinchDataUpdate,
  onRefreshGreyfinchData,
  initialCounts,
  onCountsUpdate,
  onDataLoadingChange,
}: LocationsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [dataCounts, setDataCounts] = useState<DataCounts>(initialCounts ?? {});
  const [hasLoadedCounts, setHasLoadedCounts] = useState(Boolean(initialCounts && Object.keys(initialCounts).length > 0));
  const [lastPullTime, setLastPullTime] = useState<string | null>(null);
  const [connectionChecked, setConnectionChecked] = useState(false);

  const metricCards: MetricCardDefinition[] = [
    {
      key: 'patients',
      label: 'Patients',
      tooltip: 'Active treatment patients from the Greyfinch Practice Monitor report, year to date.',
      icon: Users,
      iconClassName: 'text-blue-500',
    },
    {
      key: 'locations',
      label: 'Locations',
      tooltip: 'Practice locations currently available in Greyfinch for this dashboard.',
      icon: MapPin,
      iconClassName: 'text-green-500',
    },
    {
      key: 'appointments',
      label: 'Appointments',
      tooltip: 'Total completed appointments from the Greyfinch Practice Efficiency report, year to date.',
      icon: Calendar,
      iconClassName: 'text-purple-500',
    },
    {
      key: 'leads',
      label: 'Leads',
      tooltip: 'Total prospects currently counted in Greyfinch leads data.',
      icon: DollarSign,
      iconClassName: 'text-orange-500',
    },
    {
      key: 'bookings',
      label: 'Bookings',
      tooltip: 'Placeholder metric. Booking definition is still being finalized.',
      icon: BookOpen,
      iconClassName: 'text-red-500',
    },
  ];

  const fetchCounts = useCallback(async (refresh = false) => {
    setIsLoadingCounts(true);
    try {
      const liveRes = await fetch(`/api/greyfinch/live-counts${refresh ? '?refresh=true' : ''}`);
      const liveJson = await liveRes.json();
      const counts: DataCounts = {};
      if (liveJson.success && liveJson.data) {
        counts.patients = liveJson.data.activeTxPatients ?? undefined;
        counts.locations = liveJson.data.locations ?? undefined;
        counts.appointments = liveJson.data.newPatExams ?? undefined;
        counts.leads = liveJson.data.leads ?? undefined;
        counts.bookings = liveJson.data.startApptCompleted ?? undefined;
        counts.activeTxPatients = liveJson.data.activeTxPatients ?? undefined;
        counts.newPatientsCreated = liveJson.data.newPatientsCreated ?? undefined;
        counts.caseStarts = liveJson.data.caseStarts ?? undefined;
      }
      setDataCounts(prev => ({ ...prev, ...counts }));
      onCountsUpdate?.(counts);
    } catch (err) {
      console.error('Failed to load Greyfinch live counts:', err);
    } finally {
      setHasLoadedCounts(true);
      setIsLoadingCounts(false);
    }
  }, [onCountsUpdate]);

  useEffect(() => {
    if (!user?.id) {
      setIsConnected(false);
      setConnectionChecked(false);
      setHasLoadedCounts(false);
      return;
    }

    if (greyfinchData) {
      setIsConnected(true);
      setConnectionChecked(true);
    }
  }, [user?.id, greyfinchData]);

  useEffect(() => {
    if (dashboardLocations && dashboardLocations.length > 0) {
      setLocations(dashboardLocations.map((location) => ({
        id: String(location.greyfinchId || location.id),
        name: location.name,
        address: (location as any).address,
        isActive: location.isActive ?? true,
      })));
    }
  }, [dashboardLocations]);

  // Fire counts as soon as the user is authenticated — don't gate on greyfinchData
  useEffect(() => {
    if (user?.id && !hasLoadedCounts) {
      void fetchCounts();
    }
  }, [user?.id, hasLoadedCounts, fetchCounts]);

  useEffect(() => {
    onDataLoadingChange?.(isRefreshingGreyfinchData || isLoading || isLoadingCounts);
  }, [isRefreshingGreyfinchData, isLoading, isLoadingCounts, onDataLoadingChange]);

  useEffect(() => {
    if (!greyfinchData?.data) {
      return;
    }

    const data = greyfinchData.data;
    const locationCount = Array.isArray(data.locations)
      ? data.locations.length
      : (data.total?.locations ?? Object.keys(data.locationData || {}).length);

    setDataCounts((prev) => ({ ...prev, locations: locationCount }));
    if (greyfinchData.lastUpdated) {
      setLastPullTime(new Date(greyfinchData.lastUpdated).toLocaleString());
    }
  }, [greyfinchData]);


  const checkConnectionAndFetchLocations = useCallback(async () => {
    if (!user?.id) {
      setIsConnected(false);
      setConnectionChecked(false);
      return;
    }

    if (onRefreshGreyfinchData) {
      setIsLoading(true);
      try {
        const success = await onRefreshGreyfinchData();
        setIsConnected(success);
        setConnectionChecked(true);
      } catch (error) {
        setIsConnected(false);
        setConnectionChecked(true);
        console.error('❌ Error refreshing Greyfinch data:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true)
    console.log('🔄 Checking Greyfinch connection...')
    
    try {
      const url = '/api/greyfinch/sync'
      console.log('📡 Making request to:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      const data = await response.json()
      console.log('📦 Greyfinch analytics response:', data)
      console.log('📦 Response success:', data.success)
      console.log('📦 Response message:', data.message)
      
      // The API is connected successfully if we get a response with success: true
      if (data.success) {
        console.log('✅ Setting connection to true')
        setIsConnected(true)
        setConnectionChecked(true)
        
        // Force a re-render by updating state immediately
        setTimeout(() => {
          console.log('🔄 Forcing re-render with connected state')
          setIsConnected(true)
        }, 0)
        
        // Update counts from analytics data
        if (data.data) {
          const newCounts = {
            patients: data.data.patients?.count || 0,
            locations: Object.keys(data.data.locations || {}).length, // All available locations
            appointments: data.data.appointments?.count || 0,
            leads: data.data.leads?.count || 0
          }
          console.log('📊 Setting new counts:', newCounts)
          setDataCounts(newCounts)
        }
        
        console.log('✅ Greyfinch API connected successfully with analytics data:', data.data)
      } else {
        console.log('❌ Setting connection to false')
        console.log('❌ Failure reason:', data.message)
        setIsConnected(false)
        setConnectionChecked(true)
        console.log('❌ Greyfinch API connection failed:', data.message)
      }
    } catch (error) {
      console.log('❌ Setting connection to false due to error')
      console.log('❌ Error details:', error)
      setIsConnected(false)
      setConnectionChecked(true)
      console.error('❌ Error checking Greyfinch connection:', error)
    } finally {
      setIsLoading(false)
      console.log('🏁 Connection check completed. Final state:', { isConnected, connectionChecked })
    }
  }, [onRefreshGreyfinchData, user?.id])

  const handlePullAllData = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to pull data.",
        variant: "destructive",
      });
      return;
    }

    if (isLoading || isLoadingCounts || isRefreshingGreyfinchData) {
      return;
    }

    setIsLoading(true);
    try {
      await checkConnectionAndFetchLocations();
      await fetchCounts(true);
      setLastPullTime(new Date().toLocaleString());
      
      console.log('✅ Comprehensive data refresh completed successfully')
      
    } catch (error) {
      console.error('❌ Error pulling comprehensive data:', error);
      toast({
        title: "Data Pull Failed",
        description: error instanceof Error ? error.message : "Failed to pull data from Greyfinch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [checkConnectionAndFetchLocations, fetchCounts, isLoading, isLoadingCounts, isRefreshingGreyfinchData, toast, user?.id]);

  // Memoize data counts display for performance
  const showCountsSkeleton = !hasLoadedCounts || isLoadingCounts || isRefreshingGreyfinchData;

  const dataCountsDisplay = useMemo(() => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {metricCards.map((card) => {
        const Icon = card.icon;

        return (
          <Tooltip key={card.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-center p-4 bg-white border border-gray-200 rounded-lg transition-colors hover:border-[#1C1F4F]/30 hover:bg-gray-50"
              >
                <Icon className={`h-8 w-8 mx-auto mb-2 ${card.iconClassName}`} />
                {showCountsSkeleton ? (
                  <Skeleton className="mx-auto mb-2 h-9 w-16 bg-gray-200" />
                ) : (
                  <div className="text-2xl font-bold text-[#1C1F4F]">
                    {card.key === 'bookings' ? (
                      <span className="inline-flex items-center rounded-full bg-[#1C1F4F]/8 px-3 py-1 text-sm font-semibold tracking-[0.2em] text-[#1C1F4F]/60">
                        TBD
                      </span>
                    ) : (dataCounts[card.key] || 0)}
                  </div>
                )}
                <div className="text-sm text-gray-600">{card.label}</div>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-56 text-center">
              {card.tooltip}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  ), [dataCounts, metricCards, showCountsSkeleton]);

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
          <div className="flex items-center p-3 rounded-lg bg-gray-50 space-x-2">
            {isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? 'Connected to Greyfinch API' : 'Not connected to Greyfinch API'}
            </span>
          </div>

          {/* Data Counts */}
          {dataCountsDisplay}

          {/* Pull Data Button */}
          <Button
            onClick={handlePullAllData}
            disabled={isLoading || isLoadingCounts || isRefreshingGreyfinchData || !isConnected}
            className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading || isLoadingCounts || isRefreshingGreyfinchData ? 'Refreshing Data...' : 'Pull All Data'}
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
          <CardTitle className="text-[#1C1F4F] flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Available Locations
          </CardTitle>
          <CardDescription className="text-[#1C1F4F]/70">
            Practice locations available for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length > 0 ? (
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                  location.isActive 
                    ? 'border-gray-200 bg-white' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <MapPin className={`h-4 w-4 ${
                      location.isActive ? 'text-[#1C1F4F]' : 'text-gray-400'
                    }`} />
                    <div>
                      <div className={`font-medium ${
                        location.isActive ? 'text-[#1C1F4F]' : 'text-gray-500'
                      }`}>
                        {location.name}
                        {!location.isActive && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                            Offline
                          </span>
                        )}
                      </div>
                      {location.address && (
                        <div className={`text-sm ${
                          location.isActive ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {location.address}
                        </div>
                      )}
                    </div>
                  </div>
                  {!location.isActive && (
                    <div className="text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded">
                      Unavailable
                    </div>
                  )}
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
