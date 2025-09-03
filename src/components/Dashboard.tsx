'use client'

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SimpleHeader } from './SimpleHeader';
import { HorizontalFixedColumnLayout } from './HorizontalFixedColumnLayout';
import { CostManagementEnhanced } from './CostManagementEnhanced';
import { AISummaryGenerator } from './AISummaryGenerator';
import { LocationsManager } from './LocationsManager';
import { PDFReportGenerator } from './PDFReportGenerator';
import { SimpleDatePicker } from '@/components/ui/simple-date-picker';

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
  DollarSign,
  Users,
  CalendarDays,
  Target,
  BookOpen
} from 'lucide-react';
import { PeriodConfig, Location, GreyfinchData, PeriodData } from '@/shared/types';
import { useSessionManager } from '@/hooks/use-session-manager';

export default function Dashboard() {
  const { user } = useAuth();
  const { cacheSessionData } = useSessionManager();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [periods, setPeriods] = useState<PeriodConfig[]>([]);
  const [periodQueries, setPeriodQueries] = useState<PeriodData[]>([]);
  const [greyfinchData, setGreyfinchData] = useState<GreyfinchData | null>(null);
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

  const handleAddPeriod = () => {
    const newPeriod: PeriodConfig = {
      id: `period-${Date.now()}`,
      name: `Period ${periods.length + 1}`,
      title: `Period ${periods.length + 1}`,
      locationId: 'all',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      visualizations: []
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
      const response = await fetch('/api/greyfinch/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Greyfinch analytics data loaded:', data.data)
        
        // Update dashboard with analytics data
        setGreyfinchData(data.data)
        
        // Extract and set locations from the data
        if (data.data && data.data.locations) {
          const locationArray: Location[] = []
          
          // Convert the locations object to an array
          Object.values(data.data.locations).forEach((location: any) => {
            locationArray.push({
              id: parseInt(location.id) || Date.now(),
              name: location.name,
              greyfinchId: location.id
            })
          })
          
          console.log('📍 Setting locations:', locationArray)
          setLocations(locationArray)
        }
      } else {
        console.error('❌ Failed to load Greyfinch analytics data:', data.message)
      }
    } catch (error) {
      console.error('❌ Error fetching Greyfinch analytics data:', error)
    }
  }

  // Create data queries for each period
  const createPeriodQueries = (periods: PeriodConfig[], greyfinchData: GreyfinchData | null) => {
    return periods.map(period => generatePeriodData(period, greyfinchData));
  };

  // Generate data for a specific period
  const generatePeriodData = (period: PeriodConfig, greyfinchData: GreyfinchData | null): PeriodData => {
    if (!greyfinchData) {
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
        bookings: 0,
        revenue: 0,
        netProduction: 0
      };
    }

    // Check if we have pre-calculated period data
    if (greyfinchData.periodData && greyfinchData.periodData[period.id]) {
      return greyfinchData.periodData[period.id];
    }

    // Filter data based on location if specified
    let filteredLeads = greyfinchData.leads?.data || [];
    let filteredAppointments = greyfinchData.appointments?.data || [];
    let filteredBookings = greyfinchData.bookings?.data || [];
    let filteredPatients = greyfinchData.patients?.data || [];
    let totalRevenue = greyfinchData.summary?.totalRevenue || 0;
    
    if (period.locationId && period.locationId !== 'all') {
      // Filter by specific location
      filteredLeads = filteredLeads.filter((lead: any) => lead.locationId === period.locationId);
      filteredAppointments = filteredAppointments.filter((apt: any) => apt.locationId === period.locationId);
      filteredPatients = filteredPatients.filter((patient: any) => 
        patient.primaryLocation?.id === period.locationId
      );
      
      // Calculate location-specific revenue
      if (period.locationId === 'gilbert') {
        totalRevenue = greyfinchData.summary?.gilbertCounts?.revenue || 0;
      } else if (period.locationId === 'scottsdale') {
        totalRevenue = greyfinchData.summary?.scottsdaleCounts?.revenue || 0;
      }
    }
    
    // Filter by date range if specified
    if (period.startDate && period.endDate) {
      const startTime = new Date(period.startDate).getTime();
      const endTime = new Date(period.endDate).getTime();
      
      filteredLeads = filteredLeads.filter((lead: any) => {
        const leadTime = new Date(lead.createdAt).getTime();
        return leadTime >= startTime && leadTime <= endTime;
      });
      
      filteredAppointments = filteredAppointments.filter((apt: any) => {
        const aptTime = new Date(apt.scheduledDate || apt.createdAt).getTime();
        return aptTime >= startTime && aptTime <= endTime;
      });
      
      filteredBookings = filteredBookings.filter((booking: any) => {
        const bookingTime = new Date(booking.startTime).getTime();
        return bookingTime >= startTime && bookingTime <= endTime;
      });

      filteredPatients = filteredPatients.filter((patient: any) => {
        const patientTime = new Date(patient.createdAt).getTime();
        return patientTime >= startTime && patientTime <= endTime;
      });
    }
    
    const totalAppointments = filteredAppointments.length;
    const noShowAppointments = filteredAppointments.filter((apt: any) => apt.status === 'no-show').length;
    const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;
    
    // Calculate location-specific data
    const locationCount = period.locationId === 'all' ? 
      Object.keys(greyfinchData.locations || {}).length : 1;
    
    // Calculate net production (revenue minus costs)
    const avgAcquisitionCost = 1500; // This should come from cost management
    const netProduction = totalRevenue - (avgAcquisitionCost * filteredLeads.length);
    
    return {
      avgNetProduction: netProduction / Math.max(filteredAppointments.length, 1),
      avgAcquisitionCost: avgAcquisitionCost,
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
      patients: filteredPatients.length,
      appointments: totalAppointments,
      leads: filteredLeads.length,
      locations: locationCount,
      bookings: filteredBookings.length,
      revenue: totalRevenue,
      netProduction: netProduction
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
        
        setLocations(locationArray)
      }
    } else if (data.data) {
      setGreyfinchData(data.data);
      
      // Extract and set locations from the analytics data
      if (data.data.locations) {
        const locationArray: Location[] = []
        
        Object.values(data.data.locations).forEach((location: any) => {
          locationArray.push({
            id: parseInt(location.id) || Date.now(),
            name: location.name,
            greyfinchId: location.id
          })
        })
        
        setLocations(locationArray)
      }
    }
  }

  // Handle acquisition costs updates
  const handleAcquisitionCostsUpdate = (costs: any) => {
    setAcquisitionCosts(costs);
  }

  // Handle AI summary updates
  const handleAISummaryUpdate = (summary: any) => {
    setAiSummary(summary);
  }

  // Get current data counts for display
  const getCurrentCounts = () => {
    if (!greyfinchData) return { locations: 0, leads: 0, appointments: 0, patients: 0, bookings: 0, revenue: 0 };
    
    return {
      locations: Object.keys(greyfinchData.locations || {}).length,
      leads: greyfinchData.summary?.totalLeads || 0,
      appointments: greyfinchData.summary?.totalAppointments || 0,
      patients: greyfinchData.summary?.totalPatients || 0,
      bookings: greyfinchData.summary?.totalBookings || 0,
      revenue: greyfinchData.summary?.totalRevenue || 0
    };
  };

  const currentCounts = getCurrentCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Orthodash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Data Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Locations</p>
                  <p className="text-2xl font-bold text-gray-900">{currentCounts.locations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{currentCounts.patients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{currentCounts.appointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{currentCounts.leads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{currentCounts.bookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${currentCounts.revenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-lg shadow-sm border" ref={tabsRef}>
          <Tabs value={activeTab || "locations"} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 py-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="locations" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Locations</span>
                </TabsTrigger>
                <TabsTrigger value="periods" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Periods</span>
                </TabsTrigger>
                <TabsTrigger value="costs" className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Costs</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>AI Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Reports</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="locations" className="p-6">
              <LocationsManager onGreyfinchDataUpdate={handleGreyfinchDataUpdate} />
            </TabsContent>

            <TabsContent value="periods" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Analysis Periods</h2>
                    <p className="text-gray-600">Compare performance across different time periods</p>
                  </div>
                  <Button onClick={handleAddPeriod} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Period</span>
                  </Button>
                </div>

                {periods.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Periods</h3>
                      <p className="text-gray-600 mb-4">Create your first analysis period to start comparing performance data.</p>
                      <Button onClick={handleAddPeriod}>Create First Period</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {periods.map((period, index) => (
                      <Card key={period.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{period.name}</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePeriod(period.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Location Selection */}
                          <div>
                            <label className="text-sm font-medium text-gray-700">Location</label>
                            <select
                              value={period.locationId}
                              onChange={(e) => handleUpdatePeriod(period.id, { locationId: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="all">All Locations</option>
                              {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                  {location.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Date Range */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Start Date</label>
                              <SimpleDatePicker
                                date={period.startDate}
                                setDate={(date) => date && handleUpdatePeriod(period.id, { startDate: date })}
                                placeholder="Start Date"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">End Date</label>
                              <SimpleDatePicker
                                date={period.endDate}
                                setDate={(date) => date && handleUpdatePeriod(period.id, { endDate: date })}
                                placeholder="End Date"
                              />
                            </div>
                          </div>

                          {/* Period Summary */}
                          {periodQueries[index] && (
                            <div className="pt-4 border-t">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Revenue:</span>
                                  <span className="ml-2 font-medium">${periodQueries[index].revenue.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Net Production:</span>
                                  <span className="ml-2 font-medium">${periodQueries[index].netProduction.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Patients:</span>
                                  <span className="ml-2 font-medium">{periodQueries[index].patients}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Appointments:</span>
                                  <span className="ml-2 font-medium">{periodQueries[index].appointments}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="costs" className="p-6">
              <CostManagementEnhanced 
                locationId={null} 
                period={periods.length > 0 ? periods[0].startDate?.toISOString().split('T')[0] || '' : ''} 
              />
            </TabsContent>

            <TabsContent value="ai" className="p-6">
              <AISummaryGenerator 
                periods={periods}
                periodData={{}}
              />
            </TabsContent>

            <TabsContent value="reports" className="p-6">
              <PDFReportGenerator 
                periods={periods}
                locations={locations}
                greyfinchData={greyfinchData}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

