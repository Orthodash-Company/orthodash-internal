import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SimpleHeader } from "@/components/SimpleHeader";
import { HorizontalFixedColumnLayout } from "@/components/HorizontalFixedColumnLayout";
import { MobileFriendlyControls } from "@/components/MobileFriendlyControls";
import { CostManagementEnhanced } from "@/components/CostManagementEnhanced";
import { AISummaryGenerator } from "@/components/AISummaryGenerator";
import { format } from "date-fns";
import { PeriodConfig, Location } from "@shared/types";

export default function Dashboard() {
  // State for managing multiple periods with persistence
  const [periods, setPeriods] = useState<PeriodConfig[]>(() => {
    // Try to load from localStorage on initialization
    try {
      const saved = localStorage.getItem('orthodash-periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        return parsed.map((p: any) => ({
          ...p,
          startDate: p.startDate ? new Date(p.startDate) : undefined,
          endDate: p.endDate ? new Date(p.endDate) : undefined
        }));
      }
    } catch (error) {
      console.error('Error loading saved periods:', error);
    }
    
    // Default to empty state if no saved data
    return [
      {
        id: 'period-1',
        name: 'Period A',
        title: 'Period A',
        locationId: 'all',
        startDate: undefined,
        endDate: undefined
      }
    ];
  });

  // Save periods to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('orthodash-periods', JSON.stringify(periods));
    } catch (error) {
      console.error('Error saving periods:', error);
    }
  }, [periods]);

  // Query for locations
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  // Create queries for all periods dynamically - only if dates are selected
  const periodQueries = periods.map((period) => {
    const locationParam = period.locationId === 'all' ? '' : `&locationId=${period.locationId}`;
    
    return useQuery({
      queryKey: ['/api/analytics', period.id, period.locationId, 
        period.startDate ? format(period.startDate, 'yyyy-MM-dd') : 'no-start', 
        period.endDate ? format(period.endDate, 'yyyy-MM-dd') : 'no-end'
      ],
      queryFn: async () => {
        if (!period.startDate || !period.endDate) {
          console.log(`Period ${period.id} missing dates:`, { startDate: period.startDate, endDate: period.endDate });
          return null; // Return null for empty state
        }
        
        const startDateStr = format(period.startDate, 'yyyy-MM-dd');
        const endDateStr = format(period.endDate, 'yyyy-MM-dd');
        const url = `/api/analytics?startDate=${startDateStr}&endDate=${endDateStr}${locationParam}`;
        
        console.log(`Fetching analytics for period ${period.id}:`, url);
        
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Analytics fetch failed for ${period.id}:`, response.status, errorText);
          throw new Error(`Failed to fetch analytics: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Analytics data received for ${period.id}:`, data);
        return data;
      },
      enabled: !!(period.startDate && period.endDate), // Only enabled when dates are set
      retry: 2,
      refetchOnMount: true,
      refetchOnWindowFocus: false
    });
  });

  // Handle adding a new period column with modal data
  const handleAddPeriod = (periodData: Omit<PeriodConfig, 'id'>) => {
    if (periods.length >= 10) {
      console.error('Maximum 10 periods allowed');
      return;
    }
    
    try {
      // Ensure dates are proper Date objects
      let startDate = periodData.startDate;
      let endDate = periodData.endDate;
      
      if (startDate && !(startDate instanceof Date)) {
        startDate = new Date(startDate);
      }
      if (endDate && !(endDate instanceof Date)) {
        endDate = new Date(endDate);
      }
      
      const newPeriod: PeriodConfig = {
        ...periodData,
        id: `period-${Date.now()}`,
        startDate,
        endDate,
      };
      
      console.log('Adding new period:', newPeriod);
      console.log('Start date type:', typeof newPeriod.startDate, newPeriod.startDate);
      console.log('End date type:', typeof newPeriod.endDate, newPeriod.endDate);
      
      setPeriods(prev => [...prev, newPeriod]);
    } catch (error) {
      console.error('Error adding period:', error);
    }
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

  const handleClearData = () => {
    // Reset to initial empty state with Period A
    const initialPeriod: PeriodConfig = {
      id: 'period-1',
      name: 'Period A',
      title: 'Period A',
      locationId: 'all',
      startDate: undefined,
      endDate: undefined
    };
    
    setPeriods([initialPeriod]);
    
    // Clear localStorage cache
    localStorage.removeItem('orthodash-periods');
    localStorage.removeItem('orthodash-dashboard-state');
    
    return Promise.resolve();
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
    const reportData = {
      periods,
      periodData: Object.fromEntries(
        periodQueries.map((query, index) => [
          periods[index].id,
          query.data || {}
        ]).filter(([_, data]) => Object.keys(data as any).length > 0)
      ),
      locations,
      timestamp: new Date().toISOString(),
      title: `ORTHODASH Analytics Report - ${new Date().toLocaleDateString()}`,
      summary: {
        totalPeriods: periods.length,
        hasData: periodQueries.some(q => q.data && Object.keys(q.data).length > 0),
        dateRange: periods.length > 0 ? 
          `${periods[0].startDate || 'No start'} - ${periods[0].endDate || 'No end'}` : 'No periods'
      }
    };
    
    return reportData;
  };

  const handleGreyfinchDataSelected = (selection: any) => {
    console.log('Greyfinch data selection:', selection);
    // TODO: Implement data filtering based on selection
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <SimpleHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Mobile-Friendly Controls */}
        <MobileFriendlyControls
          periods={periods}
          locations={locations}
          onAddPeriod={handleAddPeriod}
          onClearData={handleClearData}
          onExport={handleExport}
          onShare={handleShare}
          onGreyfinchDataSelected={handleGreyfinchDataSelected}
        />

        {/* Horizontal Period Layout */}
        <HorizontalFixedColumnLayout
          periods={periods}
          locations={locations}
          periodQueries={periodQueries}
          onAddPeriod={handleAddPeriod}
          onRemovePeriod={handleRemovePeriod}
          onUpdatePeriod={handleUpdatePeriod}
        />

        {/* AI Summary Generator */}
        <div className="mt-8">
          <AISummaryGenerator 
            periods={periods}
            periodData={Object.fromEntries(
              periodQueries.map((query, index) => [
                periods[index].id,
                query.data || {}
              ]).filter(([_, data]) => Object.keys(data).length > 0)
            )}
          />
        </div>

        {/* Cost Management Section - Desktop Only */}
        <div className="hidden lg:block mt-8">
          <CostManagementEnhanced 
            locationId={null}
            period="2024-Q1"
          />
        </div>
      </main>
    </div>
  );
}