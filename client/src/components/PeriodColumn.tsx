import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "./charts/PieChart";
import { ColumnChart } from "./charts/ColumnChart";
import { SplineChart } from "./charts/SplineChart";
import { StackedColumnChart } from "./charts/StackedColumnChart";
import { DollarSign, CreditCard, CalendarX, TrendingUp, TrendingDown } from "lucide-react";

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
  title: string;
  dateRange: string;
  data: PeriodData;
  comparison?: {
    avgNetProduction: number;
    avgAcquisitionCost: number;
    noShowRate: number;
  };
  isLoading?: boolean;
}

export function PeriodColumn({ title, dateRange, data, comparison, isLoading }: PeriodColumnProps) {
  // Provide default values if data is undefined
  const defaultData = {
    avgNetProduction: 0,
    avgAcquisitionCost: 0,
    noShowRate: 0,
    referralSources: { digital: 0, professional: 0, direct: 0 },
    conversionRates: { digital: 0, professional: 0, direct: 0 },
    trends: { weekly: [] }
  };
  
  const safeData = data || defaultData;
  
  const pieData = [
    { x: 'Digital', y: safeData.referralSources?.digital || 0, text: `${safeData.referralSources?.digital || 0}%` },
    { x: 'Professional', y: safeData.referralSources?.professional || 0, text: `${safeData.referralSources?.professional || 0}%` },
    { x: 'Direct', y: safeData.referralSources?.direct || 0, text: `${safeData.referralSources?.direct || 0}%` }
  ];

  const conversionData = [
    {
      x: 'Conversion Rates',
      digital: safeData.conversionRates?.digital || 0,
      professional: safeData.conversionRates?.professional || 0,
      direct: safeData.conversionRates?.direct || 0
    }
  ];

  const generateStory = () => {
    const leadingSource = safeData.referralSources.digital >= safeData.referralSources.professional && safeData.referralSources.digital >= safeData.referralSources.direct
      ? 'digital'
      : safeData.referralSources.professional >= safeData.referralSources.direct
      ? 'professional'
      : 'direct';

    const bestConversion = safeData.conversionRates.digital >= safeData.conversionRates.professional && safeData.conversionRates.digital >= safeData.conversionRates.direct
      ? 'digital'
      : safeData.conversionRates.professional >= safeData.conversionRates.direct
      ? 'professional'
      : 'direct';

    return `${title} showed ${leadingSource} referrals leading at ${safeData.referralSources[leadingSource as keyof typeof safeData.referralSources]}% of total volume, generating $${(safeData.avgNetProduction * safeData.referralSources[leadingSource as keyof typeof safeData.referralSources] / 100).toFixed(0)}K in net production. ${bestConversion} referrals maintained the highest conversion at ${safeData.conversionRates[bestConversion as keyof typeof safeData.conversionRates]}%, while the overall no-show rate was ${safeData.noShowRate}%. Average acquisition cost was $${safeData.avgAcquisitionCost} per new patient.`;
  };

  const getComparisonIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getComparisonText = (current: number, previous: number, isPercentage = false, inverse = false) => {
    if (!comparison) return null;
    
    const diff = current - previous;
    const percentDiff = previous !== 0 ? (diff / previous) * 100 : 0;
    const isPositive = inverse ? diff < 0 : diff > 0;
    
    if (Math.abs(percentDiff) < 0.1) return null;
    
    return (
      <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{isPercentage ? diff.toFixed(1) + 'pp' : percentDiff.toFixed(1) + '%'} vs previous
      </p>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
            <span className="text-sm text-gray-500">{dateRange}</span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Story Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-800 mb-2">Performance Summary</h4>
            <p className="text-sm text-gray-700">{generateStory()}</p>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="text-green-600 text-lg mr-3" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Avg Net Production</p>
                    <p className="text-xl font-semibold text-gray-900">${safeData.avgNetProduction.toLocaleString()}</p>
                    {comparison && getComparisonText(safeData.avgNetProduction, comparison.avgNetProduction)}
                  </div>
                  {comparison && getComparisonIcon(safeData.avgNetProduction, comparison.avgNetProduction)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CreditCard className="text-orange-600 text-lg mr-3" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Avg Acquisition Cost</p>
                    <p className="text-xl font-semibold text-gray-900">${safeData.avgAcquisitionCost}</p>
                    {comparison && getComparisonText(safeData.avgAcquisitionCost, comparison.avgAcquisitionCost, false, true)}
                  </div>
                  {comparison && getComparisonIcon(comparison.avgAcquisitionCost, safeData.avgAcquisitionCost)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CalendarX className="text-red-600 text-lg mr-3" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">No-Show Rate</p>
                    <p className="text-xl font-semibold text-gray-900">{safeData.noShowRate}%</p>
                    {comparison && getComparisonText(safeData.noShowRate, comparison.noShowRate, true, true)}
                  </div>
                  {comparison && getComparisonIcon(comparison.noShowRate, safeData.noShowRate)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Referral Sources Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart data={pieData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">TC Conversion Rates by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <ColumnChart data={conversionData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Referral Source Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <SplineChart data={safeData.trends.weekly} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Referral Source Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <StackedColumnChart data={safeData.trends.weekly} />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
