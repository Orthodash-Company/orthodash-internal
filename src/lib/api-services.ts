import { ApiConfiguration, AdSpend, Vendor, Revenue } from '@/shared/schema';

// Meta (Facebook/Instagram) API Service
export class MetaApiService {
  private accessToken: string;
  private apiVersion: string = 'v18.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAdAccounts(): Promise<any[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/me/adaccounts?access_token=${this.accessToken}&fields=id,name,account_status,currency,timezone_name`
      );
      
      if (!response.ok) {
        throw new Error(`Meta API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Meta ad accounts:', error);
      throw error;
    }
  }

  async getAdSpend(adAccountId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/act_${adAccountId}/insights?access_token=${this.accessToken}&fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,actions&time_range={"since":"${startDate}","until":"${endDate}"}&level=ad`
      );
      
      if (!response.ok) {
        throw new Error(`Meta API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Meta ad spend:', error);
      throw error;
    }
  }

  async getCampaigns(adAccountId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/act_${adAccountId}/campaigns?access_token=${this.accessToken}&fields=id,name,status,objective,created_time`
      );
      
      if (!response.ok) {
        throw new Error(`Meta API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Meta campaigns:', error);
      throw error;
    }
  }
}

// Google Ads API Service
export class GoogleAdsApiService {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken?: string;

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Google OAuth error: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      if (!this.accessToken) {
        throw new Error('Failed to get access token from Google OAuth');
      }
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Google access token:', error);
      throw error;
    }
  }

  async getCustomerAccounts(): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(
        'https://googleads.googleapis.com/v14/customers',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Ads API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching Google Ads customers:', error);
      throw error;
    }
  }

  async getAdSpend(customerId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          ad_group.id,
          ad_group.name,
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          metrics.cost_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions
        FROM ad_group_ad
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      `;

      const response = await fetch(
        `https://googleads.googleapis.com/v14/customers/${customerId}/googleAds:search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Ads API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching Google Ads spend:', error);
      throw error;
    }
  }
}

// QuickBooks API Service
export class QuickBooksApiService {
  private accessToken: string;
  private realmId: string;
  private baseUrl: string;

  constructor(accessToken: string, realmId: string) {
    this.accessToken = accessToken;
    this.realmId = realmId;
    this.baseUrl = `https://sandbox-accounts.platform.intuit.com/v1/companies/${realmId}`;
  }

  async getVendors(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/query?query=SELECT * FROM Vendor WHERE Active = true MAXRESULTS 1000`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.status}`);
      }

      const data = await response.json();
      return data.QueryResponse?.Vendor || [];
    } catch (error) {
      console.error('Error fetching QuickBooks vendors:', error);
      throw error;
    }
  }

  async getRevenue(startDate: string, endDate: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/query?query=SELECT * FROM Invoice WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.status}`);
      }

      const data = await response.json();
      return data.QueryResponse?.Invoice || [];
    } catch (error) {
      console.error('Error fetching QuickBooks revenue:', error);
      throw error;
    }
  }

  async getExpenses(startDate: string, endDate: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/query?query=SELECT * FROM Bill WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.status}`);
      }

      const data = await response.json();
      return data.QueryResponse?.Bill || [];
    } catch (error) {
      console.error('Error fetching QuickBooks expenses:', error);
      throw error;
    }
  }
}

// API Service Factory
export class ApiServiceFactory {
  static createService(config: ApiConfiguration) {
    switch (config.type) {
      case 'meta':
        return new MetaApiService(config.accessToken || '');
      case 'google':
        return new GoogleAdsApiService(
          config.apiKey,
          config.apiSecret || '',
          config.refreshToken || ''
        );
      case 'quickbooks':
        return new QuickBooksApiService(
          config.accessToken || '',
          (config.metadata as any)?.realmId || ''
        );
      default:
        throw new Error(`Unsupported API type: ${config.type}`);
    }
  }
}

// Data transformation utilities
export const transformMetaAdSpend = (data: any[], period: string, locationId: number, userId: string, apiConfigId: number) => {
  return data.map(item => ({
    userId,
    apiConfigId,
    locationId,
    platform: 'meta',
    campaignId: item.campaign_id,
    campaignName: item.campaign_name,
    adSetId: item.adset_id,
    adSetName: item.adset_name,
    adId: item.ad_id,
    adName: item.ad_name,
    spend: parseFloat(item.spend) || 0,
    impressions: parseInt(item.impressions) || 0,
    clicks: parseInt(item.clicks) || 0,
    conversions: item.actions ? 
      item.actions.find((action: any) => action.action_type === 'purchase')?.value || 0 : 0,
    period,
    date: new Date(),
    metadata: item
  }));
};

export const transformGoogleAdSpend = (data: any[], period: string, locationId: number, userId: string, apiConfigId: number) => {
  return data.map(item => ({
    userId,
    apiConfigId,
    locationId,
    platform: 'google',
    campaignId: item.campaign?.id,
    campaignName: item.campaign?.name,
    adSetId: item.adGroup?.id,
    adSetName: item.adGroup?.name,
    adId: item.adGroupAd?.ad?.id,
    adName: item.adGroupAd?.ad?.name,
    spend: (parseFloat(item.metrics?.costMicros) || 0) / 1000000, // Convert micros to dollars
    impressions: parseInt(item.metrics?.impressions) || 0,
    clicks: parseInt(item.metrics?.clicks) || 0,
    conversions: parseFloat(item.metrics?.conversions) || 0,
    period,
    date: new Date(),
    metadata: item
  }));
};

export const transformQuickBooksVendors = (data: any[], userId: string, apiConfigId: number) => {
  return data.map(item => ({
    userId,
    apiConfigId,
    vendorId: item.Id,
    name: item.DisplayName,
    email: item.PrimaryEmailAddr?.Address,
    phone: item.PrimaryPhone?.FreeFormNumber,
    address: item.BillAddr?.Line1,
    category: item.VendorType,
    isActive: item.Active,
    metadata: item
  }));
};

export const transformQuickBooksRevenue = (data: any[], period: string, locationId: number, userId: string, apiConfigId: number) => {
  return data.map(item => ({
    userId,
    apiConfigId,
    locationId,
    period,
    amount: parseFloat(item.TotalAmt) || 0,
    category: 'revenue',
    description: item.DocNumber,
    transactionDate: new Date(item.TxnDate),
    metadata: item
  }));
};
