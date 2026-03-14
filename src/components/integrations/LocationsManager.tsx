'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, RefreshCw, MapPin, Database, Users, Calendar, DollarSign, BookOpen } from 'lucide-react';
import { type Location, type DataCounts } from '@/shared/types';

// Internal display type — id is a string (greyfinchId or numeric id coerced to string)
interface LocationDisplay {
  id: string;
  name: string;
  isActive: boolean;
}

interface MetricCardDefinition {
  key: keyof DataCounts;
  label: string;
  tooltip: string;
  icon: typeof Users;
  iconClassName: string;
}

interface LocationsManagerProps {
  greyfinchData?: unknown;
  dashboardLocations?: Location[];
  isRefreshingGreyfinchData?: boolean;
  onRefreshGreyfinchData?: () => Promise<boolean>;
  initialCounts?: DataCounts;
  onCountsUpdate?: (counts: DataCounts) => void;
  onDataLoadingChange?: (isLoading: boolean) => void;
}

export function LocationsManager({
  greyfinchData,
  dashboardLocations,
  isRefreshingGreyfinchData = false,
  onRefreshGreyfinchData,
  initialCounts,
  onCountsUpdate,
  onDataLoadingChange,
}: LocationsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<LocationDisplay[]>([]);
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
    const data = (greyfinchData as { data?: { locations?: unknown[] } } | null)?.data;
    if (!data) return;

    const locationCount = Array.isArray(data.locations) ? data.locations.length : 0;
    setDataCounts((prev) => ({ ...prev, locations: locationCount }));
  }, [greyfinchData]);

  const checkConnectionAndFetchLocations = useCallback(async () => {
    if (!user?.id) {
      setIsConnected(false);
      setConnectionChecked(false);
      return;
    }

    if (!onRefreshGreyfinchData) return;

    setIsLoading(true);
    try {
      const success = await onRefreshGreyfinchData();
      setIsConnected(success);
      setConnectionChecked(true);
    } catch (error) {
      setIsConnected(false);
      setConnectionChecked(true);
      console.error('Error refreshing Greyfinch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onRefreshGreyfinchData, user?.id]);

  const handlePullAllData = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to pull data.",
        variant: "destructive",
      });
      return;
    }

    if (isLoading || isLoadingCounts || isRefreshingGreyfinchData) return;

    setIsLoading(true);
    try {
      await checkConnectionAndFetchLocations();
      await fetchCounts(true);
      setLastPullTime(new Date().toLocaleString());
    } catch (error) {
      toast({
        title: "Data Pull Failed",
        description: error instanceof Error ? error.message : "Failed to pull data from Greyfinch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [checkConnectionAndFetchLocations, fetchCounts, isLoading, isLoadingCounts, isRefreshingGreyfinchData, toast, user?.id]);

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
                <div className="text-sm text-gray-600 underline decoration-dotted underline-offset-4 decoration-[#1d1d52]/35">
                  {card.label}
                </div>
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
