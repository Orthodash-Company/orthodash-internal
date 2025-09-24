import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactDateInput } from "@/components/ui/compact-date-input";
import { MultiLocationSelector } from "@/components/ui/multi-location-selector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  MapPin, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Target,
  Edit2,
  Trash2,
  Plus,
  Download,
  Share2,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { PeriodConfig, Location, CompactCost } from "@/shared/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { MultiLocationComparisonChart } from './MultiLocationComparisonChart';
import { ChartSelectorModal } from './ui/chart-selector-modal';

interface PeriodData {
  avgNetProduction: number;
  avgAcquisitionCost: number;
  noShowRate: number;
  referralSources: {
    digital: number;
    professional: number;
    direct: number;
  };
  conversionRates: {
    digital: number;
    professional: number;
    direct: number;
  };
  trends: {
    weekly: Array<{
      week: string;
      digital: number;
      professional: number;
      direct: number;
    }>;
  };
  patients: number;
  appointments: number;
  leads: number;
  locations: number;
  bookings: number;
  revenue: number;
  production: number;
  netProduction: number;
  acquisitionCosts: number;
}

interface PeriodColumnProps {
  period: PeriodConfig;
  query: any;
  locations: Location[];
  onUpdatePeriod: (periodId: string, updates: Partial<PeriodConfig>) => void;
  isCompact?: boolean;
  periodCosts?: CompactCost[];
  selectedCharts?: string[];
}

interface PeriodColumnPropsExtended extends PeriodColumnProps {
  onAddPeriod?: (period: Omit<PeriodConfig, 'id'>) => void;
  isFirstPeriod?: boolean;
}

