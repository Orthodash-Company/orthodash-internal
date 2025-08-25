'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

export function GreyfinchSetupModal() {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  const handleSetup = async () => {
    if (!apiKey || !apiSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both API key and secret.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/greyfinch/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, apiSecret }),
      })

      const data = await response.json()

      if (data.success) {
        setIsConnected(true)
        toast({
          title: "Success",
          description: "Greyfinch API connected successfully!",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to Greyfinch API",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to setup Greyfinch API connection",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/greyfinch/test')
      const data = await response.json()

      if (data.success) {
        setIsConnected(true)
        toast({
          title: "Connection Test",
          description: "Greyfinch API connection is working!",
        })
      } else {
        setIsConnected(false)
        toast({
          title: "Connection Test Failed",
          description: data.message || "Failed to connect to Greyfinch API",
          variant: "destructive"
        })
      }
    } catch (error) {
      setIsConnected(false)
      toast({
        title: "Connection Test Failed",
        description: "Failed to test Greyfinch API connection",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Greyfinch API Setup
        </CardTitle>
        <CardDescription>
          Configure your Greyfinch API credentials to enable live data integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your Greyfinch API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="api-secret">API Secret</Label>
          <Input
            id="api-secret"
            type="password"
            placeholder="Enter your Greyfinch API secret"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSetup} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Setting up...' : 'Setup API'}
          </Button>
          
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            variant="outline"
          >
            Test
          </Button>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Connected to Greyfinch API</span>
          </div>
        )}

        {!isConnected && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Not connected to Greyfinch API</span>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button variant="link" size="sm" className="p-0 h-auto">
            <ExternalLink className="h-4 w-4 mr-1" />
            Get Greyfinch API credentials
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
