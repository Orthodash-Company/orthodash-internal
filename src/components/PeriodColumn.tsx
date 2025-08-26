import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Label } from "@/components/ui/label";
import { PieChart } from "./charts/PieChart";
import { ColumnChart } from "./charts/ColumnChart";
import { SplineChart } from "./charts/SplineChart";
import { StackedColumnChart } from "./charts/StackedColumnChart";
import { DataSummaryChart } from "./charts/DataSummaryChart";
import { 
  DollarSign, 
  CreditCard, 
  CalendarX, 
  TrendingUp, 
  TrendingDown, 
  Edit3,
  Calendar,
  MapPin,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { PeriodConfig, Location } from "@/shared/types";

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
}

interface PeriodColumnProps {
  period: PeriodConfig;
  query: any;
  locations: Location[];
  onUpdatePeriod: (periodId: string, updates: Partial<PeriodConfig>) => void;
  isCompact?: boolean;
}

interface PeriodColumnPropsExtended extends PeriodColumnProps {
  onAddPeriod?: (period: Omit<PeriodConfig, 'id'>) => void;
  isFirstPeriod?: boolean;
}

export function PeriodColumn({ period, query, locations, onUpdatePeriod, onAddPeriod, isFirstPeriod = false, isCompact = false }: PeriodColumnPropsExtended) {
  const data = query?.data;
  const isLoading = query?.isLoading;
  const error = query?.error;
  
  // Debug logging
  console.log(`PeriodColumn ${period.id} - isLoading: ${isLoading}, hasData: ${!!data}, error: ${!!error}`);
  console.log(`Period dates: start=${period.startDate}, end=${period.endDate}`);

  // Handle loading and error states for live data
  if (isLoading) {
    return (
      <Card className={isCompact ? "h-auto" : "h-[500px]"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{period.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading live data from Greyfinch API...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={isCompact ? "h-auto" : "h-[500px]"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-red-600">{period.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <p className="text-red-600 font-medium">Failed to load data</p>
              <p className="text-gray-600 text-sm mt-2">{error.message}</p>
              <p className="text-xs text-gray-500 mt-2">Check your Greyfinch API connection</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have valid data from API - only use live data, no fallbacks
  const safeData: PeriodData = data || {
    avgNetProduction: 0,
    avgAcquisitionCost: 0,
    noShowRate: 0,
    referralSources: { digital: 0, professional: 0, direct: 0 },
    conversionRates: { digital: 0, professional: 0, direct: 0 },
    trends: { weekly: [] }
  };
  
  const pieData = [
    { x: 'Digital', y: safeData.referralSources.digital, text: `${safeData.referralSources.digital}%` },
    { x: 'Professional', y: safeData.referralSources.professional, text: `${safeData.referralSources.professional}%` },
    { x: 'Direct', y: safeData.referralSources.direct, text: `${safeData.referralSources.direct}%` }
  ];

  const conversionData = [
    { x: 'Digital', digital: safeData.conversionRates.digital, professional: 0, direct: 0 },
    { x: 'Professional', digital: 0, professional: safeData.conversionRates.professional, direct: 0 },
    { x: 'Direct', digital: 0, professional: 0, direct: safeData.conversionRates.direct }
  ];

  const trendsData = safeData.trends.weekly.map(week => ({
    x: week.week,
    digital: week.digital,
    professional: week.professional,
    direct: week.direct
  }));

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
              <Edit3 className="h-4 w-4" />
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
              <EnhancedDatePicker
                date={period.startDate}
                setDate={(date) => {
                  console.log('Start date changed:', date);
                  onUpdatePeriod(period.id, { startDate: date });
                }}
                placeholder="Start date"
              />
              <EnhancedDatePicker
                date={period.endDate}
                setDate={(date) => {
                  console.log('End date changed:', date);
                  onUpdatePeriod(period.id, { endDate: date });
                }}
                placeholder="End date"
              />
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Select
              value={period.locationId}
              onValueChange={(value) => onUpdatePeriod(period.id, { locationId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
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
      <div className="space-y-4">
        {/* Key Metrics - Compact View */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Net Production</p>
                <p className="text-lg font-semibold">${safeData.avgNetProduction.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-[#1d1d52]" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">No-Show Rate</p>
                <p className="text-lg font-semibold">{safeData.noShowRate}%</p>
              </div>
              <CalendarX className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Charts - Compact */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-2">Referral Sources</h4>
            <PieChart data={pieData} />
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-2">Conversion Rates</h4>
            <ColumnChart data={conversionData} />
          </div>
        </div>
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
            <Edit3 className="h-4 w-4" />
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
                <Label className="text-xs text-gray-600">Start Date</Label>
                <EnhancedDatePicker
                  date={period.startDate}
                  onDateChange={(date) => onUpdatePeriod(period.id, { startDate: date })}
                  className="h-8"
                  placeholder="Select start"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">End Date</Label>
                <EnhancedDatePicker
                  date={period.endDate}
                  onDateChange={(date) => onUpdatePeriod(period.id, { endDate: date })}
                  className="h-8"
                  placeholder="Select end"
                />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
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
                  <CreditCard className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">No-Show Rate</p>
                    <p className="text-xl font-bold">{safeData.noShowRate}%</p>
                  </div>
                  <CalendarX className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Data Summary Chart */}
            <DataSummaryChart 
              periodData={safeData}
              periodTitle={period.title}
            />

            {/* Charts */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Referral Sources</h4>
                <PieChart data={pieData} />
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Conversion Rates</h4>
                <ColumnChart data={conversionData} />
              </div>
              
              {safeData.trends.weekly.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Weekly Trends</h4>
                  <SplineChart data={trendsData} />
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}