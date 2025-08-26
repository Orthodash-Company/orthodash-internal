'use client'

import { useState, useEffect } from "react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { HorizontalFixedColumnLayout } from "@/components/HorizontalFixedColumnLayout";
import { MobileFriendlyControls } from "@/components/MobileFriendlyControls";
import { CostManagementEnhanced } from "@/components/CostManagementEnhanced";
import { AISummaryGenerator } from "@/components/AISummaryGenerator";
import { format } from "date-fns";
import { PeriodConfig, Location } from "@/shared/types";

export default function Dashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<PeriodConfig[]>([]);
  const [periodQueries, setPeriodQueries] = useState<any[]>([]);

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
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="backdrop-blur-xl bg-white/60 rounded-2xl p-6 shadow-xl border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Orthodash Analytics
              </h2>
              <p className="text-gray-600">
                Comprehensive analytics dashboard for orthodontic practices
              </p>
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
