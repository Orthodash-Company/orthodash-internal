import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Settings, Key, Plus, Save, RefreshCw } from "lucide-react";
import { CostEntryForm } from "./CostEntryForm";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ApiConfiguration {
  id: string;
  name: string;
  type: 'meta' | 'google' | 'quickbooks';
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
  isActive: boolean;
}

interface CostData {
  manual_total: number;
  meta_ads?: number;
  google_ads?: number;
  other?: number;
}

interface CostManagementEnhancedProps {
  locationId: number | null;
  period: string;
}

export function CostManagementEnhanced({ locationId, period }: CostManagementEnhancedProps) {
  const [costs, setCosts] = useState<CostData>({
    manual_total: 0,
    meta_ads: 0,
    google_ads: 0,
    other: 0,
  });
  
  const [apiConfigs, setApiConfigs] = useState<ApiConfiguration[]>([]);
  const [newApiConfig, setNewApiConfig] = useState({
    name: '',
    type: 'meta' as 'meta' | 'google' | 'quickbooks',
    apiKey: '',
    apiSecret: '',
    accessToken: ''
  });
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for existing cost data
  const { data: existingCosts } = useQuery({
    queryKey: ['/api/acquisition-costs', locationId, period],
    queryFn: async () => {
      const response = await fetch(`/api/acquisition-costs?locationId=${locationId}&period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch costs');
      return response.json();
    },
  });

  // Load existing costs when data is available
  useEffect(() => {
    if (existingCosts) {
      setCosts(existingCosts);
    }
  }, [existingCosts]);

  // Save costs mutation
  const saveCostsMutation = useMutation({
    mutationFn: async (costData: CostData) => {
      const response = await apiRequest('POST', '/api/acquisition-costs', {
        locationId,
        period,
        costs: costData
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Costs Saved",
        description: "Acquisition costs have been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/acquisition-costs'] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save costs",
        variant: "destructive"
      });
    },
  });

  // API Integration mutation
  const syncApiDataMutation = useMutation({
    mutationFn: async (configId: string) => {
      const response = await apiRequest('POST', '/api/sync-external-costs', {
        configId,
        locationId,
        period
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCosts(prev => ({ ...prev, ...data.costs }));
      toast({
        title: "Data Synced",
        description: "External advertising costs have been imported successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync external data",
        variant: "destructive"
      });
    },
  });

  const handleCostChange = (field: keyof CostData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setCosts(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const handleSaveCosts = () => {
    saveCostsMutation.mutate(costs);
  };

  const handleAddApiConfig = () => {
    if (!newApiConfig.name || !newApiConfig.apiKey) {
      toast({
        title: "Invalid Configuration",
        description: "Please provide at least a name and API key.",
        variant: "destructive"
      });
      return;
    }

    const config: ApiConfiguration = {
      id: Date.now().toString(),
      ...newApiConfig,
      isActive: true
    };

    setApiConfigs(prev => [...prev, config]);
    setNewApiConfig({
      name: '',
      type: 'meta',
      apiKey: '',
      apiSecret: '',
      accessToken: ''
    });
    setConfigDialogOpen(false);

    toast({
      title: "Configuration Added",
      description: `${config.name} API configuration has been added.`
    });
  };

  const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  
  // Use useCallback to prevent infinite re-renders in CostEntryForm
  const handleManualCostChange = useCallback((total: number) => {
    setCosts(prev => ({ ...prev, manual_total: total }));
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Acquisition Cost Management
          </CardTitle>
          <div className="flex gap-2">
            {/* API Configuration Dialog */}
            <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  API Setup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>External API Configuration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-name">Configuration Name</Label>
                    <Input
                      id="api-name"
                      value={newApiConfig.name}
                      onChange={(e) => setNewApiConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Meta Business Account"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="api-type">Platform</Label>
                    <Select value={newApiConfig.type} onValueChange={(value: 'meta' | 'google' | 'quickbooks') => 
                      setNewApiConfig(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meta">Meta (Facebook/Instagram)</SelectItem>
                        <SelectItem value="google">Google Ads</SelectItem>
                        <SelectItem value="quickbooks">QuickBooks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={newApiConfig.apiKey}
                      onChange={(e) => setNewApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter your API key"
                    />
                  </div>
                  
                  {(newApiConfig.type === 'meta' || newApiConfig.type === 'google') && (
                    <div>
                      <Label htmlFor="api-secret">API Secret</Label>
                      <Input
                        id="api-secret"
                        type="password"
                        value={newApiConfig.apiSecret}
                        onChange={(e) => setNewApiConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                        placeholder="Enter your API secret"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="access-token">Access Token (Optional)</Label>
                    <Input
                      id="access-token"
                      type="password"
                      value={newApiConfig.accessToken}
                      onChange={(e) => setNewApiConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                      placeholder="Enter access token if required"
                    />
                  </div>
                  
                  <Button onClick={handleAddApiConfig} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Configuration
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={handleSaveCosts} 
              disabled={saveCostsMutation.isPending}
              className="bg-[#1d1d52] hover:bg-[#1d1d52]/90"
            >
              {saveCostsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Costs
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="automated">API Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-6">
            <CostEntryForm 
              onCostChange={handleManualCostChange}
              initialCosts={[]}
            />
          </TabsContent>
          
          <TabsContent value="automated" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Configured APIs</h3>
                <Badge variant="secondary">{apiConfigs.length} Active</Badge>
              </div>
              
              {apiConfigs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Key className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <p>No API configurations found.</p>
                  <p className="text-sm">Add your Meta, Google, or QuickBooks API credentials to automatically import advertising spend.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiConfigs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{config.type} API</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncApiDataMutation.mutate(config.id)}
                          disabled={syncApiDataMutation.isPending}
                        >
                          {syncApiDataMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Sync
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}