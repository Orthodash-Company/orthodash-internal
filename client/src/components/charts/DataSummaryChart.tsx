import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target } from "lucide-react";

interface DataSummaryChartProps {
  periodData: any;
  periodTitle: string;
}

export function DataSummaryChart({ periodData, periodTitle }: DataSummaryChartProps) {
  if (!periodData) {
    return (
      <Card className="h-64">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 mb-2">📊</div>
            <p className="text-sm text-gray-500">No data available for summary</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    avgNetProduction = 0,
    avgAcquisitionCost = 0,
    noShowRate = 0,
    referralSources = { digital: 0, professional: 0, direct: 0 },
    conversionRates = { digital: 0, professional: 0, direct: 0 }
  } = periodData;

  const totalReferrals = referralSources.digital + referralSources.professional + referralSources.direct;
  const topReferralSource = Object.entries(referralSources).reduce((a, b) => 
    referralSources[a[0]] > referralSources[b[0]] ? a : b
  )[0];

  const avgConversionRate = (conversionRates.digital + conversionRates.professional + conversionRates.direct) / 3;
  const roi = avgNetProduction > 0 && avgAcquisitionCost > 0 ? 
    ((avgNetProduction - avgAcquisitionCost) / avgAcquisitionCost * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-600" />
          {periodTitle} Summary
        </CardTitle>
        <CardDescription>Key performance metrics overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Net Production</span>
            </div>
            <div className="text-lg font-semibold text-green-800">
              ${avgNetProduction.toLocaleString()}
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Acquisition Cost</span>
            </div>
            <div className="text-lg font-semibold text-blue-800">
              ${avgAcquisitionCost.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium">ROI</span>
            <div className="flex items-center gap-1">
              {roi > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-semibold ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium">Avg Conversion Rate</span>
            <span className="font-semibold text-blue-600">
              {avgConversionRate.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium">No-Show Rate</span>
            <span className={`font-semibold ${noShowRate > 20 ? 'text-red-600' : 'text-yellow-600'}`}>
              {noShowRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Top Referral Source */}
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Top Referral Source</div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="capitalize">
              {topReferralSource}
            </Badge>
            <span className="text-sm font-semibold">
              {referralSources[topReferralSource]}% of referrals
            </span>
          </div>
        </div>

        {/* Data Status */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Live data from Greyfinch API
          </div>
        </div>
      </CardContent>
    </Card>
  );
}