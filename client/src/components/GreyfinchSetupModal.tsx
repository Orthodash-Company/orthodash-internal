import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface GreyfinchSetupModalProps {
  trigger?: React.ReactNode;
  onDataRefresh?: () => void;
}

export function GreyfinchSetupModal({ trigger, onDataRefresh }: GreyfinchSetupModalProps) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const { toast } = useToast();

  const testConnection = async () => {
    if (!apiKey || !apiSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both API key and secret",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setConnectionStatus('testing');

    try {
      const response = await fetch('/api/greyfinch/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret })
      });

      if (response.ok) {
        setConnectionStatus('connected');
        
        // Invalidate all cached data to force refresh with new credentials
        await queryClient.invalidateQueries();
        
        toast({
          title: "Connection Successful",
          description: "Greyfinch API connected successfully. Live data is now available."
        });
        
        // Trigger data refresh callback if provided
        onDataRefresh?.();
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast({
        title: "Connection Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const forceLiveData = async () => {
    try {
      const response = await fetch('/api/greyfinch/force-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Invalidate all data and refresh to get live data
        await queryClient.invalidateQueries();
        
        toast({
          title: "Live Data Activated",
          description: "All API calls will now use live Greyfinch data instead of development fallback."
        });
        
        // Trigger data refresh callback if provided
        onDataRefresh?.();
        
        // Force a page refresh to ensure all components get fresh data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        setOpen(false);
      } else {
        throw new Error('Failed to activate live data mode');
      }
    } catch (error) {
      toast({
        title: "Live Data Activation Failed",
        description: "Unable to switch to live data mode. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Greyfinch Setup
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Greyfinch API Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Greyfinch API key"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-secret">API Secret</Label>
            <Input
              id="api-secret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your Greyfinch API secret"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={testConnection} 
              disabled={testing || !apiKey || !apiSecret}
              size="sm"
            >
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            
            {connectionStatus === 'connected' && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
            
            {connectionStatus === 'failed' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Force Live Data Mode</Label>
              <p className="text-xs text-gray-600">
                Switch from development fallback data to live Greyfinch API data
              </p>
              <Button 
                onClick={forceLiveData}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Activate Live Data
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}