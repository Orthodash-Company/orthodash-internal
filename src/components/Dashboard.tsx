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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <HorizontalFixedColumnLayout
              periods={periods}
              locations={locations}
              periodQueries={periodQueries}
              onAddPeriod={handleAddPeriod}
              onRemovePeriod={handleRemovePeriod}
              onUpdatePeriod={handleUpdatePeriod}
            />
          </div>
          <div className="space-y-6">
            <MobileFriendlyControls
              periods={periods}
              locations={locations}
              onAddPeriod={handleAddPeriod}
              onClearData={() => setPeriods([])}
              onExport={() => {}}
              onShare={() => ({})}
              onGreyfinchDataSelected={() => {}}
            />
            <CostManagementEnhanced
              locationId={null}
              period=""
            />
            <AISummaryGenerator
              periods={periods}
              periodData={{}}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
