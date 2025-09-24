'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SimpleHeader } from './SimpleHeader';
import { HorizontalFixedColumnLayout } from './HorizontalFixedColumnLayout';
import { CostManagementEnhanced } from './CostManagementEnhanced';
import { EnhancedAIAnalysis } from './EnhancedAIAnalysis'
import QuickBooksSetup from './QuickBooksSetup';
import { LocationsManager } from './LocationsManager';
import { SessionManager } from './SessionManager';
import { PDFReportGenerator } from './PDFReportGenerator';


import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Settings, 
  FileText, 
  Plus, 
  BarChart3, 
  TrendingUp, 
  PieChart,
  Download,
  Calendar,
  Building2,
  Save,
  Trash2,
  DollarSign,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { PeriodConfig, Location } from '@/shared/types';
import { useSessionManager } from '@/hooks/use-session-manager';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const { cacheSessionData } = useSessionManager();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)
  const [showQuickBooksSetup, setShowQuickBooksSetup] = useState(false)
  const [quickBooksRevenueData, setQuickBooksRevenueData] = useState<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [periods, setPeriods] = useState<PeriodConfig[]>([]);
  const [periodQueries, setPeriodQueries] = useState<any[]>([]);
  const [greyfinchData, setGreyfinchData] = useState<any>(null);
  const [acquisitionCosts, setAcquisitionCosts] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Load Greyfinch data on component mount and refresh on page load
  useEffect(() => {
    if (user?.id) {
      loadGreyfinchData();
    } else {
      // If no user, stop loading after a short delay
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  // Refresh Greyfinch data on page focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        loadGreyfinchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]);

  // Handle click outside tabs and escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tabsRef.current && !tabsRef.current.contains(event.target as Node)) {
        setActiveTab(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeTab) {
        setActiveTab(null);
      }
    };

    // Only add listeners if a tab is active
    if (activeTab) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [activeTab]);

  const handleAddPeriod = (period: Omit<PeriodConfig, 'id'>) => {
    const newPeriod: PeriodConfig = {
      ...period,
      id: `period-${Date.now()}`
    };
    setPeriods(prev => [...prev, newPeriod]);
  };

  const handleRemovePeriod = (periodId: string) => {
    setPeriods(prev => prev.filter(p => p.id !== periodId));
  };

  const handleUpdatePeriod = (periodId: string, updates: Partial<PeriodConfig>) => {
    setPeriods(prev => prev.map(p => p.id === periodId ? { ...p, ...updates } : p));
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This will remove all analysis periods, costs, and data. This action cannot be undone.')) {
      // Clear all data
      setPeriods([]);
      setPeriodQueries([]);
      setAcquisitionCosts(null);
      setAiSummary(null);
      
      // Clear Greyfinch data from localStorage
      localStorage.removeItem('greyfinchData');
      
      // Reset Greyfinch data state
      setGreyfinchData(null);
      
      // Clear locations
      setLocations([]);
      
      // Clear sessions from localStorage (they will be recreated when new data is added)
      localStorage.removeItem('orthodash-sessions');
      
      console.log('🧹 All data cleared successfully');
    }
  };

  // Load multi-location Greyfinch data from API - memoized to prevent unnecessary re-renders
  const loadGreyfinchData = useCallback(async () => {
    try {
      console.log('🔄 Fetching Gilbert and Phoenix-Ahwatukee Greyfinch data...')
      const response = await fetch('/api/greyfinch/analytics?location=all')
      const apiResponse = await response.json()
      
      if (apiResponse && apiResponse.data) {
        console.log('✅ Multi-location Greyfinch data loaded:', apiResponse)
        
        // Update dashboard with multi-location data
        setGreyfinchData(apiResponse)
        
        // Extract and set locations from the processed data
        const data = apiResponse.data
        const locationArray: Location[] = []
        
        // Create Gilbert and Phoenix-Ahwatukee locations from the processed data
        if (data.locations?.gilbert || data.locationData?.gilbert) {
          locationArray.push({
            id: 1,
            name: 'Gilbert',
            greyfinchId: 'gilbert-1',
            isActive: true
          })
        }
        
        if (data.locations?.phoenix || data.locationData?.phoenix) {
          locationArray.push({
            id: 2, 
            name: 'Phoenix-Ahwatukee',
            greyfinchId: 'phoenix-ahwatukee-1',
            isActive: true
          })
        }
        
        // If no location data found, create default locations for fallback
        if (locationArray.length === 0) {
          locationArray.push(
            {
              id: 1,
              name: 'Gilbert',
              greyfinchId: 'gilbert-1',
              isActive: true
            },
            {
              id: 2,
              name: 'Phoenix-Ahwatukee', 
              greyfinchId: 'phoenix-ahwatukee-1',
              isActive: true
            }
          )
        }
        
        console.log('📍 Setting all locations:', locationArray)
        setLocations(locationArray)
      } else {
        console.error('❌ Failed to load Greyfinch analytics data:', apiResponse.message)
        // Set default locations even on error
        const defaultLocations: Location[] = [
          {
            id: 1,
            name: 'Gilbert',
            greyfinchId: 'gilbert-1',
            isActive: true
          },
          {
            id: 2,
            name: 'Phoenix-Ahwatukee',
            greyfinchId: 'phoenix-ahwatukee-1', 
            isActive: true
          }
        ]
        setLocations(defaultLocations)
      }
    } catch (error: any) {
      console.error('❌ Error fetching Greyfinch analytics data:', error)
      setError(error?.message || 'Error fetching Greyfinch analytics data')
      
      // Set default locations even on error
      const defaultLocations: Location[] = [
        {
          id: 1,
          name: 'Gilbert',
          greyfinchId: 'gilbert-1',
          isActive: true
        },
        {
          id: 2,
          name: 'Phoenix-Ahwatukee',
          greyfinchId: 'phoenix-ahwatukee-1',
          isActive: true
        }
      ]
      setLocations(defaultLocations)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create data queries for each period - memoized for performance
  const createPeriodQueries = useCallback((periods: PeriodConfig[], greyfinchData: any) => {
    return periods.map(period => ({
      data: generatePeriodData(period, greyfinchData),
      isLoading: false,
      error: null
    }));
  }, []);

  // Generate data for a specific period - simplified for client-side compatibility
  const generatePeriodData = useCallback((period: PeriodConfig, greyfinchData: any) => {
    if (!greyfinchData) {
      return {
        period: period.name || 'Current Period',
        startDate: period.startDate,
        endDate: period.endDate,
        locationData: {
          gilbert: {
            patients: 0,
            appointments: 0,
            leads: 0,
            bookings: 0,
            revenue: 0,
            production: 0,
            netProduction: 0,
            acquisitionCosts: 0
          },
          phoenix: {
            patients: 0,
            appointments: 0,
            leads: 0,
            bookings: 0,
            revenue: 0,
            production: 0,
            netProduction: 0,
            acquisitionCosts: 0
          }
        },
        avgNetProduction: 0,
        avgAcquisitionCost: 0,
        noShowRate: 0,
        referralSources: { digital: 0, professional: 0, direct: 0 },
        conversionRates: { digital: 0, professional: 0, direct: 0 },
        trends: { weekly: [{ week: 'No Data', patients: 0, appointments: 0 }] },
        patients: 0,
        appointments: 0,
        leads: 0,
        locations: 0,
        bookings: 0,
        revenue: 0,
        production: 0,
        netProduction: 0,
        acquisitionCosts: 0
      };
    }

    // Handle the actual API response structure
    const data = greyfinchData.data || greyfinchData;
    
    // Handle multiple location selection
    const selectedLocationIds = period.locationIds || (period.locationId && period.locationId !== 'all' ? [period.locationId] : []);
    
    // Use the processed data from the API response - handle both structure formats
    const gilbertData = data.locationData?.gilbert || data.locations?.gilbert || {};
    const phoenixData = data.locationData?.phoenix || data.locations?.phoenix || {};
    
    console.log('🔍 Location data debug:', {
      hasLocationData: !!data.locationData,
      hasLocations: !!data.locations,
      gilbertData,
      phoenixData,
      totalData: data.total
    });
    
    // Calculate totals for selected locations
    let totalPatients = 0;
    let totalAppointments = 0;
    let totalLeads = 0;
    let totalBookings = 0;
    let totalRevenue = 0;
    let totalProduction = 0;
    let totalNetProduction = 0;
    let totalAcquisitionCosts = 0;
    
    // Apply location filtering - use the correct location IDs
    const includeGilbert = selectedLocationIds.length === 0 || selectedLocationIds.includes('1') || selectedLocationIds.includes('gilbert');
    const includePhoenix = selectedLocationIds.length === 0 || selectedLocationIds.includes('2') || selectedLocationIds.includes('phoenix');
    
    console.log('🎯 Location filtering:', {
      selectedLocationIds,
      includeGilbert,
      includePhoenix,
      gilbertPatients: gilbertData.patients || 0,
      phoenixPatients: phoenixData.patients || 0
    });
    
    if (includeGilbert) {
      totalPatients += gilbertData.patients || 0;
      totalAppointments += gilbertData.appointments || 0;
      totalLeads += gilbertData.leads || 0;
      totalBookings += gilbertData.bookings || 0;
      totalRevenue += gilbertData.revenue || 0;
      totalProduction += gilbertData.production || 0;
      totalNetProduction += gilbertData.netProduction || 0;
      totalAcquisitionCosts += gilbertData.acquisitionCosts || 0;
    }
    
    if (includePhoenix) {
      totalPatients += phoenixData.patients || 0;
      totalAppointments += phoenixData.appointments || 0;
      totalLeads += phoenixData.leads || 0;
      totalBookings += phoenixData.bookings || 0;
      totalRevenue += phoenixData.revenue || 0;
      totalProduction += phoenixData.production || 0;
      totalNetProduction += phoenixData.netProduction || 0;
      totalAcquisitionCosts += phoenixData.acquisitionCosts || 0;
    }
    
    // Calculate derived metrics
    const avgAcquisitionCost = totalPatients > 0 ? totalAcquisitionCosts / totalPatients : 0;
    const avgNetProduction = totalPatients > 0 ? totalNetProduction / totalPatients : 0;
    const noShowRate = data.total?.noShowRate || 0;
    
    // Get referral sources and conversion rates from the data
    const referralSources = data.total?.referralSources || { digital: 0, professional: 0, direct: 0 };
    const conversionRates = data.total?.conversionRates || { digital: 0, professional: 0, direct: 0 };
    const trends = data.total?.trends || { weekly: [], monthly: [] };
    
    return {
      period: period.name || 'Current Period',
      startDate: period.startDate,
      endDate: period.endDate,
      locationData: {
        gilbert: includeGilbert ? gilbertData : {
          patients: 0,
          appointments: 0,
          leads: 0,
          bookings: 0,
          revenue: 0,
          production: 0,
          netProduction: 0,
          acquisitionCosts: 0
        },
        phoenix: includePhoenix ? phoenixData : {
          patients: 0,
          appointments: 0,
          leads: 0,
          bookings: 0,
          revenue: 0,
          production: 0,
          netProduction: 0,
          acquisitionCosts: 0
        }
      },
      avgNetProduction,
      avgAcquisitionCost,
      noShowRate,
      referralSources,
      conversionRates,
      trends,
      patients: totalPatients,
      appointments: totalAppointments,
      leads: totalLeads,
      locations: (includeGilbert ? 1 : 0) + (includePhoenix ? 1 : 0),
      bookings: totalBookings,
      revenue: totalRevenue,
      production: totalProduction,
      netProduction: totalNetProduction,
      acquisitionCosts: totalAcquisitionCosts
    };
  }, []);

  // Update period queries when periods or greyfinchData changes - memoized for performance
  const periodQueriesMemo = useMemo(() => {
    return createPeriodQueries(periods, greyfinchData);
  }, [periods, greyfinchData, createPeriodQueries]);

  useEffect(() => {
    setPeriodQueries(periodQueriesMemo);
  }, [periodQueriesMemo]);

  // Cache session data when data changes (no API call)
  useEffect(() => {
    if (user?.id && (greyfinchData || periods.length > 0 || acquisitionCosts || aiSummary)) {
      const sessionData = {
        greyfinchData,
        periods,
        acquisitionCosts,
        aiSummary
      };
      cacheSessionData(sessionData);
    }
  }, [user?.id, greyfinchData, periods, acquisitionCosts, aiSummary, cacheSessionData]);

  // Handle Greyfinch data updates - memoized to prevent unnecessary re-renders
  const handleGreyfinchDataUpdate = useCallback((data: any) => {
    console.log('🔄 Updating Greyfinch data in Dashboard:', data)
    
    // Handle the new comprehensive data structure
    if (data.syncData) {
      setGreyfinchData(data.syncData);
      
      // Extract and set locations from the sync data
      if (data.syncData.locations) {
        const locationArray: Location[] = []
        
        // Convert the locations object to an array
        Object.values(data.syncData.locations).forEach((location: any) => {
          locationArray.push({
            id: parseInt(location.id) || Date.now(),
            name: location.name,
            greyfinchId: location.id
          })
        })
        
        console.log('📍 Setting locations from pull data:', locationArray)
        setLocations(locationArray)
      }
    } else {
      // Fallback for old data structure
      setGreyfinchData(data);
    }
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('greyfinchData', JSON.stringify(data));
    }
  }, []);

  // Session management handlers - memoized for performance
  const handleRestoreSession = useCallback((session: any) => {
    if (session.greyfinchData) {
      setGreyfinchData(session.greyfinchData);
    }
    if (session.periods) {
      setPeriods(session.periods);
    }
    if (session.acquisitionCosts) {
      setAcquisitionCosts(session.acquisitionCosts);
    }
    if (session.aiSummary) {
      setAiSummary(session.aiSummary);
    }
  }, []);

  const handlePreviewSession = useCallback((session: any) => {
    // Show session preview in a modal or sidebar
    console.log('Preview session:', session);
  }, []);

  const handleDownloadSession = useCallback((session: any) => {
    // Generate and download a comprehensive report
    console.log('Download session:', session);
  }, []);

  const handleShareSession = useCallback((session: any) => {
    // Open share modal
    console.log('Share session:', session);
  }, []);

  // Save report to the reports system - memoized for performance
  const handleSaveReport = useCallback(async (reportData: any) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Create or get current session
      let sessionId = currentSessionId;
      if (!sessionId) {
        // Create a new session for this report
        const sessionResponse = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            name: `Report Session - ${new Date().toLocaleDateString()}`,
            description: `Auto-generated session for ${reportData.title}`,
            periods: periods,
            locations: locations,
            greyfinchData: greyfinchData,
            includeCharts: true,
            includeAIInsights: true,
            includeRecommendations: true
          })
        });

        if (sessionResponse.ok) {
          const sessionResult = await sessionResponse.json();
          sessionId = sessionResult.session.id;
          setCurrentSessionId(sessionId);
        }
      }

      // Save the report
      const reportResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sessionId: sessionId,
          name: reportData.title,
          type: reportData.type,
          data: reportData.data
        })
      });

      if (reportResponse.ok) {
        console.log('Report saved successfully');
        // You could show a success toast here
      } else {
        console.error('Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }, [user?.id, periods, locations, greyfinchData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="bg-white border border-[#1C1F4F]/20 rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1C1F4F]/20 border-t-[#1C1F4F] mx-auto"></div>
          <p className="text-[#1C1F4F] text-center mt-4 font-medium">Loading Orthodash...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-red-600 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (user?.id) {
                  loadGreyfinchData();
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SimpleHeader 
        onRestoreSession={handleRestoreSession}
        onPreviewSession={handlePreviewSession}
        onDownloadSession={handleDownloadSession}
        onShareSession={handleShareSession}
      />
      
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Tabs Container */}
          <Card className={`bg-white border-[#1C1F4F]/20 shadow-lg transition-all duration-300 ease-in-out ${activeTab ? 'ring-2 ring-[#1C1F4F]/20' : ''}`} ref={tabsRef}>
            <CardHeader className="pb-4">
              <Tabs value={activeTab || "locations"} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 bg-[#1C1F4F]/5 border border-[#1C1F4F]/10">
                  <TabsTrigger 
                    value="locations" 
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 text-xs sm:text-sm"
                  >
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Locations</span>
                    <span className="xs:hidden">Loc</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="connections" 
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 text-xs sm:text-sm"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Connections</span>
                    <span className="xs:hidden">Conn</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="export" 
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 text-xs sm:text-sm"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Sessions & Reports</span>
                    <span className="xs:hidden">Sessions</span>
                  </TabsTrigger>
                </TabsList>

                {activeTab && (
                  <div className="mt-2 text-xs text-[#1C1F4F]/60 text-center">
                    Click outside or press Escape to close
                  </div>
                )}

                <TabsContent value="locations" className="mt-6">
                  <LocationsManager onGreyfinchDataUpdate={handleGreyfinchDataUpdate} />
                </TabsContent>

                <TabsContent value="connections" className="mt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-[#1C1F4F] flex items-center">
                            <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                              <Building2 className="h-4 w-4 text-white" />
                            </div>
                            Meta Ads
                          </CardTitle>
                          <CardDescription className="text-[#1C1F4F]/70">
                            Connect your Facebook and Instagram advertising accounts
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white">
                            Connect Meta Ads
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-[#1C1F4F] flex items-center">
                            <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                              <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                            Google Ads
                          </CardTitle>
                          <CardDescription className="text-[#1C1F4F]/70">
                            Connect your Google Ads account for campaign data
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white">
                            Connect Google Ads
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Enhanced QuickBooks connection card */}
                      <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-[#1C1F4F] flex items-center justify-between">
                            <div className="flex items-center">
                            <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                              <BarChart3 className="h-4 w-4 text-white" />
                            </div>
                              QuickBooks Desktop
                            </div>
                            <Badge 
                              variant={quickBooksRevenueData ? "default" : "secondary"}
                              className={quickBooksRevenueData ? "bg-green-600" : "bg-gray-400"}
                            >
                              {quickBooksRevenueData ? "Connected" : "Not Connected"}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-[#1C1F4F]/70">
                            Connect QuickBooks Desktop API for real revenue data
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {quickBooksRevenueData ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Revenue:</span>
                                  <span className="font-semibold text-green-600">
                                    ${quickBooksRevenueData.revenueMetrics?.totalRevenue?.toLocaleString() || '0'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Transactions:</span>
                                  <span className="font-semibold text-blue-600">
                                    {quickBooksRevenueData.revenueData?.length || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Locations:</span>
                                  <span className="font-semibold text-purple-600">
                                    {quickBooksRevenueData.locationRevenue?.length || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Avg/Transaction:</span>
                                  <span className="font-semibold text-orange-600">
                                    ${quickBooksRevenueData.revenueMetrics?.averageRevenuePerTransaction?.toLocaleString() || '0'}
                                  </span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-gray-200">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>Last updated: {new Date(quickBooksRevenueData.lastUpdated).toLocaleDateString()}</span>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span>Live Data</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1"
                                  onClick={() => setShowQuickBooksSetup(true)}
                                >
                                  <Settings className="h-3 w-3 mr-1" />
                                  Manage
                          </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const endDate = new Date().toISOString().split('T')[0]
                                      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                      const response = await fetch(`/api/quickbooks/revenue?startDate=${startDate}&endDate=${endDate}`)
                                      const data = await response.json()
                                      if (data.success) {
                                        setQuickBooksRevenueData(data.data)
                                        toast.success('Revenue data refreshed!')
                                      }
                                    } catch (error) {
                                      toast.error('Failed to refresh revenue data')
                                    }
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Refresh
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="text-center py-4 text-gray-500">
                                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No QuickBooks connection</p>
                                <p className="text-xs">Revenue data showing as $0</p>
                              </div>
                              <div className="space-y-2">
                                <Button 
                                  className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white"
                                  onClick={() => setShowQuickBooksSetup(true)}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Setup QuickBooks API
                                </Button>
                                <div className="text-xs text-gray-500 text-center">
                                  <p>• Connect to QuickBooks Desktop</p>
                                  <p>• Pull real revenue data</p>
                                  <p>• Replace $0 fallback values</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-[#1C1F4F] flex items-center">
                            <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                              <Settings className="h-4 w-4 text-white" />
                            </div>
                            Custom API
                          </CardTitle>
                          <CardDescription className="text-[#1C1F4F]/70">
                            Connect custom APIs for additional data sources
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white">
                            Connect Custom API
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator className="bg-[#1C1F4F]/20" />

                    {/* Greyfinch API is automatically connected using environment variables */}
                  </div>
                </TabsContent>

                {/* QuickBooks Setup Modal */}
                {showQuickBooksSetup && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold">QuickBooks Desktop API Setup</h2>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowQuickBooksSetup(false)}
                          >
                            ×
                          </Button>
                        </div>
                        <QuickBooksSetup
                          onSetupComplete={(config) => {
                            console.log('QuickBooks setup completed:', config)
                            setShowQuickBooksSetup(false)
                            toast.success('QuickBooks integration configured successfully!')
                          }}
                          onRevenueDataLoaded={(data) => {
                            console.log('QuickBooks revenue data loaded:', data)
                            setQuickBooksRevenueData(data)
                            toast.success('Revenue data loaded from QuickBooks!')
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <TabsContent value="export" className="mt-6">
                  <SessionManager 
                    periods={periods}
                    locations={locations}
                    greyfinchData={greyfinchData}
                    user={user}
                  />
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Main Dashboard Content - Analysis Columns */}
          <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-[#1C1F4F]">Analysis Periods</CardTitle>
                  <CardDescription className="text-[#1C1F4F]/70">
                    Create and manage analysis periods for your practice data
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearData}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <HorizontalFixedColumnLayout
                periods={periods}
                locations={locations}
                periodQueries={periodQueries}
                onAddPeriod={handleAddPeriod}
                onRemovePeriod={handleRemovePeriod}
                onUpdatePeriod={handleUpdatePeriod}
              />
            </CardContent>
          </Card>

          {/* Cost Management - Temporarily Hidden */}
          {/* <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1C1F4F]">Acquisition Cost Management</CardTitle>
              <CardDescription className="text-[#1C1F4F]/70">
                Manage manual costs and API integrations for comprehensive cost tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostManagementEnhanced 
                locationId={null} 
                period={periods.length > 0 ? periods[0].startDate?.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
              />
            </CardContent>
          </Card> */}


    {/* Enhanced AI Analysis */}
    <EnhancedAIAnalysis 
      selectedPeriods={periods.map(p => p.startDate?.toISOString().split('T')[0] || '')}
      selectedLocations={locations.map(l => l.name)}
      onAnalysisComplete={(data) => {
        console.log('AI Analysis completed:', data)
        // Store analysis data for potential use in other components
        localStorage.setItem('orthodash-ai-analysis', JSON.stringify(data))
      }}
    />

          {/* PDF Report Generator */}
          <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1C1F4F]">PDF Report Generator</CardTitle>
              <CardDescription className="text-[#1C1F4F]/70">
                Generate comprehensive PDF reports with all practice data, analysis, and AI insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFReportGenerator 
                greyfinchData={greyfinchData}
                periods={periods}
                acquisitionCosts={acquisitionCosts}
                aiSummary={aiSummary}
                onSaveReport={handleSaveReport}
              />
            </CardContent>
          </Card>

          {/* Greyfinch Data Explorer */}
          <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1C1F4F]">Greyfinch Data Explorer</CardTitle>
              <CardDescription className="text-[#1C1F4F]/70">
                Real-time data from Greyfinch GraphQL API - locations, patients, appointments, and weekly trends
              </CardDescription>
            </CardHeader>
            <CardContent>
      
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

