'use client'

import { useState, useEffect } from "react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { HorizontalFixedColumnLayout } from "@/components/HorizontalFixedColumnLayout";
import { MobileFriendlyControls } from "@/components/MobileFriendlyControls";
import { CostManagementEnhanced } from "@/components/CostManagementEnhanced";
import { AISummaryGenerator } from "@/components/AISummaryGenerator";
import { LocationsManager } from "@/components/LocationsManager";
import { format } from "date-fns";
import { PeriodConfig, Location } from "@/shared/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Link, FileText, Database } from "lucide-react";
import { GreyfinchSetup } from "@/components/GreyfinchSetup";

export default function Dashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<PeriodConfig[]>([]);
  const [periodQueries, setPeriodQueries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

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
      <div className="min-h-screen bg-[#1d1d52] flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1d1d52]">
      <SimpleHeader />
      
      {/* Main content with proper spacing for floating header */}
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Compact Tabs Section */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 overflow-hidden">
            <Tabs value={activeTab || ""} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-white/20">
                <TabsList className="flex justify-start bg-transparent h-12 px-4">
                  <TabsTrigger 
                    value="locations" 
                    className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-white/70 hover:text-white transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Locations
                  </TabsTrigger>
                  <TabsTrigger 
                    value="connections" 
                    className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-white/70 hover:text-white transition-colors"
                  >
                    <Link className="h-4 w-4" />
                    Connections
                  </TabsTrigger>
                  <TabsTrigger 
                    value="export" 
                    className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-white/70 hover:text-white transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </TabsTrigger>
                </TabsList>
              </div>

              {activeTab && (
                <>
                  <TabsContent value="locations" className="p-6">
                    <LocationsManager />
                  </TabsContent>

                  <TabsContent value="connections" className="p-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-white">External API Connections</h3>
                      <p className="text-white/70">Configure external API integrations for enhanced data analysis</p>
                      
                      {/* Greyfinch API Setup */}
                      <div className="p-6 border border-white/20 rounded-lg bg-white/10">
                        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                          <Database className="h-5 w-5 text-blue-400" />
                          Greyfinch API
                        </h4>
                        <p className="text-sm text-white/70 mb-4">Connect your Greyfinch practice management system to import live data</p>
                        
                        <GreyfinchSetup />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-white/20 rounded-lg bg-white/10">
                          <h4 className="font-medium text-white mb-2">Meta Ads</h4>
                          <p className="text-sm text-white/70 mb-3">Connect your Meta Business account to import advertising spend data</p>
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                            Connect
                          </button>
                        </div>
                        <div className="p-4 border border-white/20 rounded-lg bg-white/10">
                          <h4 className="font-medium text-white mb-2">Google Ads</h4>
                          <p className="text-sm text-white/70 mb-3">Import Google Ads campaign performance and spend data</p>
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                            Connect
                          </button>
                        </div>
                        <div className="p-4 border border-white/20 rounded-lg bg-white/10">
                          <h4 className="font-medium text-white mb-2">QuickBooks</h4>
                          <p className="text-sm text-white/70 mb-3">Sync vendor data, revenue, and expense information</p>
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                            Connect
                          </button>
                        </div>
                        <div className="p-4 border border-white/20 rounded-lg bg-white/10">
                          <h4 className="font-medium text-white mb-2">Custom API</h4>
                          <p className="text-sm text-white/70 mb-3">Connect to other data sources with custom API configuration</p>
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                            Configure
                          </button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="export" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Export PDF</h3>
                        <p className="text-white/70">Generate and download PDF reports of your analytics data</p>
                      </div>
                      
                      {/* Report Name Section */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-white">Name your report</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Q4 2024 Practice Performance Analysis"
                          className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/10 text-white placeholder-white/50"
                        />
                      </div>

                      {/* Analysis Periods Section */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-white">Analysis Periods</label>
                        
                        {periods.length === 0 ? (
                          <div className="space-y-3">
                            {/* Skeleton Placeholders */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div className="h-20 bg-white/10 rounded-lg animate-pulse flex items-center justify-center">
                                <div className="text-white/50 text-sm">Add analysis period</div>
                              </div>
                              <div className="h-20 bg-white/10 rounded-lg animate-pulse flex items-center justify-center">
                                <div className="text-white/50 text-sm">Add analysis period</div>
                              </div>
                              <div className="h-20 bg-white/10 rounded-lg animate-pulse flex items-center justify-center">
                                <div className="text-white/50 text-sm">Add analysis period</div>
                              </div>
                            </div>
                            <p className="text-sm text-white/50">Add analysis periods from the main dashboard to include in your report</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Compressed Previews */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {periods.map((period, index) => (
                                <div key={period.id} className="bg-white/10 border border-white/20 rounded-lg p-3 hover:border-blue-400 transition-colors">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-white text-sm truncate">{period.name}</h4>
                                      <p className="text-xs text-white/60">
                                        {format(period.startDate, 'MMM d')} - {format(period.endDate, 'MMM d, yyyy')}
                                      </p>
                                    </div>
                                    <button 
                                      onClick={() => handleRemovePeriod(period.id)}
                                      className="text-white/50 hover:text-red-400 transition-colors ml-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  
                                  {/* Location Info */}
                                  <div className="flex items-center gap-1 mb-2">
                                    <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-xs text-white/60">
                                      {locations.find(loc => loc.id.toString() === period.locationId)?.name || 'Unknown Location'}
                                    </span>
                                  </div>

                                  {/* Chart Types Preview */}
                                  {period.visualizations && period.visualizations.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {period.visualizations.slice(0, 3).map((viz, vizIndex) => (
                                        <span key={viz.id} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-600/20 text-blue-300">
                                          {viz.type}
                                        </span>
                                      ))}
                                      {period.visualizations.length > 3 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-white/10 text-white/60">
                                          +{period.visualizations.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-white/40 mb-2">No visualizations</div>
                                  )}

                                  {/* Summary Snippet */}
                                  <div className="text-xs text-white/60 line-clamp-2">
                                    {period.visualizations && period.visualizations.length > 0 
                                      ? period.visualizations[0].summary || 'Analysis period with multiple data points'
                                      : 'Analysis period ready for visualization'
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Add More Periods Button */}
                            <button 
                              onClick={() => setActiveTab('locations')}
                              className="w-full py-2 px-4 border-2 border-dashed border-white/30 rounded-lg text-white/60 hover:border-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add More Analysis Periods
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Report Options */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-white">Report Options</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded border-white/30 text-blue-600 focus:ring-blue-500 bg-white/10" defaultChecked />
                            <span className="ml-2 text-sm text-white">Include executive summary</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded border-white/30 text-blue-600 focus:ring-blue-500 bg-white/10" defaultChecked />
                            <span className="ml-2 text-sm text-white">Include detailed charts and graphs</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded border-white/30 text-blue-600 focus:ring-blue-500 bg-white/10" defaultChecked />
                            <span className="ml-2 text-sm text-white">Include recommendations and insights</span>
                          </label>
                        </div>
                      </div>

                      {/* Generate Button */}
                      <button 
                        disabled={periods.length === 0}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                          periods.length === 0
                            ? 'bg-white/20 text-white/50 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Generate PDF Report
                        </div>
                      </button>
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>

          {/* Main Dashboard Content - Single Column */}
          <div className="space-y-6">
            {/* Main Content Area */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 overflow-hidden">
              <HorizontalFixedColumnLayout
                periods={periods}
                locations={locations}
                periodQueries={periodQueries}
                onAddPeriod={handleAddPeriod}
                onRemovePeriod={handleRemovePeriod}
                onUpdatePeriod={handleUpdatePeriod}
              />
            </div>

            {/* Mobile Controls */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 overflow-hidden">
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

            {/* Cost Management */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 overflow-hidden">
              <CostManagementEnhanced
                locationId={null}
                period=""
              />
            </div>

            {/* AI Summary Generator */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 overflow-hidden">
              <AISummaryGenerator
                periods={periods}
                periodData={{}}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
