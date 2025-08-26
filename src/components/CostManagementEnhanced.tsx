import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Settings, Key, Plus, Save, RefreshCw, Trash2, Edit } from "lucide-react";
import { CostEntryForm } from "./CostEntryForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ApiConfiguration, AcquisitionCost, AdSpend } from "@/shared/schema";

interface CostData {
  manual: AcquisitionCost[];
  api: AdSpend[];
  totals: {
    manual: number;
    meta: number;
    google: number;
    total: number;
  };
}

interface CostManagementEnhancedProps {
  locationId: number | null;
  period: string;
}

export function CostManagementEnhanced({ locationId, period }: CostManagementEnhancedProps) {
  const [costData, setCostData] = useState<CostData>({
    manual: [],
    api: [],
    totals: {
      manual: 0,
      meta: 0,
      google: 0,
      total: 0
    }
  });
  
  const [apiConfigs, setApiConfigs] = useState<ApiConfiguration[]>([]);
  const [newApiConfig, setNewApiConfig] = useState({
    name: '',
    type: 'meta' as 'meta' | 'google' | 'quickbooks',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    refreshToken: '',
    realmId: ''
  });
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ApiConfiguration | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load cost data
  useEffect(() => {
    if (user) {
      fetchCostData();
      fetchApiConfigs();
    }
  }, [user, locationId, period]);

  const fetchCostData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `/api/acquisition-costs?locationId=${locationId || ''}&period=${period || ''}&userId=${user.id}`
      );
      if (!response.ok) throw new Error('Failed to fetch costs');
      const data = await response.json();
      setCostData(data);
    } catch (error) {
      console.error('Error fetching costs:', error);
      // Don't show error toast for empty period, just set loading to false
      if (period) {
        toast({
          title: "Error",
          description: "Failed to load cost data",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiConfigs = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/api-configurations?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch API configurations');
      const data = await response.json();
      setApiConfigs(data.data || []);
    } catch (error) {
      console.error('Error fetching API configurations:', error);
    }
  };

  // Save manual costs
  const saveManualCosts = async (costs: any[]) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/acquisition-costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          period,
          userId: user.id,
          costs,
          type: 'manual'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save costs: ${response.status}`);
      }
      
      await response.json();
      await fetchCostData(); // Refresh data
      toast({
        title: "Costs Saved",
        description: "Manual acquisition costs have been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save costs",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Sync API data
  const syncApiData = async (configId: number, syncType: string = 'costs') => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync-external-costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configId,
          locationId,
          period,
          userId: user.id,
          syncType
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to sync data: ${response.status}`);
      }
      
      const data = await response.json();
      await fetchCostData(); // Refresh data
      toast({
        title: "Data Synced",
        description: `Successfully synced ${data.data.count} records with total amount of $${data.data.totalAmount.toFixed(2)}`
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync external data",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Add API configuration
  const handleAddApiConfig = async () => {
    if (!user) return;
    
    if (!newApiConfig.name || !newApiConfig.apiKey) {
      toast({
        title: "Invalid Configuration",
        description: "Please provide at least a name and API key.",
        variant: "destructive"
      });
      return;
    }

    try {
      const configData = {
        userId: user.id,
        name: newApiConfig.name,
        type: newApiConfig.type,
        apiKey: newApiConfig.apiKey,
        apiSecret: newApiConfig.apiSecret || undefined,
        accessToken: newApiConfig.accessToken || undefined,
        refreshToken: newApiConfig.refreshToken || undefined,
        metadata: newApiConfig.realmId ? { realmId: newApiConfig.realmId } : undefined
      };

      const response = await fetch('/api/api-configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        throw new Error('Failed to create API configuration');
      }

      await fetchApiConfigs(); // Refresh configs
      setNewApiConfig({
        name: '',
        type: 'meta',
        apiKey: '',
        apiSecret: '',
        accessToken: '',
        refreshToken: '',
        realmId: ''
      });
      setConfigDialogOpen(false);

      toast({
        title: "Configuration Added",
        description: `${newApiConfig.name} API configuration has been added.`
      });
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to add API configuration",
        variant: "destructive"
      });
    }
  };

  // Delete API configuration
  const handleDeleteApiConfig = async (configId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/api-configurations?id=${configId}&userId=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete API configuration');
      }

      await fetchApiConfigs(); // Refresh configs
      toast({
        title: "Configuration Deleted",
        description: "API configuration has been deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete API configuration",
        variant: "destructive"
      });
    }
  };

  // Handle manual cost changes
  const handleManualCostChange = useCallback((totalCost: number) => {
    // Convert total cost to a single cost entry
    const costEntry = {
      referralType: 'manual',
      cost: totalCost,
      description: 'Manual cost entry'
    };
    saveManualCosts([costEntry]);
  }, [locationId, period, user]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

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
              <DialogContent className="max-w-md">
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
                  
                  {newApiConfig.type === 'google' && (
                    <div>
                      <Label htmlFor="refresh-token">Refresh Token</Label>
                      <Input
                        id="refresh-token"
                        type="password"
                        value={newApiConfig.refreshToken}
                        onChange={(e) => setNewApiConfig(prev => ({ ...prev, refreshToken: e.target.value }))}
                        placeholder="Enter your refresh token"
                      />
                    </div>
                  )}
                  
                  {newApiConfig.type === 'quickbooks' && (
                    <div>
                      <Label htmlFor="realm-id">Realm ID</Label>
                      <Input
                        id="realm-id"
                        value={newApiConfig.realmId}
                        onChange={(e) => setNewApiConfig(prev => ({ ...prev, realmId: e.target.value }))}
                        placeholder="Enter your QuickBooks Realm ID"
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Manual Cost Entries</h3>
                <Badge variant="secondary">
                  Total: ${costData.totals.manual.toFixed(2)}
                </Badge>
              </div>
              
              <CostEntryForm 
                onCostChange={handleManualCostChange}
                initialCosts={costData.manual.map(cost => ({
                  id: cost.id.toString(),
                  label: cost.description || cost.referralType,
                  amount: cost.cost
                }))}
              />
            </div>
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
                        {config.lastSyncDate && (
                          <p className="text-xs text-gray-500">
                            Last synced: {new Date(config.lastSyncDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncApiData(config.id)}
                          disabled={isSyncing}
                        >
                          {isSyncing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteApiConfig(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* API Cost Summary */}
              {costData.api.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">API-Synced Costs Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Meta Ads:</span>
                      <span className="ml-2 font-medium">${costData.totals.meta.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Google Ads:</span>
                      <span className="ml-2 font-medium">${costData.totals.google.toFixed(2)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Total API Costs:</span>
                      <span className="ml-2 font-medium">${(costData.totals.meta + costData.totals.google).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Overall Summary */}
        <Separator className="my-6" />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Total Acquisition Costs</h3>
            <p className="text-sm text-gray-600">Period: {period}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ${costData.totals.total.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              Manual: ${costData.totals.manual.toFixed(2)} | API: ${(costData.totals.meta + costData.totals.google).toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}