import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Settings, Check, AlertCircle, Key, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GreyfinchApiSetupProps {
  onCredentialsUpdated?: () => void;
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

export function GreyfinchApiSetup({ onCredentialsUpdated }: GreyfinchApiSetupProps) {
  const [credentials, setCredentials] = useState<ApiCredentials>({
    apiKey: '',
    apiSecret: ''
  });
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Query API status
  const { data: apiStatus, refetch: refetchStatus, isLoading: statusLoading } = useQuery<ApiStatus>({
    queryKey: ['/api/test-greyfinch'],
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
        title: "Credentials Updated",
        description: "Greyfinch API credentials have been updated successfully."
      });
      setOpen(false);
      refetchStatus();
      onCredentialsUpdated?.();
    },
    onError: (error) => {
      toast({
        title: "Update Failed", 
        description: error instanceof Error ? error.message : "Failed to update credentials",
        variant: "destructive"
      });
    }
  });

  const handleUpdateCredentials = () => {
    if (!credentials.apiKey.trim() || !credentials.apiSecret.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter both API key and secret.",
        variant: "destructive"
      });
      return;
    }
    updateCredentialsMutation.mutate(credentials);
  };

  const getStatusBadge = () => {
    if (statusLoading) return <Badge variant="secondary">Checking...</Badge>;
    if (!apiStatus) return <Badge variant="destructive">Unknown</Badge>;
    
    if (apiStatus.status === "connected") {
      const isLiveData = apiStatus.dataSource.includes("Live");
      return (
        <Badge variant={isLiveData ? "default" : "secondary"}>
          {isLiveData ? "Live Data" : "Development Data"}
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Disconnected</Badge>;
    }
  };

  return (
    <>
      {/* Status Card */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Greyfinch API Status
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchStatus()}
                disabled={statusLoading}
              >
                <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm text-gray-600">
                  {apiStatus?.message || "Checking connection..."}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Locations</Label>
                <p className="text-sm text-gray-600">
                  {apiStatus?.locationCount ? `${apiStatus.locationCount} locations` : "Not available"}
                </p>
              </div>
            </div>
            
            {apiStatus?.status !== "connected" && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">API Configuration Required</p>
                  <p className="text-amber-700">
                    Configure your Greyfinch API credentials to access live practice data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Configure API
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Greyfinch API</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={credentials.apiKey}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your Greyfinch API key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                value={credentials.apiSecret}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                placeholder="Enter your Greyfinch API secret"
              />
            </div>

            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Where to find your API credentials:</p>
              <p>Log into your Greyfinch dashboard and navigate to Settings → API Keys to generate your credentials.</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateCredentials}
                disabled={updateCredentialsMutation.isPending}
                className="flex-1"
              >
                {updateCredentialsMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Update Credentials
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={updateCredentialsMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}