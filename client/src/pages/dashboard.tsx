import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { HorizontalPeriodLayout } from "@/components/HorizontalPeriodLayout";
import { MobileFriendlyControls } from "@/components/MobileFriendlyControls";
import { CostManagement } from "@/components/CostManagement";
import { format } from "date-fns";

interface PeriodConfig {
  id: string;
  title: string;
  locationId: string;
  startDate: Date;
  endDate: Date;
}

interface Location {
  id: number;
  name: string;
  greyfinchId?: string;
}

export default function Dashboard() {
  // State for managing multiple periods
  const [periods, setPeriods] = useState<PeriodConfig[]>([
    {
      id: 'period-1',
      title: 'Period A',
      locationId: 'all',
      startDate: new Date(2024, 0, 1), // Jan 1, 2024
      endDate: new Date(2024, 2, 31)  // Mar 31, 2024
    },
    {
      id: 'period-2', 
      title: 'Period B',
      locationId: 'all',
      startDate: new Date(2024, 3, 1), // Apr 1, 2024
      endDate: new Date(2024, 5, 30)  // Jun 30, 2024
    }
  ]);

  // Query for locations
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  // Create queries for all periods dynamically
  const periodQueries = periods.map((period) => {
    const locationParam = period.locationId === 'all' ? '' : `&locationId=${period.locationId}`;
    
    return useQuery({
      queryKey: ['/api/analytics', period.id, period.locationId, format(period.startDate, 'yyyy-MM-dd'), format(period.endDate, 'yyyy-MM-dd')],
      queryFn: async () => {
        const response = await fetch(`/api/analytics?startDate=${format(period.startDate, 'yyyy-MM-dd')}&endDate=${format(period.endDate, 'yyyy-MM-dd')}${locationParam}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        return response.json();
      },
    });
  });

  // Handle adding a new period column
  const handleAddPeriod = () => {
    const newPeriod: PeriodConfig = {
      id: `period-${Date.now()}`,
      title: `Period ${String.fromCharCode(65 + periods.length)}`, // A, B, C, etc.
      locationId: 'all',
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 2, 31)
    };
    setPeriods(prev => [...prev, newPeriod]);
  };

  // Handle removing a period column
  const handleRemovePeriod = (periodId: string) => {
    if (periods.length > 1) { // Keep at least one period
      setPeriods(prev => prev.filter(p => p.id !== periodId));
    }
  };

  // Handle updating a period configuration
  const handleUpdatePeriod = (periodId: string, updates: Partial<PeriodConfig>) => {
    setPeriods(prev => prev.map(p => 
      p.id === periodId ? { ...p, ...updates } : p
    ));
  };

  const handleUpdateAnalysis = () => {
    periodQueries.forEach(query => query.refetch());
  };

  const handleExport = () => {
    const reportData = {
      periods,
      periodQueries: periodQueries.map(q => q.data),
      locations,
      timestamp: new Date()
    };
    
    // This will be handled by PDFExporter component in MobileFriendlyControls
    return reportData;
  };

  const handleShare = () => {
    console.log('Share functionality to be implemented');
  };

  const handleGreyfinchDataSelected = (selection: any) => {
    console.log('Greyfinch data selection:', selection);
    // TODO: Implement data filtering based on selection
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-8">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Mobile-Friendly Controls */}
        <MobileFriendlyControls
          periods={periods}
          locations={locations}
          onAddPeriod={handleAddPeriod}
          onUpdateAnalysis={handleUpdateAnalysis}
          onExport={handleExport}
          onShare={handleShare}
          onGreyfinchDataSelected={handleGreyfinchDataSelected}
        />

        {/* Horizontal Period Layout */}
        <HorizontalPeriodLayout
          periods={periods}
          locations={locations}
          periodQueries={periodQueries}
          onAddPeriod={handleAddPeriod}
          onRemovePeriod={handleRemovePeriod}
          onUpdatePeriod={handleUpdatePeriod}
        />

        {/* Cost Management Section - Desktop Only */}
        <div className="hidden lg:block mt-8">
          <CostManagement 
            locationId={null}
            period="2024-Q1"
          />
        </div>
      </main>
    </div>
  );
}