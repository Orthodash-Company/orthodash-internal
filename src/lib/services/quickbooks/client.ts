// QuickBooks Desktop API Service
// This service handles all interactions with QuickBooks Desktop API

import { 
  QuickBooksConfig, 
  QuickBooksRevenueData, 
  QuickBooksCustomerData, 
  QuickBooksLocationData,
  QUICKBOOKS_QUERIES,
  QUICKBOOKS_MUTATIONS,
  QuickBooksSchemaUtils
} from './schema'

export class QuickBooksService {
  private config: QuickBooksConfig
  private baseUrl: string
  private accessToken: string | null = null

  constructor(config?: Partial<QuickBooksConfig>) {
    this.config = {
      consumerKey: process.env.QUICKBOOKS_CONSUMER_KEY || '',
      consumerSecret: process.env.QUICKBOOKS_CONSUMER_SECRET || '',
      accessToken: process.env.QUICKBOOKS_ACCESS_TOKEN || '',
      accessTokenSecret: process.env.QUICKBOOKS_ACCESS_TOKEN_SECRET || '',
      companyId: process.env.QUICKBOOKS_COMPANY_ID || '',
      sandbox: process.env.QUICKBOOKS_SANDBOX === 'true',
      ...config
    }

    // Set base URL based on sandbox mode
    this.baseUrl = this.config.sandbox 
      ? 'https://sandbox-quickbooks.api.intuit.com/v1' 
      : 'https://quickbooks.api.intuit.com/v1'

  }

  // Update credentials
  updateCredentials(consumerKey: string, consumerSecret: string, accessToken?: string, accessTokenSecret?: string, companyId?: string) {
    this.config.consumerKey = consumerKey
    this.config.consumerSecret = consumerSecret
    if (accessToken) this.config.accessToken = accessToken
    if (accessTokenSecret) this.config.accessTokenSecret = accessTokenSecret
    if (companyId) this.config.companyId = companyId

  }

