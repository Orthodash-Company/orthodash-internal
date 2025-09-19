'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, ExternalLink, Settings, TestTube, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface QuickBooksConfig {
  consumerKey: string
  consumerSecret: string
  accessToken?: string
  accessTokenSecret?: string
  companyId?: string
  sandbox: boolean
}

interface QuickBooksSetupProps {
  onSetupComplete?: (config: QuickBooksConfig) => void
  onRevenueDataLoaded?: (data: any) => void
}

export default function QuickBooksSetup({ onSetupComplete, onRevenueDataLoaded }: QuickBooksSetupProps) {
  const [config, setConfig] = useState<QuickBooksConfig>({
    consumerKey: '',
    consumerSecret: '',
    accessToken: '',
    accessTokenSecret: '',
    companyId: '',
    sandbox: true
  })

  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [revenueData, setRevenueData] = useState<any>(null)

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('quickbooks-config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
        if (parsed.consumerKey && parsed.consumerSecret) {
          testConnection()
        }
      } catch (error) {
        console.error('Error loading QuickBooks config:', error)
      }
    }
  }, [])

  // Save configuration to localStorage
  const saveConfig = (newConfig: QuickBooksConfig) => {
    localStorage.setItem('quickbooks-config', JSON.stringify(newConfig))
    setConfig(newConfig)
  }

  // Handle configuration changes
  const handleConfigChange = (field: keyof QuickBooksConfig, value: string | boolean) => {
    const newConfig = { ...config, [field]: value }
    saveConfig(newConfig)
  }

  // Generate authorization URL
  const generateAuthUrl = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/quickbooks/auth?action=authorize')
      const data = await response.json()

      if (data.success) {
        setAuthUrl(data.authUrl)
        toast.success('Authorization URL generated')
      } else {
        toast.error('Failed to generate authorization URL')
      }
    } catch (error) {
      console.error('Error generating auth URL:', error)
      toast.error('Error generating authorization URL')
    } finally {
      setIsLoading(false)
    }
  }

  // Test QuickBooks connection
  const testConnection = async () => {
    if (!config.consumerKey || !config.consumerSecret) {
      toast.error('Please enter Consumer Key and Consumer Secret first')
      return
    }

    setIsLoading(true)
    setConnectionStatus('connecting')

    try {
      // Update credentials first
      const updateResponse = await fetch('/api/quickbooks/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      const updateData = await updateResponse.json()

      if (updateData.success) {
        setConnectionStatus('connected')
        toast.success('QuickBooks connection successful!')
        
        // Load sample revenue data
        await loadRevenueData()
        
        if (onSetupComplete) {
          onSetupComplete(config)
        }
      } else {
        setConnectionStatus('error')
        toast.error('QuickBooks connection failed: ' + updateData.message)
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      setConnectionStatus('error')
      toast.error('Error testing QuickBooks connection')
    } finally {
      setIsLoading(false)
    }
  }

  // Load revenue data
  const loadRevenueData = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days ago

      const response = await fetch(`/api/quickbooks/revenue?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()

      if (data.success) {
        setRevenueData(data.data)
        toast.success('Revenue data loaded successfully')
        
        if (onRevenueDataLoaded) {
          onRevenueDataLoaded(data.data)
        }
      } else {
        toast.error('Failed to load revenue data: ' + data.message)
      }
    } catch (error) {
      console.error('Error loading revenue data:', error)
      toast.error('Error loading revenue data')
    }
  }

  // Handle OAuth callback (if redirected back from QuickBooks)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    if (code && state === 'quickbooks_auth') {
      handleOAuthCallback(code)
    }
  }, [])

  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quickbooks/auth?action=callback&code=${code}`)
      const data = await response.json()

      if (data.success) {
        const newConfig = {
          ...config,
          accessToken: data.tokenData.accessToken,
          accessTokenSecret: data.tokenData.refreshToken
        }
        saveConfig(newConfig)
        setConnectionStatus('connected')
        toast.success('QuickBooks authorization successful!')
        
        if (onSetupComplete) {
          onSetupComplete(newConfig)
        }
      } else {
        toast.error('Authorization failed: ' + data.message)
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error)
      toast.error('Error processing authorization')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            QuickBooks Desktop API Setup
          </CardTitle>
          <CardDescription>
            Configure your QuickBooks Desktop API credentials to pull real revenue data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Connection Status:</span>
              <Badge 
                variant={connectionStatus === 'connected' ? 'default' : 
                        connectionStatus === 'connecting' ? 'secondary' : 
                        connectionStatus === 'error' ? 'destructive' : 'outline'}
                className="flex items-center gap-1"
              >
                {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3" />}
                {connectionStatus === 'error' && <XCircle className="h-3 w-3" />}
                {connectionStatus === 'connecting' && <TestTube className="h-3 w-3" />}
                {connectionStatus === 'disconnected' && <XCircle className="h-3 w-3" />}
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </Badge>
            </div>
            <Button
              onClick={testConnection}
              disabled={isLoading || !config.consumerKey || !config.consumerSecret}
              size="sm"
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consumerKey">Consumer Key *</Label>
              <Input
                id="consumerKey"
                type="text"
                placeholder="Enter your QuickBooks Consumer Key"
                value={config.consumerKey}
                onChange={(e) => handleConfigChange('consumerKey', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumerSecret">Consumer Secret *</Label>
              <Input
                id="consumerSecret"
                type="password"
                placeholder="Enter your QuickBooks Consumer Secret"
                value={config.consumerSecret}
                onChange={(e) => handleConfigChange('consumerSecret', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Will be filled after OAuth authorization"
                value={config.accessToken || ''}
                onChange={(e) => handleConfigChange('accessToken', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessTokenSecret">Access Token Secret</Label>
              <Input
                id="accessTokenSecret"
                type="password"
                placeholder="Will be filled after OAuth authorization"
                value={config.accessTokenSecret || ''}
                onChange={(e) => handleConfigChange('accessTokenSecret', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                type="text"
                placeholder="Enter your QuickBooks Company ID"
                value={config.companyId || ''}
                onChange={(e) => handleConfigChange('companyId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sandbox">Sandbox Mode</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sandbox"
                  checked={config.sandbox}
                  onCheckedChange={(checked) => handleConfigChange('sandbox', checked)}
                />
                <Label htmlFor="sandbox" className="text-sm">
                  {config.sandbox ? 'Sandbox (Testing)' : 'Production'}
                </Label>
              </div>
            </div>
          </div>

          {/* OAuth Authorization */}
          <div className="space-y-2">
            <Label>OAuth Authorization</Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={generateAuthUrl}
                disabled={isLoading || !config.consumerKey || !config.consumerSecret}
                size="sm"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Generate Auth URL
              </Button>
              {authUrl && (
                <Button
                  onClick={() => window.open(authUrl, '_blank')}
                  size="sm"
                  variant="default"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Authorize with QuickBooks
                </Button>
              )}
            </div>
          </div>

          {/* Setup Instructions */}
          <Alert>
            <AlertDescription>
              <strong>Setup Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Get your QuickBooks Desktop API credentials from Intuit Developer</li>
                <li>Enter your Consumer Key and Consumer Secret above</li>
                <li>Click "Generate Auth URL" and authorize the app</li>
                <li>Test the connection to verify everything works</li>
                <li>Revenue data will be automatically loaded and integrated</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Revenue Data Preview */}
      {revenueData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Data Preview
            </CardTitle>
            <CardDescription>
              Sample revenue data from QuickBooks (last 90 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${revenueData.revenueMetrics?.totalRevenue?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {revenueData.revenueData?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {revenueData.locationRevenue?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Locations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