export function PeriodColumn({ period, query, locations, onUpdatePeriod, onAddPeriod, isFirstPeriod = false, isCompact = false, periodCosts = [], selectedCharts = [] }: PeriodColumnPropsExtended) {
  const data = query?.data;
  const isLoading = query?.isLoading;
  const error = query?.error;
  const [localSelectedCharts, setLocalSelectedCharts] = useState<string[]>(selectedCharts);
  
  // Calculate total costs for this period
  const totalCosts = periodCosts.reduce((sum, cost) => sum + cost.amount, 0);
  
  // Debug logging
  console.log(`PeriodColumn ${period.id} - isLoading: ${isLoading}, hasData: ${!!data}, error: ${!!error}`);
  console.log(`Period dates: start=${period.startDate}, end=${period.endDate}`);
  console.log(`Period data:`, data);
  console.log(`Period costs:`, periodCosts, `Total: $${totalCosts}`);

  // Always render charts, even with no data - show loading indicator only during initial load
  const showLoadingIndicator = isLoading && !data;

  // Consolidated charts section renderer for both compact and full views
  const renderChartsSection = (isCompact: boolean) => {
    const sectionSpacing = isCompact ? 'space-y-4' : 'space-y-6';
    const headerSize = isCompact ? 'text-sm font-medium' : 'text-lg font-semibold';
    const buttonSize = isCompact ? 'sm' : 'sm';
    const buttonClass = isCompact ? 'h-7 px-2 text-xs gap-1' : 'gap-2';
    const iconSize = isCompact ? 'h-3 w-3' : 'h-4 w-4';
    const emptyIconSize = isCompact ? 'h-12 w-12' : 'h-16 w-16';
    const emptyPadding = isCompact ? 'py-8' : 'py-12';
    const emptyMargin = isCompact ? 'mb-3' : 'mb-4';
    const emptyTextSize = isCompact ? 'text-sm font-medium' : 'text-lg font-semibold';
    const emptyDescClass = isCompact ? 'hidden' : 'text-gray-500 mb-6';

    return (
      <div className={sectionSpacing}>
        {localSelectedCharts.length > 0 ? (
          <>
            {/* Chart Selector Header */}
            <div className="flex items-center justify-between">
              <h3 className={headerSize}>
                {isCompact ? 'Charts' : 'Analytics Charts'}
              </h3>
              <ChartSelectorModal
                selectedCharts={localSelectedCharts}
                onChartsChange={setLocalSelectedCharts}
                trigger={
                  <Button variant="outline" size={buttonSize} className={buttonClass}>
                    <Settings className={iconSize} />
                    {isCompact ? `(${localSelectedCharts.length})` : `Manage Charts (${localSelectedCharts.length})`}
                  </Button>
                }
              />
            </div>
            
            {/* Render selected charts using single renderer */}
            <div className={isCompact ? '' : 'space-y-6'}>
              {localSelectedCharts.map(chartId => renderChart(chartId))}
            </div>
          </>
        ) : (
          /* No charts selected - show chart selector */
          <div className={`text-center ${emptyPadding}`}>
            <BarChart3 className={`${emptyIconSize} mx-auto ${emptyMargin} text-gray-400`} />
            <h3 className={`${emptyTextSize} text-gray-700 mb-2`}>No Charts Selected</h3>
            {!isCompact && <p className={emptyDescClass}>Select charts to display your analytics data</p>}
            <ChartSelectorModal
              selectedCharts={localSelectedCharts}
              onChartsChange={setLocalSelectedCharts}
              trigger={
                <Button size={buttonSize} className="gap-2">
                  <BarChart3 className={iconSize} />
                  Select Charts
                </Button>
              }
            />
          </div>
        )}
      </div>
    );
  };

  // Single chart renderer that works with actual data structure
  const renderChart = (chartId: string) => {
    const chartHeight = isCompact ? 150 : 200;
    
    // Debug logging
    console.log(`🔍 Rendering chart ${chartId} with data:`, {
      referralSources: safeData.referralSources,
      conversionRates: safeData.conversionRates,
      trends: safeData.trends,
      revenue: safeData.revenue,
      patients: safeData.patients,
      noShowRate: safeData.noShowRate
    });
    
    switch (chartId) {
      case 'referral-sources':
        const referralData = [
          { name: 'Digital', value: safeData.referralSources?.digital || 0, color: '#8884d8' },
          { name: 'Professional', value: safeData.referralSources?.professional || 0, color: '#82ca9d' },
          { name: 'Direct', value: safeData.referralSources?.direct || 0, color: '#ffc658' }
        ];
        
        // Show chart even with zero data
        return (
          <div key={chartId} className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-3">Referral Sources</h4>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie
                  data={referralData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={isCompact ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {referralData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'conversion-rates':
        const conversionData = [
          { source: 'Digital', rate: safeData.conversionRates?.digital || 0 },
          { source: 'Professional', rate: safeData.conversionRates?.professional || 0 },
          { source: 'Direct', rate: safeData.conversionRates?.direct || 0 }
        ];
        return (
          <div key={chartId} className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-3">Conversion Rates</h4>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={conversionData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="source" />
                <Tooltip />
                <Bar dataKey="rate" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'weekly-trends':
        const trendsData = (safeData.trends?.weekly || []).map((week: any) => ({
          week: week.week || 'Week',
          gilbert: week.gilbert || 0,
          phoenix: week.phoenix || 0,
          total: week.total || 0
        }));
        
        // If no trends data, show placeholder
        if (trendsData.length === 0) {
          return (
            <div key={chartId} className="bg-white p-4 rounded-lg border">
              <h4 className="text-sm font-medium mb-3">Weekly Trends</h4>
              <div className="flex items-center justify-center h-48 text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No trend data available</p>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div key={chartId} className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-3">Weekly Trends</h4>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="gilbert" stroke="#8884d8" name="Gilbert" />
                <Line type="monotone" dataKey="phoenix" stroke="#82ca9d" name="Phoenix" />
                <Line type="monotone" dataKey="total" stroke="#ffc658" name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'financial-summary':
        const financialData = [
          { metric: 'Revenue', value: safeData.revenue || 0 },
          { metric: 'Production', value: safeData.production || 0 },
          { metric: 'Net Production', value: safeData.netProduction || 0 },
          { metric: 'Acquisition Costs', value: safeData.acquisitionCosts || 0 }
        ];
        return (
          <div key={chartId} className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-3">Financial Summary</h4>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={financialData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="metric" />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'patient-metrics':
        const patientData = [
          { metric: 'Patients', value: safeData.patients || 0 },
          { metric: 'Appointments', value: safeData.appointments || 0 },
          { metric: 'Leads', value: safeData.leads || 0 },
          { metric: 'Bookings', value: safeData.bookings || 0 }
        ];
        return (
          <div key={chartId} className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-3">Patient Metrics</h4>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={patientData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="metric" />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'no-show-analysis':
        const noShowRate = safeData.noShowRate || 0;
        const totalAppointments = safeData.appointments || 0;
        
        return (
          <div key={chartId} className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-3">No-Show Analysis</h4>
            <div className="flex items-center justify-center h-48 text-gray-500">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No-Show Rate</p>
                <p className="text-2xl font-bold text-red-500">{noShowRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-400 mt-2">
                  {totalAppointments} total appointments
                </p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Ensure we have valid data from API - only use live data, no fallbacks
  const safeData: PeriodData = data || {
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
    production: 0,
    netProduction: 0,
    acquisitionCosts: 0
  };

  // Calculate actual net production using real revenue and user-added acquisition costs
  const actualRevenue = safeData.revenue || 0;
  const actualProduction = safeData.production || 0;
  const actualNetProduction = actualRevenue - totalCosts;

  // Check if multiple locations are selected
  const selectedLocationIds = period.locationIds || (period.locationId && period.locationId !== 'all' ? [period.locationId] : []);
  const hasMultipleLocations = selectedLocationIds.length > 1;

  // Check for empty state (no dates selected)
  if (!period.startDate || !period.endDate) {
    return (
      <Card className="w-full min-w-[350px] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{period.title}</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                console.log('Period edit clicked for:', period.id);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Date Range
            </Label>
            <div className="grid grid-cols-1 gap-2">
              <CompactDateInput
                date={period.startDate}
                setDate={(date) => {
                  console.log('Start date changed:', date);
                  onUpdatePeriod(period.id, { startDate: date });
                }}
                label="Start Date"
              />
              <CompactDateInput
                date={period.endDate}
                setDate={(date) => {
                  console.log('End date changed:', date);
                  onUpdatePeriod(period.id, { endDate: date });
                }}
                label="End Date"
              />
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </Label>
            <MultiLocationSelector
              locations={locations.map(loc => ({
                id: loc.id.toString(),
                name: loc.name,
                isActive: loc.isActive
              }))}
              selectedLocationIds={period.locationIds || [period.locationId || 'all'].filter(id => id !== 'all')}
              onSelectionChange={(locationIds) => {
                const primaryLocationId = locationIds.length === 1 ? locationIds[0] : 
                                        locationIds.length === 0 ? 'all' : 
                                        locationIds.length === locations.length ? 'all' : locationIds[0];
                onUpdatePeriod(period.id, { 
                  locationIds,
                  locationId: primaryLocationId // Keep for backward compatibility
                });
              }}
              placeholder="Select locations"
            />
          </div>

          {/* Empty State Message - Enhanced for Period A */}
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-4">Select a date range to view analytics data</p>
            
            {/* Add Period CTA for Period A only when it's the first period */}
            {isFirstPeriod && onAddPeriod && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-400 mb-3">Need to compare multiple periods?</p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Use the "Add Column" button at the top to add comparison periods</p>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      <Plus className="h-3 w-3" />
                      <span>Look for the + button above</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isCompact) {
    return (
      <div className="space-y-4 relative">
        {/* Loading overlay for compact view */}
        {showLoadingIndicator && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {/* Error indicator for compact view */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="text-red-500 text-sm">⚠️</div>
              <p className="text-xs text-red-700">Data error</p>
            </div>
          </div>
        )}

        {/* Key Metrics - Compact View with Production Data */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Net Production</p>
                <p className="text-lg font-semibold">${actualNetProduction.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-[#1d1d52]" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">No-Show Rate</p>
                <p className="text-lg font-semibold">{safeData.noShowRate.toFixed(1)}%</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Production and Revenue Summary */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium mb-3">Financial Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Production:</span>
              <span className="font-medium">${actualProduction.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Revenue:</span>
              <span className="font-medium">${actualRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Acquisition Costs:</span>
              <span className="font-medium text-red-600">-${totalCosts.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Net Production:</span>
              <span className={`${actualNetProduction >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${actualNetProduction.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Location Comparison Chart */}
        {hasMultipleLocations && (
          <MultiLocationComparisonChart
            locationData={[]} // This will be populated with actual location data
            selectedLocationIds={selectedLocationIds}
            periodTitle={period.title}
          />
        )}

        {/* Charts - Compact */}
        {renderChartsSection(true)}
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{period.title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              const newTitle = prompt('Enter new period name:', period.title);
              if (newTitle && newTitle.trim()) {
                onUpdatePeriod(period.id, { title: newTitle.trim() });
              }
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Period Configuration */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Location</Label>
              <Select
                value={period.locationId}
                onValueChange={(value) => onUpdatePeriod(period.id, { locationId: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <CompactDateInput
                  date={period.startDate}
                  setDate={(date) => onUpdatePeriod(period.id, { startDate: date })}
                  label="Start Date"
                />
              </div>
              <div>
                <CompactDateInput
                  date={period.endDate}
                  setDate={(date) => onUpdatePeriod(period.id, { endDate: date })}
                  label="End Date"
                />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative">
        {/* Loading overlay - only show during initial load when no data exists */}
        {showLoadingIndicator && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          </div>
        )}

        {/* Error indicator - show as badge if there's an error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="text-red-500">⚠️</div>
              <div>
                <p className="text-sm text-red-700">Data loading error</p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid - Always show, even with zero values */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Avg Net Production</p>
                <p className="text-xl font-bold">${safeData.avgNetProduction.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-[#1d1d52]" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Acquisition Cost</p>
                <p className="text-xl font-bold">${safeData.avgAcquisitionCost}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">No-Show Rate</p>
                <p className="text-xl font-bold">{safeData.noShowRate}%</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>


        {/* Charts - Full View */}
        {renderChartsSection(false)}
      </CardContent>
    </Card>
  );
}