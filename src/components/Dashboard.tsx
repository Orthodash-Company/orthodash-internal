'use client'

import { useState, useEffect } from "react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { HorizontalFixedColumnLayout } from "@/components/HorizontalFixedColumnLayout";
import { MobileFriendlyControls } from "@/components/MobileFriendlyControls";
import { CostManagementEnhanced } from "@/components/CostManagementEnhanced";
import { AISummaryGenerator } from "@/components/AISummaryGenerator";
import { format } from "date-fns";
import { PeriodConfig, Location } from "@/shared/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Link, FileText } from "lucide-react";

export default function Dashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<PeriodConfig[]>([]);
  const [periodQueries, setPeriodQueries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("locations");

  useEffect(() => {
    // Load locations and initial data
    setLoading(false);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <SimpleHeader />
      
      {/* Main content with proper spacing for floating header */}
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Tabs Section */}
          <div className="mb-8">
            <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200">
                  <TabsList className="grid w-full grid-cols-3 bg-transparent h-16">
                    <TabsTrigger 
                      value="locations" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                    >
                      <MapPin className="h-4 w-4" />
                      Locations
                    </TabsTrigger>
                    <TabsTrigger 
                      value="connections" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                    >
                      <Link className="h-4 w-4" />
                      Connections
                    </TabsTrigger>
                    <TabsTrigger 
                      value="export" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                    >
                      <FileText className="h-4 w-4" />
                      Export PDF
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="locations" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Practice Locations</h3>
                    <p className="text-gray-600">Select a practice location to view analytics data</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">No locations found</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Load Locations
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="connections" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Greyfinch API Setup</h3>
                    <p className="text-gray-600">Configure your Greyfinch credentials to enable integration</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <input 
                          type="text" 
                          placeholder="Enter your Greyfinch API key"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Secret</label>
                        <input 
                          type="password" 
                          placeholder="Enter your Greyfinch API secret"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Setup API
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <span>⚠</span>
                      <span>Not connected to API</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="export" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Export PDF</h3>
                    <p className="text-gray-600">Generate and download PDF reports of your analytics data</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Comprehensive Analytics Report</option>
                          <option>Patient Acquisition Summary</option>
                          <option>Treatment Efficiency Report</option>
                          <option>Financial Performance Report</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="date" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input 
                            type="date" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Generate PDF
                      </button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 custom-scrollbar">
            {/* Main Content Area */}
            <div className="xl:col-span-3">
              <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <HorizontalFixedColumnLayout
                  periods={periods}
                  locations={locations}
                  periodQueries={periodQueries}
                  onAddPeriod={handleAddPeriod}
                  onRemovePeriod={handleRemovePeriod}
                  onUpdatePeriod={handleUpdatePeriod}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <MobileFriendlyControls
                  periods={periods}
                  locations={locations}
                  onAddPeriod={handleAddPeriod}
                  onClearData={() => setPeriods([])}
                  onExport={() => {}}
                  onShare={() => ({})}
                  onGreyfinchDataSelected={() => {}}
                />
              </div>

              <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <CostManagementEnhanced
                  locationId={null}
                  period=""
                />
              </div>

              <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <AISummaryGenerator
                  periods={periods}
                  periodData={{}}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
