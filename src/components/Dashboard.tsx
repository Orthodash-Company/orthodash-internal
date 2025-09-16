'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SimpleHeader } from './SimpleHeader';
import { HorizontalFixedColumnLayout } from './HorizontalFixedColumnLayout';
import { CostManagementEnhanced } from './CostManagementEnhanced';
import { AISummaryGenerator } from './AISummaryGenerator';
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
  Trash2
} from 'lucide-react';
import { PeriodConfig, Location } from '@/shared/types';
import { useSessionManager } from '@/hooks/use-session-manager';

export default function Dashboard() {
  const { user } = useAuth();
  const { cacheSessionData } = useSessionManager();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load Greyfinch data from localStorage and API - memoized to prevent unnecessary re-renders
  const loadGreyfinchData = useCallback(async () => {
    try {
      console.log('🔄 Fetching Gilbert Greyfinch data...')
      const response = await fetch('/api/greyfinch/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ All locations Greyfinch data loaded:', data.data)
        
        // Update dashboard with all locations data
        setGreyfinchData(data.data)
        
        // Extract and set locations from the data (all 5 locations)
        if (data.data && data.data.locations) {
          const locationArray: Location[] = []
          
          // Convert the locations array to our Location format
          if (Array.isArray(data.data.locations)) {
            data.data.locations.forEach((location: any) => {
              locationArray.push({
                id: parseInt(location.id) || Date.now(), // Convert to number ID
                name: location.name,
                greyfinchId: location.id,
                isActive: location.isActive !== false
              })
            })
          } else {
            // Fallback for object format
            Object.values(data.data.locations).forEach((location: any) => {
              locationArray.push({
                id: parseInt(location.id) || Date.now(),
                name: location.name,
                greyfinchId: location.id,
                isActive: location.isActive !== false
              })
            })
          }
          
          console.log('📍 Setting all locations:', locationArray)
          setLocations(locationArray)
        }
      } else {
        console.error('❌ Failed to load Greyfinch analytics data:', data.message)
      }
    } catch (error) {
      console.error('❌ Error fetching Greyfinch analytics data:', error)
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

  // Generate data for a specific period using GreyfinchDataService - memoized for performance
  const generatePeriodData = useCallback((period: PeriodConfig, greyfinchData: any) => {
    if (!greyfinchData || !greyfinchData.data) {
      return {
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

    // Use GreyfinchDataService to generate period data with proper multi-location support
    const periodConfig = {
      startDate: period.startDate,
      endDate: period.endDate,
      locationId: period.locationId,
      locationIds: period.locationIds
    };

    // Import GreyfinchDataService dynamically to avoid circular imports
    const { GreyfinchDataService } = require('@/lib/services/greyfinch-data');
    return GreyfinchDataService.generatePeriodData(periodConfig, greyfinchData);
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

                      <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-[#1C1F4F] flex items-center">
                            <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                              <BarChart3 className="h-4 w-4 text-white" />
                            </div>
                            QuickBooks
                          </CardTitle>
                          <CardDescription className="text-[#1C1F4F]/70">
                            Connect QuickBooks for vendor and revenue data
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white">
                            Connect QuickBooks
                          </Button>
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

          {/* AI Summary Generator */}
          <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1C1F4F]">AI-Powered Analytics Summary</CardTitle>
              <CardDescription className="text-[#1C1F4F]/70">
                Generate comprehensive insights and recommendations using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AISummaryGenerator 
                periods={periods} 
                periodData={periodQueries}
                locations={locations}
                greyfinchData={greyfinchData}
                acquisitionCosts={acquisitionCosts}
              />
            </CardContent>
          </Card>

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

