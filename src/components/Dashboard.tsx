'use client'

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SimpleHeader } from './SimpleHeader';
import { HorizontalFixedColumnLayout } from './HorizontalFixedColumnLayout';
import { CostManagementEnhanced } from './CostManagementEnhanced';
import { AISummaryGenerator } from './AISummaryGenerator';
import { LocationsManager } from './LocationsManager';
import { GreyfinchSetup } from './GreyfinchSetup';
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
  Building2
} from 'lucide-react';
import { PeriodConfig, Location } from '@/shared/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [periods, setPeriods] = useState<PeriodConfig[]>([]);
  const [periodQueries, setPeriodQueries] = useState<any[]>([]);
  const [greyfinchData, setGreyfinchData] = useState<any>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Load Greyfinch data on component mount
  useEffect(() => {
    if (user?.id) {
      loadGreyfinchData();
    }
  }, [user?.id]);

  // Handle click outside tabs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tabsRef.current && !tabsRef.current.contains(event.target as Node)) {
        setActiveTab(null);
      }
    };

    // Only add listener if a tab is active
    if (activeTab) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      // First try to get data from localStorage
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem('greyfinchData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setGreyfinchData(parsedData);
          console.log('Loaded Greyfinch data from localStorage:', parsedData);
        }
      }

      // Then try to pull fresh data from API
      const response = await fetch('/api/greyfinch/pull-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.counts) {
          setGreyfinchData(data);
          console.log('Pulled fresh Greyfinch data:', data);
        }
      }
    } catch (error) {
      console.error('Error loading Greyfinch data:', error);
    }
  };

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
        locations: 0
      };
    }

    // Extract data from Greyfinch for this period
    const { data } = greyfinchData;
    
    // Calculate period-specific data
    const periodData = {
      avgNetProduction: 5200, // Default value, should be calculated from actual data
      avgAcquisitionCost: 1500, // Default value
      noShowRate: data.appointments ? (data.appointments.filter((apt: any) => apt.status === 'no-show').length / data.appointments.length * 100) : 0,
      referralSources: {
        digital: Math.floor(Math.random() * 100) + 50, // Placeholder
        professional: Math.floor(Math.random() * 100) + 30,
        direct: Math.floor(Math.random() * 100) + 20
      },
      conversionRates: {
        digital: 15 + Math.random() * 10,
        professional: 25 + Math.random() * 15,
        direct: 20 + Math.random() * 10
      },
      trends: {
        weekly: generateWeeklyTrends()
      },
      patients: data.patients || 0,
      appointments: data.appointments ? data.appointments.length : 0,
      leads: data.leads ? data.leads.length : 0,
      locations: data.locations ? data.locations.length : 0
    };

    return periodData;
  };

  // Generate weekly trends data
  const generateWeeklyTrends = () => {
    const weeks = [];
    for (let i = 0; i < 8; i++) {
      weeks.push({
        week: `Week ${i + 1}`,
        digital: Math.floor(Math.random() * 50) + 20,
        professional: Math.floor(Math.random() * 40) + 15,
        direct: Math.floor(Math.random() * 30) + 10
      });
    }
    return weeks;
  };

  // Update period queries when periods or greyfinchData changes
  useEffect(() => {
    const queries = createPeriodQueries(periods, greyfinchData);
    setPeriodQueries(queries);
  }, [periods, greyfinchData]);

  // Handle Greyfinch data updates
  const handleGreyfinchDataUpdate = (data: any) => {
    setGreyfinchData(data);
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('greyfinchData', JSON.stringify(data));
    }
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
      <SimpleHeader />
      
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tabs Container */}
          <Card className={`bg-white border-[#1C1F4F]/20 shadow-lg transition-all duration-200 ${activeTab ? 'ring-2 ring-[#1C1F4F]/20' : ''}`} ref={tabsRef}>
            <CardHeader className="pb-4">
              <Tabs value={activeTab || undefined} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-[#1C1F4F]/5 border border-[#1C1F4F]/10">
                  <TabsTrigger 
                    value="locations" 
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Locations
                  </TabsTrigger>
                  <TabsTrigger 
                    value="connections" 
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Connections
                  </TabsTrigger>
                  <TabsTrigger 
                    value="export" 
                    className="data-[state=active]:bg-[#1C1F4F] data-[state=active]:text-white text-[#1C1F4F] border-[#1C1F4F]/20 data-[state=active]:border-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
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

                    <GreyfinchSetup />
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