  // Get OAuth authorization URL
  getAuthorizationUrl(callbackUrl: string): string {
    const params = new URLSearchParams({
      client_id: this.config.consumerKey,
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: callbackUrl,
      response_type: 'code',
      access_type: 'offline'
    })

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(authorizationCode: string, callbackUrl: string): Promise<any> {
    try {
      const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: callbackUrl
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token exchange failed: ${response.status} - ${errorText}`)
      }

      const tokenData = await response.json()
      this.config.accessToken = tokenData.access_token
      this.config.accessTokenSecret = tokenData.refresh_token
      this.accessToken = tokenData.access_token

      return tokenData
    } catch (error) {
      console.error('Error exchanging code for token:', error)
      throw error
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string> {
    try {
      if (!this.config.accessTokenSecret) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.accessTokenSecret
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`)
      }

      const tokenData = await response.json()
      this.config.accessToken = tokenData.access_token
      this.config.accessTokenSecret = tokenData.refresh_token
      this.accessToken = tokenData.access_token

      return tokenData.access_token
    } catch (error) {
      console.error('Error refreshing access token:', error)
      throw error
    }
  }

  // Make authenticated request to QuickBooks API
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.config.accessToken) {
      throw new Error('No access token available. Please authenticate first.')
    }

    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await this.refreshAccessToken()
        
        // Retry the request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
          }
        })

        if (!retryResponse.ok) {
          const errorText = await retryResponse.text()
          throw new Error(`QuickBooks API request failed: ${retryResponse.status} - ${errorText}`)
        }

        return await retryResponse.json()
      }

      const errorText = await response.text()
      throw new Error(`QuickBooks API request failed: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  // Get company info
  async getCompanyInfo(): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(`/companies/${this.config.companyId}/companyinfo/${this.config.companyId}`)
      return response
    } catch (error) {
      console.error('Error getting company info:', error)
      throw error
    }
  }

  // Get revenue data
  async getRevenueData(startDate: string, endDate: string, locationFilter?: string): Promise<QuickBooksRevenueData[]> {
    try {
      // Get invoices
      const invoicesResponse = await this.makeAuthenticatedRequest(
        `/companies/${this.config.companyId}/invoices?start_date=${startDate}&end_date=${endDate}`
      )

      // Get payments
      const paymentsResponse = await this.makeAuthenticatedRequest(
        `/companies/${this.config.companyId}/payments?start_date=${startDate}&end_date=${endDate}`
      )

      // Get credit memos
      const creditMemosResponse = await this.makeAuthenticatedRequest(
        `/companies/${this.config.companyId}/creditmemos?start_date=${startDate}&end_date=${endDate}`
      )

      const qbData = {
        invoices: invoicesResponse.QueryResponse?.Invoice || [],
        payments: paymentsResponse.QueryResponse?.Payment || [],
        creditMemos: creditMemosResponse.QueryResponse?.CreditMemo || []
      }

      const revenueData = QuickBooksSchemaUtils.processRevenueData(qbData)

      // Filter by location if specified
      if (locationFilter) {
        return revenueData.filter(item => item.location.toLowerCase().includes(locationFilter.toLowerCase()))
      }

      return revenueData
    } catch (error) {
      console.error('Error getting revenue data:', error)
      throw error
    }
  }

  // Get customer data
  async getCustomerData(locationFilter?: string): Promise<QuickBooksCustomerData[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/companies/${this.config.companyId}/customers`
      )

      const customers = response.QueryResponse?.Customer || []
      
      // Process customer data
      const customerData = customers.map((customer: any) => ({
        id: customer.Id,
        name: customer.Name,
        email: customer.PrimaryEmailAddr?.Address || '',
        phone: customer.PrimaryPhone?.FreeFormNumber || '',
        address: this.formatAddress(customer.BillAddr),
        location: locationFilter || 'Unknown', // QuickBooks doesn't have location field by default
        totalRevenue: 0, // This would need to be calculated from invoices
        lastPaymentDate: '', // This would need to be calculated from payments
        outstandingBalance: parseFloat(customer.Balance) || 0
      }))

      return customerData
    } catch (error) {
      console.error('Error getting customer data:', error)
      throw error
    }
  }

  // Get location-based revenue summary
  async getLocationRevenue(startDate: string, endDate: string): Promise<QuickBooksLocationData[]> {
    try {
      // Get all revenue data first
      const revenueData = await this.getRevenueData(startDate, endDate)

      // Group by location
      const locationMap = new Map<string, QuickBooksLocationData>()

      revenueData.forEach(item => {
        const existing = locationMap.get(item.location)
        if (existing) {
          existing.totalRevenue += item.amount
          existing.customerCount += 1
        } else {
          locationMap.set(item.location, {
            id: item.location.toLowerCase().replace(/\s+/g, '-'),
            name: item.location,
            totalRevenue: item.amount,
            monthlyRevenue: item.amount, // This would need proper monthly calculation
            customerCount: 1,
            averageRevenuePerCustomer: item.amount,
            lastUpdated: new Date().toISOString()
          })
        }
      })

      const locationData = Array.from(locationMap.values())

      return locationData
    } catch (error) {
      console.error('Error getting location revenue:', error)
      throw error
    }
  }

  // Get financial reports
  async getFinancialReports(startDate: string, endDate: string, reportType: string = 'ProfitAndLoss'): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/companies/${this.config.companyId}/reports/${reportType}?start_date=${startDate}&end_date=${endDate}`
      )

      return response
    } catch (error) {
      console.error('Error getting financial reports:', error)
      throw error
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getCompanyInfo()
      return true
    } catch (error) {
      console.error('QuickBooks connection failed:', error)
      return false
    }
  }

  // Helper function to format address
  private formatAddress(address: any): string {
    if (!address) return ''
    
    const parts = []
    if (address.Line1) parts.push(address.Line1)
    if (address.City) parts.push(address.City)
    if (address.CountrySubDivisionCode) parts.push(address.CountrySubDivisionCode)
    if (address.PostalCode) parts.push(address.PostalCode)
    
    return parts.join(', ')
  }

  // Get revenue metrics
  async getRevenueMetrics(locationFilter?: string): Promise<any> {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year ago

      const revenueData = await this.getRevenueData(startDate, endDate, locationFilter)
      const metrics = QuickBooksSchemaUtils.calculateRevenueMetrics(revenueData)

      return metrics
    } catch (error) {
      console.error('Error getting revenue metrics:', error)
      throw error
    }
  }
}

// Create singleton instance
export const quickbooksService = new QuickBooksService()

export default QuickBooksService
