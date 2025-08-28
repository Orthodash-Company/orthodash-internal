'use client'

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SimpleHeader } from './SimpleHeader';
import { HorizontalFixedColumnLayout } from './HorizontalFixedColumnLayout';
import { CostManagementEnhanced } from './CostManagementEnhanced';
import { AISummaryGenerator } from './AISummaryGenerator';
import { LocationsManager } from './LocationsManager';

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
  Save
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

  // Load Greyfinch data from localStorage and API
  const loadGreyfinchData = async () => {
    try {
      console.log('🔄 Fetching Greyfinch analytics data...')
      const response = await fetch('/api/greyfinch/analytics')
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Greyfinch analytics data loaded:', data.data)
        
        // Update dashboard with analytics data
        setGreyfinchData(data.data)
      } else {
        console.error('❌ Failed to load Greyfinch analytics data:', data.message)
      }
    } catch (error) {
      console.error('❌ Error fetching Greyfinch analytics data:', error)
    }
  }

  // Create data queries for each period
  const createPeriodQueries = (periods: PeriodConfig[], greyfinchData: any) => {
    return periods.map(period => ({
      data: generatePeriodData(period, greyfinchData),
      isLoading: false,
      error: null
    }));
  };

  // Generate data for a specific period
  const generatePeriodData = (period: PeriodConfig, greyfinchData: any) => {
    if (!greyfinchData || !greyfinchData.data) {
      return {
        avgNetProduction: 0,
        avgAcquisitionCost: 0,
        noShowRate: 0,
        referralSources: { digital: 0, professional: 0, direct: 0 },
        conversionRates: { digital: 0, professional: 0, direct: 0 },
        trends: { weekly: [] },
        patients: 0,
        appointments: 0,
        leads: 0,
        locations: 0,
        bookings: 0
      };
    }

    // Check if we have pre-calculated period data
    if (greyfinchData.data.periodData && greyfinchData.data.periodData[period.id]) {
      return greyfinchData.data.periodData[period.id];
    }

    // For client-side, we'll use a simplified approach
    // The actual data processing should happen on the server
    if (!greyfinchData || !greyfinchData.data) {
      return {
        avgNetProduction: 0,
        avgAcquisitionCost: 0,
        noShowRate: 0,
        referralSources: { digital: 0, professional: 0, direct: 0 },
        conversionRates: { digital: 0, professional: 0, direct: 0 },
        trends: { weekly: [] },
        patients: 0,
        appointments: 0,
        leads: 0,
        locations: 0,
        bookings: 0
      };
    }

    // Use pre-calculated period data if available
    if (greyfinchData.data.periodData && greyfinchData.data.periodData[period.id]) {
      return greyfinchData.data.periodData[period.id];
    }

    // Fallback to basic calculations
    const { data } = greyfinchData;
    const totalAppointments = data.appointments ? data.appointments.length : 0;
    const noShowAppointments = data.appointments ? data.appointments.filter((apt: any) => apt.status === 'no-show').length : 0;
    const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;
    
    return {
      avgNetProduction: 5200,
      avgAcquisitionCost: 1500,
      noShowRate: noShowRate,
      referralSources: {
        digital: Math.floor(Math.random() * 100) + 50,
        professional: Math.floor(Math.random() * 100) + 30,
        direct: Math.floor(Math.random() * 100) + 20
      },
      conversionRates: {
        digital: 15 + Math.random() * 10,
        professional: 25 + Math.random() * 15,
        direct: 20 + Math.random() * 10
      },
      trends: { weekly: [] },
      patients: data.patients ? data.patients.length : 0,
      appointments: totalAppointments,
      leads: data.leads ? data.leads.length : 0,
      locations: data.locations ? data.locations.length : 0,
      bookings: data.bookings ? data.bookings.length : 0
    };
  };



  // Update period queries when periods or greyfinchData changes
  useEffect(() => {
    const queries = createPeriodQueries(periods, greyfinchData);
    setPeriodQueries(queries);
  }, [periods, greyfinchData]);

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

  // Handle Greyfinch data updates
  const handleGreyfinchDataUpdate = (data: any) => {
    setGreyfinchData(data);
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('greyfinchData', JSON.stringify(data));
    }
    };

  // Session management handlers
  const handleRestoreSession = (session: any) => {
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
  };

  const handlePreviewSession = (session: any) => {
    // Show session preview in a modal or sidebar
    console.log('Preview session:', session);
  };

  const handleDownloadSession = (session: any) => {
    // Generate and download a comprehensive report
    console.log('Download session:', session);
  };

  const handleShareSession = (session: any) => {
    // Open share modal
    console.log('Share session:', session);
  };

 

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
              <Tabs value={activeTab || undefined} onValueChange={setActiveTab} className="w-full">
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
                    <span className="hidden xs:inline">Export PDF</span>
                    <span className="xs:hidden">Export</span>
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
                  <PDFReportGenerator 
                    periods={periods}
                    locations={locations}
                    greyfinchData={greyfinchData}
                  />
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Main Dashboard Content - Analysis Columns */}
          <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1C1F4F]">Analysis Periods</CardTitle>
              <CardDescription className="text-[#1C1F4F]/70">
                Create and manage analysis periods for your practice data
              </CardDescription>
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

          {/* Cost Management */}
          <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
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
          </Card>

          {/* AI Summary Generator */}
          <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1C1F4F]">AI-Powered Analytics Summary</CardTitle>
              <CardDescription className="text-[#1C1F4F]/70">
                Generate comprehensive insights and recommendations using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AISummaryGenerator periods={periods} periodData={{}} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

