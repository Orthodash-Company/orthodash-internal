import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Settings, Check, AlertCircle, Key, RefreshCw, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface GreyfinchSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ApiCredentials {
  apiKey: string;
  apiSecret: string;
}

interface ApiStatus {
  status: string;
  dataSource: string;
  message: string;
  locationCount?: number;
  apiCredentialsConfigured: boolean;
}

export function GreyfinchSetupModal({ open, onOpenChange }: GreyfinchSetupModalProps) {
  const [credentials, setCredentials] = useState<ApiCredentials>({
    apiKey: '',
    apiSecret: ''
  });
  const { toast } = useToast();

  // Query API status
  const { data: apiStatus, refetch: refetchStatus, isLoading: statusLoading } = useQuery<ApiStatus>({
    queryKey: ['/api/test-greyfinch'],
    enabled: open, // Only fetch when modal is open
    queryFn: async () => {
      const response = await fetch('/api/test-greyfinch');
      return response.json();
    }
  });

  // Update credentials mutation
  const updateCredentialsMutation = useMutation({
    mutationFn: async (newCredentials: ApiCredentials) => {
      const response = await apiRequest('POST', '/api/greyfinch/update-credentials', newCredentials);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Live Data Connected",
        description: "Greyfinch API credentials updated successfully. You can now access live practice data."
      });
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed", 
        description: error instanceof Error ? error.message : "Failed to verify credentials",
        variant: "destructive"
      });
    }
  });

  const handleUpdateCredentials = () => {
    if (!credentials.apiKey.trim() || !credentials.apiSecret.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both API key and secret.",
        variant: "destructive"
      });
      return;
    }
    updateCredentialsMutation.mutate(credentials);
  };

  const getStatusInfo = () => {
    if (statusLoading) return { badge: <Badge variant="secondary">Checking...</Badge>, description: "Verifying connection..." };
    if (!apiStatus) return { badge: <Badge variant="destructive">Unknown</Badge>, description: "Unable to check status" };
    
    if (apiStatus.status === "connected") {
      const isLiveData = apiStatus.dataSource.includes("Live");
      return {
        badge: isLiveData ? 
          <Badge className="bg-green-100 text-green-800">Live Data Active</Badge> : 
          <Badge variant="secondary">Development Data</Badge>,
        description: apiStatus.message
      };
    } else {
      return { 
        badge: <Badge variant="destructive">No Connection</Badge>, 
        description: apiStatus.message || "API connection failed"
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Greyfinch API Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Connection Status</CardTitle>
                <div className="flex items-center gap-2">
                  {statusInfo.badge}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchStatus()}
                    disabled={statusLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{statusInfo.description}</p>
              {apiStatus?.locationCount && (
                <p className="text-sm text-gray-600 mt-1">
                  {apiStatus.locationCount} practice locations available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Credentials Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Greyfinch API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your Greyfinch API key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-secret">Greyfinch API Secret</Label>
                <Input
                  id="api-secret"
                  type="password"
                  value={credentials.apiSecret}
                  onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                  placeholder="Enter your Greyfinch API secret"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Where to find your credentials:</p>
                    <ol className="text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Log into your Greyfinch dashboard</li>
                      <li>Navigate to Settings → API Keys</li>
                      <li>Generate or copy your API key and secret</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateCredentialsMutation.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateCredentials}
            disabled={updateCredentialsMutation.isPending || !credentials.apiKey.trim() || !credentials.apiSecret.trim()}
            className="flex-1"
          >
            {updateCredentialsMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Update & Connect
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}