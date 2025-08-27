'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react'

interface GreyfinchCredentials {
  apiKey: string;
  apiSecret: string;
  resourceId?: string;
  resourceToken?: string;
}

export function GreyfinchSetup() {
  const [credentials, setCredentials] = useState<GreyfinchCredentials>({
    apiKey: '',
    apiSecret: '',
    resourceId: '',
    resourceToken: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showResourceToken, setShowResourceToken] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedCredentials = localStorage.getItem('greyfinch-credentials');
    if (savedCredentials) {
      const parsed = JSON.parse(savedCredentials);
      setCredentials(parsed);
      setIsConnected(true);
    }
  }, []);

  const handleSaveCredentials = async () => {
    if (!credentials.apiKey) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your API key.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test the connection first
      const testResponse = await fetch('/api/greyfinch/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret || '',
          userId: 'test-user'
        }),
      });

      const testData = await testResponse.json();

      if (testData.success) {
        // Save credentials to localStorage
        localStorage.setItem('greyfinch-credentials', JSON.stringify(credentials));
        setIsConnected(true);
        toast({
          title: "Success",
          description: "Greyfinch API credentials saved and connection verified!",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: testData.message || "Failed to connect to Greyfinch API",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test Greyfinch API connection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!credentials.apiKey) {
      toast({
        title: "Missing Credentials",
        description: "Please enter API key first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/greyfinch/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret || '',
          userId: 'test-user'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Connection Test Successful",
          description: "Greyfinch API is working correctly",
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: data.message || "Failed to connect to Greyfinch API",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test Greyfinch API connection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('greyfinch-credentials');
    setCredentials({
      apiKey: '',
      apiSecret: '',
      resourceId: '',
      resourceToken: ''
    });
    setIsConnected(false);
    toast({
      title: "Credentials Cleared",
      description: "Greyfinch API credentials have been removed",
    });
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className={`p-3 rounded-lg border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
          <span className={`text-sm font-medium ${isConnected ? 'text-green-800' : 'text-orange-800'}`}>
            {isConnected ? 'Connected to Greyfinch API' : 'Not connected to Greyfinch API'}
          </span>
        </div>
      </div>

      {/* API Key */}
      <div>
        <Label htmlFor="api-key">API Key</Label>
        <Input
          id="api-key"
          type="text"
          value={credentials.apiKey}
          onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Enter your Greyfinch API key"
          className="mt-1"
        />
      </div>

      {/* API Secret */}
      <div>
        <Label htmlFor="api-secret">API Secret</Label>
        <div className="relative mt-1">
          <Input
            id="api-secret"
            type={showApiSecret ? "text" : "password"}
            value={credentials.apiSecret}
            onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
            placeholder="Enter your Greyfinch API secret"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowApiSecret(!showApiSecret)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showApiSecret ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Resource ID (Optional) */}
      <div>
        <Label htmlFor="resource-id">Resource ID (Optional)</Label>
        <Input
          id="resource-id"
          type="text"
          value={credentials.resourceId || ''}
          onChange={(e) => setCredentials(prev => ({ ...prev, resourceId: e.target.value }))}
          placeholder="Enter Hasura resource ID if required"
          className="mt-1"
        />
      </div>

      {/* Resource Token (Optional) */}
      <div>
        <Label htmlFor="resource-token">Resource Token (Optional)</Label>
        <div className="relative mt-1">
          <Input
            id="resource-token"
            type={showResourceToken ? "text" : "password"}
            value={credentials.resourceToken || ''}
            onChange={(e) => setCredentials(prev => ({ ...prev, resourceToken: e.target.value }))}
            placeholder="Enter Hasura resource token if required"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowResourceToken(!showResourceToken)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showResourceToken ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button 
          onClick={handleSaveCredentials} 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {isConnected ? 'Update Credentials' : 'Save & Connect'}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleTestConnection} 
          disabled={isLoading}
        >
          Test
        </Button>
        {isConnected && (
          <Button 
            variant="outline" 
            onClick={handleClearCredentials}
            className="text-red-600 hover:text-red-700"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        <p>• API Key is required for authentication</p>
        <p>• API Secret is optional (only if required by your Greyfinch setup)</p>
        <p>• Resource ID and Token are only needed for Hasura GraphQL endpoints</p>
        <p>• Credentials are stored locally in your browser</p>
      </div>
    </div>
  );
}
