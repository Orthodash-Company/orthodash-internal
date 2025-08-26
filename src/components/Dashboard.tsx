'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SimpleHeader } from './SimpleHeader';
import { HorizontalFixedColumnLayout } from './HorizontalFixedColumnLayout';
import { MobileFriendlyControls } from './MobileFriendlyControls';
import { CostManagementEnhanced } from './CostManagementEnhanced';
import { AISummaryGenerator } from './AISummaryGenerator';
import { LocationsManager } from './LocationsManager';
import { GreyfinchSetup } from './GreyfinchSetup';
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

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
          <Card className="bg-white border-[#1C1F4F]/20 shadow-lg">
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

                <TabsContent value="locations" className="mt-6">
                  <LocationsManager />
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
                  <div className="space-y-6">
                    {/* Report Name */}
                    <Card className="bg-white border-[#1C1F4F]/20">
                      <CardHeader>
                        <CardTitle className="text-[#1C1F4F]">Name your report</CardTitle>
                        <CardDescription className="text-[#1C1F4F]/70">
                          Give your report a descriptive name
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <input
                          type="text"
                          placeholder="Enter report name..."
                          className="w-full px-4 py-3 border border-[#1C1F4F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/20 focus:border-[#1C1F4F] text-[#1C1F4F] placeholder-[#1C1F4F]/50"
                        />
                      </CardContent>
                    </Card>

                    {/* Analysis Periods */}
                    <Card className="bg-white border-[#1C1F4F]/20">
                      <CardHeader>
                        <CardTitle className="text-[#1C1F4F] flex items-center justify-between">
                          Analysis Periods
                          <Button 
                            onClick={() => setActiveTab('locations')}
                            className="bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add More Analysis Periods
                          </Button>
                        </CardTitle>
                        <CardDescription className="text-[#1C1F4F]/70">
                          Select the periods you want to include in your report
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Placeholder for analysis periods */}
                        <div className="text-center py-8 text-[#1C1F4F]/50">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No analysis periods added yet</p>
                          <p className="text-sm">Add periods from the Locations tab to get started</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Report Options */}
                    <Card className="bg-white border-[#1C1F4F]/20">
                      <CardHeader>
                        <CardTitle className="text-[#1C1F4F]">Report Options</CardTitle>
                        <CardDescription className="text-[#1C1F4F]/70">
                          Customize what to include in your report
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" id="executive" className="rounded border-[#1C1F4F]/20 text-[#1C1F4F] focus:ring-[#1C1F4F]/20" />
                          <label htmlFor="executive" className="text-[#1C1F4F]">Executive Summary</label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" id="charts" className="rounded border-[#1C1F4F]/20 text-[#1C1F4F] focus:ring-[#1C1F4F]/20" />
                          <label htmlFor="charts" className="text-[#1C1F4F]">Detailed Charts</label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" id="recommendations" className="rounded border-[#1C1F4F]/20 text-[#1C1F4F] focus:ring-[#1C1F4F]/20" />
                          <label htmlFor="recommendations" className="text-[#1C1F4F]">Recommendations</label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Generate Report Button */}
                    <Button 
                      className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white py-4 text-lg font-semibold"
                      disabled
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Generate PDF Report
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Main Dashboard Content */}
          <HorizontalFixedColumnLayout />
          <MobileFriendlyControls />
          <CostManagementEnhanced />
          <AISummaryGenerator />
        </div>
      </main>
    </div>
  );
}
