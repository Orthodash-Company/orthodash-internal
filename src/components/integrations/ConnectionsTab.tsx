'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, TrendingUp, BarChart3, Settings, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QuickBooksSetup from './QuickBooksSetup';

interface QuickBooksRevenueData {
  revenueMetrics?: {
    totalRevenue?: number;
    averageRevenuePerTransaction?: number;
  };
  revenueData?: unknown[];
  locationRevenue?: unknown[];
  lastUpdated: string;
}

export function ConnectionsTab() {
  const { toast } = useToast();
  const [showQuickBooksSetup, setShowQuickBooksSetup] = useState(false);
  const [quickBooksRevenueData, setQuickBooksRevenueData] = useState<QuickBooksRevenueData | null>(null);

  const handleRefreshQuickBooks = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await fetch(`/api/quickbooks/revenue?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (data.success) {
        setQuickBooksRevenueData(data.data);
        toast({ title: 'Revenue data refreshed' });
      }
    } catch {
      toast({ title: 'Failed to refresh revenue data', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta Ads */}
        <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-[#1C1F4F] flex items-center">
              <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              Meta Ads
            </CardTitle>
            <CardDescription className="text-[#1C1F4F]/70">
              Connect your Facebook and Instagram advertising accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white">
              Connect Meta Ads
            </Button>
          </CardContent>
        </Card>

        {/* Google Ads */}
        <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-[#1C1F4F] flex items-center">
              <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Google Ads
            </CardTitle>
            <CardDescription className="text-[#1C1F4F]/70">
              Connect your Google Ads account for campaign data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white">
              Connect Google Ads
            </Button>
          </CardContent>
        </Card>

        {/* QuickBooks */}
        <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-[#1C1F4F] flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                QuickBooks Desktop
              </div>
              <Badge
                variant={quickBooksRevenueData ? 'default' : 'secondary'}
                className={quickBooksRevenueData ? 'bg-green-600' : 'bg-gray-400'}
              >
                {quickBooksRevenueData ? 'Connected' : 'Not Connected'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-[#1C1F4F]/70">
              Connect QuickBooks Desktop API for real revenue data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickBooksRevenueData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold text-green-600">
                      ${quickBooksRevenueData.revenueMetrics?.totalRevenue?.toLocaleString() ?? '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-semibold text-blue-600">
                      {quickBooksRevenueData.revenueData?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Locations:</span>
                    <span className="font-semibold text-purple-600">
                      {quickBooksRevenueData.locationRevenue?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg/Transaction:</span>
                    <span className="font-semibold text-orange-600">
                      ${quickBooksRevenueData.revenueMetrics?.averageRevenuePerTransaction?.toLocaleString() ?? '0'}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last updated: {new Date(quickBooksRevenueData.lastUpdated).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Live Data</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowQuickBooksSetup(true)}>
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRefreshQuickBooks}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-4 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No QuickBooks connection</p>
                  <p className="text-xs">Revenue data showing as $0</p>
                </div>
                <div className="space-y-2">
                  <Button
                    className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white"
                    onClick={() => setShowQuickBooksSetup(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Setup QuickBooks API
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    <p>• Connect to QuickBooks Desktop</p>
                    <p>• Pull real revenue data</p>
                    <p>• Replace $0 fallback values</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom API */}
        <Card className="bg-white border-[#1C1F4F]/20 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-[#1C1F4F] flex items-center">
              <div className="w-8 h-8 bg-[#1C1F4F] rounded-lg flex items-center justify-center mr-3">
                <Settings className="h-4 w-4 text-white" />
              </div>
              Custom API
            </CardTitle>
            <CardDescription className="text-[#1C1F4F]/70">
              Connect custom APIs for additional data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white">
              Connect Custom API
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-[#1C1F4F]/20" />

      {/* QuickBooks Setup Modal */}
      {showQuickBooksSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">QuickBooks Desktop API Setup</h2>
                <Button variant="outline" size="sm" onClick={() => setShowQuickBooksSetup(false)}>
                  ×
                </Button>
              </div>
              <QuickBooksSetup
                onSetupComplete={() => {
                  setShowQuickBooksSetup(false);
                  toast({ title: 'QuickBooks integration configured successfully' });
                }}
                onRevenueDataLoaded={(data) => {
                  setQuickBooksRevenueData(data as QuickBooksRevenueData);
                  toast({ title: 'Revenue data loaded from QuickBooks' });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
