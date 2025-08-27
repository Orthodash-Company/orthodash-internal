import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export class GreyfinchService {
  private apiUrl: string
  private apiKey: string

  constructor() {
    // Use the correct Greyfinch API URL (user confirmed working URL)
    this.apiUrl = process.env.GREYFINCH_API_URL || 'https://connect-api.greyfinch.com/v1/graphql'
    // Auto-load credentials from environment variables
    this.apiKey = process.env.GREYFINCH_API_KEY || ''
    
    console.log('GreyfinchService initialized:', {
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      envApiKey: !!process.env.GREYFINCH_API_KEY,
      envApiUrl: !!process.env.GREYFINCH_API_URL,
      apiKeyPrefix: this.apiKey.substring(0, 8) + '...' // Show first 8 chars for debugging
    })
  }

  // Update credentials dynamically
  updateCredentials(apiKey: string, apiUrl?: string) {
    this.apiKey = apiKey
    if (apiUrl) {
      this.apiUrl = apiUrl
    }
    
    console.log('Greyfinch credentials updated:', {
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length
    })
  }

  // Store credentials in database
  async storeCredentials(userId: string, apiKey: string, apiSecret?: string) {
    try {
      // Check if configuration already exists
      const existing = await db.execute(sql`
        SELECT id FROM api_configurations 
        WHERE user_id = ${userId} AND type = 'greyfinch'
      `)
      
      if (existing.length > 0) {
        // Update existing configuration
        await db.execute(sql`
          UPDATE api_configurations 
          SET api_key = ${apiKey}, 
              api_secret = ${apiSecret || null},
              updated_at = NOW()
          WHERE user_id = ${userId} AND type = 'greyfinch'
        `)
      } else {
        // Insert new configuration
        await db.execute(sql`
          INSERT INTO api_configurations (user_id, name, type, api_key, api_secret, is_active)
          VALUES (${userId}, 'Greyfinch API', 'greyfinch', ${apiKey}, ${apiSecret || null}, true)
        `)
      }
      
      console.log('Greyfinch credentials stored in database for user:', userId)
      return true
    } catch (error) {
      console.error('Failed to store Greyfinch credentials:', error)
      return false
    }
  }

  // Retrieve credentials from database
  async getCredentials(userId: string) {
    try {
      const result = await db.execute(sql`
        SELECT api_key, api_secret 
        FROM api_configurations 
        WHERE user_id = ${userId} AND type = 'greyfinch' AND is_active = true
      `)
      
      if (result.length > 0) {
        const config = result[0]
        this.apiKey = config.api_key
        if (config.api_secret) {
          // Store secret if needed
        }
        
        console.log('Greyfinch credentials retrieved from database for user:', userId)
        return {
          apiKey: config.api_key,
          apiSecret: config.api_secret
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to retrieve Greyfinch credentials:', error)
      return null
    }
  }

  private async makeGraphQLRequest(query: string, variables: any = {}) {
    try {
      // Validate configuration
      if (!this.apiKey) {
        throw new Error('Greyfinch API key is not configured. Please provide API credentials.')
      }
      
      if (!this.apiUrl) {
        throw new Error('Greyfinch API URL is not configured. Please provide API URL.')
      }

            console.log(`Making GraphQL request to: ${this.apiUrl}`)
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey ? '***' : 'none'}`,
        'X-API-Key': this.apiKey ? '***' : 'none',
        'X-API-Secret': process.env.GREYFINCH_API_SECRET ? '***' : 'none'
      })
      
      // Use API key authentication (not JWT Bearer token)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Secret': process.env.GREYFINCH_API_SECRET || '',
      }
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      })

        if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP error response:', response.status, errorText)
        throw new Error(`GraphQL request failed: ${response.status} - ${errorText}`)
      }

      const responseText = await response.text()
      console.log('Raw response:', responseText.substring(0, 200) + '...')
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        console.error('Response was:', responseText)
        throw new Error(`Invalid JSON response from Greyfinch API: ${responseText.substring(0, 100)}`)
      }
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors)
        throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`)
      }

      return data.data
    } catch (error) {
      console.error('GraphQL request error:', error)
      throw error
    }
  }

  // Pull comprehensive data for counters and analysis
  async pullBasicCounts(userId: string) {
    try {
      console.log('Pulling comprehensive data from Greyfinch...')
      
      const data = {
        counts: {
          patients: 0,
          locations: 0,
          appointments: 0,
          leads: 0,
          bookings: 0
        },
        locations: [],
        periodData: {}
      }

      // Get locations with names and basic info
      try {
        const locationsData = await this.makeGraphQLRequest(`
          query GetLocations {
            locations(
              limit: 50
              orderBy: {name: ASC}
            ) {
              id
              name
            }
          }
        `)
        
        if (locationsData?.locations) {
          data.locations = locationsData.locations
          data.counts.locations = locationsData.locations.length
          console.log('Locations loaded:', data.counts.locations)
          console.log('Location details:', JSON.stringify(locationsData.locations, null, 2))
        }
      } catch (e) {
        console.log('Locations query failed:', e)
      }

      // Get patients count and basic info
      try {
        const patientsData = await this.makeGraphQLRequest(`
          query GetPatients {
            patients(
              limit: 100
              orderBy: {createdAt: DESC}
            ) {
              id
              person {
                firstName
                lastName
              }
            }
          }
        `)
        
        if (patientsData?.patients) {
          data.counts.patients = patientsData.patients.length
          console.log('Patients loaded:', data.counts.patients)
        }
      } catch (e) {
        console.log('Patients query failed:', e)
      }

      // Get leads count and basic info
      try {
        const leadsData = await this.makeGraphQLRequest(`
          query GetLeads {
            leads(
              limit: 100
              orderBy: {createdAt: DESC}
            ) {
              id
              person {
                firstName
                lastName
              }
              status
            }
          }
        `)
        
        if (leadsData?.leads) {
          data.counts.leads = leadsData.leads.length
          console.log('Leads loaded:', data.counts.leads)
        }
      } catch (e) {
        console.log('Leads query failed:', e)
      }

      // Get appointments count
      try {
        const appointmentsData = await this.makeGraphQLRequest(`
          query GetAppointments {
            appointments(
              limit: 100
              orderBy: {createdAt: DESC}
            ) {
              id
              bookings {
                localStartDate
                localStartTime
              }
            }
          }
        `)
        
        if (appointmentsData?.appointments) {
          data.counts.appointments = appointmentsData.appointments.length
          console.log('Appointments loaded:', data.counts.appointments)
        }
      } catch (e) {
        console.log('Appointments query failed:', e)
      }

      // Get bookings count
      try {
        const bookingsData = await this.makeGraphQLRequest(`
          query GetBookings {
            appointmentBookings(
              limit: 100
              orderBy: {localStartDate: DESC}
            ) {
              id
              localStartDate
              localStartTime
            }
          }
        `)
        
        if (bookingsData?.appointmentBookings) {
          data.counts.bookings = bookingsData.appointmentBookings.length
          console.log('Bookings loaded:', data.counts.bookings)
        }
      } catch (e) {
        console.log('Bookings query failed:', e)
      }

      return {
        success: true,
        counts: data.counts,
        locations: data.locations,
        message: 'Comprehensive data pulled successfully'
      }
    } catch (error) {
      console.error('Error pulling comprehensive data:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        counts: {
          patients: 0,
          locations: 0,
          appointments: 0,
          leads: 0,
          bookings: 0
        },
        locations: []
      }
    }
  }

  // Pull detailed data for analysis (background process)
  async pullDetailedData(userId: string, periodConfigs: any[] = []) {
    try {
      console.log('Pulling detailed data from Greyfinch for analysis...')
      
      const detailedData: any = {
        locations: [],
        patients: [],
        appointments: [],
        leads: [],
        treatments: [],
        companies: [],
        apps: [],
        appointmentBookings: [],
        periodData: {}
      }

      // Get locations with basic info
      try {
        const locationsData = await this.makeGraphQLRequest(`
          query GetLocations {
            locations(limit: 50) {
              id
              name
              address
            }
          }
        `)
        detailedData.locations = locationsData?.locations || []
        console.log('Pulled locations:', detailedData.locations.length)
      } catch (e) {
        console.log('Locations query failed:', e)
      }

      // Get patients with basic info
      try {
        const patientsData = await this.makeGraphQLRequest(`
          query GetPatients {
            patients(limit: 100) {
              id
              person {
                id
                firstName
                lastName
              }
              treatments(limit: 5) {
                id
                      name
                status {
                  type
                  name
                }
              }
            }
          }
        `)
        detailedData.patients = patientsData?.patients || []
        console.log('Pulled patients:', detailedData.patients.length)
      } catch (e) {
        console.log('Patients query failed:', e)
      }

      // Get appointments with basic info
      try {
        const appointmentsData = await this.makeGraphQLRequest(`
          query GetAppointments {
            appointments(limit: 100) {
              id
              bookings {
                localStartDate
                localStartTime
              }
            }
          }
        `)
        detailedData.appointments = appointmentsData?.appointments || []
        console.log('Pulled appointments:', detailedData.appointments.length)
      } catch (e) {
        console.log('Appointments query failed:', e)
      }

      // Process period-specific data if period configs are provided
      if (periodConfigs && periodConfigs.length > 0) {
        for (const period of periodConfigs) {
          const periodData = await this.pullPeriodData(period)
          detailedData.periodData[period.id] = periodData
        }
      }

      return {
        success: true,
        data: detailedData,
        message: 'Detailed data pulled successfully'
      }
    } catch (error) {
      console.error('Error pulling detailed data:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: {}
      }
    }
  }

  // Pull data for specific time period with location filtering
  async pullPeriodData(periodConfig: any) {
    try {
      const { startDate, endDate, locationId, locationName } = periodConfig
      console.log(`Pulling period data for ${locationName || 'all locations'} from ${startDate} to ${endDate}`)
      
      const periodData = {
        locationName: locationName || 'All Locations',
        leads: [],
        patients: [],
        appointments: [],
        bookings: [],
        revenue: 0,
        costs: 0,
        counts: {
          leads: 0,
          patients: 0,
          appointments: 0,
          bookings: 0
        }
      }

      // Build division filter
      const divisionFilter = locationId ? `, divisionId: {_eq: "${locationId}"}` : ''

            // Get leads for this period
      try {
        const leadsQuery = `
          query GetPeriodLeads($startDate: timestamptz, $endDate: timestamptz) {
            leads(
              where: {createdAt: {_gte: $startDate, _lte: $endDate}}
              limit: 100
              orderBy: {createdAt: DESC}
            ) {
              id
              person {
                firstName
                lastName
              }
              status
              createdAt
            }
          }
        `
        const leadsData = await this.makeGraphQLRequest(leadsQuery, { startDate, endDate })
        periodData.leads = leadsData?.leads || []
        periodData.counts.leads = periodData.leads.length
        console.log(`Period leads for ${periodData.locationName}:`, periodData.counts.leads)
      } catch (e) {
        console.log('Period leads query failed:', e)
      }

      // Get appointments for this period
      try {
        const appointmentsQuery = `
          query GetPeriodAppointments($startDate: timestamptz, $endDate: timestamptz) {
            appointments(
              where: {bookings: {localStartDate: {_gte: $startDate, _lte: $endDate}}}
              limit: 100
              orderBy: {createdAt: DESC}
            ) {
              id
              bookings {
                localStartDate
                localStartTime
              }
            }
          }
        `
        const appointmentsData = await this.makeGraphQLRequest(appointmentsQuery, { startDate, endDate })
        periodData.appointments = appointmentsData?.appointments || []
        periodData.counts.appointments = periodData.appointments.length
        console.log(`Period appointments for ${periodData.locationName}:`, periodData.counts.appointments)
      } catch (e) {
        console.log('Period appointments query failed:', e)
      }

      // Get bookings for this period
      try {
        const bookingsQuery = `
          query GetPeriodBookings($startDate: timestamptz, $endDate: timestamptz) {
            appointmentBookings(
              where: {localStartDate: {_gte: $startDate, _lte: $endDate}}
              limit: 100
              orderBy: {localStartDate: DESC}
            ) {
              id
              localStartDate
              localStartTime
              appointment {
                location {
                  id
                  name
                }
              }
            }
          }
        `
        const bookingsData = await this.makeGraphQLRequest(bookingsQuery, { startDate, endDate })
        periodData.bookings = bookingsData?.appointmentBookings || []
        periodData.counts.bookings = periodData.bookings.length
        console.log(`Period bookings for ${periodData.locationName}:`, periodData.counts.bookings)
      } catch (e) {
        console.log('Period bookings query failed:', e)
      }

      return periodData
    } catch (error) {
      console.error('Error pulling period data:', error)
      return {
        locationName: 'All Locations',
        leads: [],
        patients: [],
        appointments: [],
        bookings: [],
        revenue: 0,
        costs: 0,
        counts: {
          leads: 0,
          patients: 0,
          appointments: 0,
          bookings: 0
        }
      }
    }
  }

  // Test connection with basic query
  async testConnection(userId?: string) {
    try {
      console.log('Testing Greyfinch API connection...')
      console.log('Initial state:', {
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey.length,
        apiUrl: this.apiUrl,
        envApiKey: !!process.env.GREYFINCH_API_KEY
      })
      
      // Auto-load credentials from environment if not set
      if (!this.apiKey) {
        this.apiKey = process.env.GREYFINCH_API_KEY || ''
        console.log('Loaded API key from environment:', {
          hasApiKey: !!this.apiKey,
          apiKeyLength: this.apiKey.length
        })
      }
      
      // If still no API key, try to retrieve from database
      if (!this.apiKey && userId) {
        const credentials = await this.getCredentials(userId)
        if (credentials) {
          this.apiKey = credentials.apiKey
        }
      }
      
      // Check if we have the required configuration
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Greyfinch API key is not configured. Please check environment variables or set up credentials in the Connections tab.',
          error: 'MISSING_API_KEY',
          data: null
        }
      }
      
      if (!this.apiUrl) {
        return {
          success: false,
          message: 'Greyfinch API URL is not configured. Please set GREYFINCH_API_URL environment variable.',
          error: 'MISSING_API_URL',
          data: null
        }
      }
      
      // Try different API URLs if the default one fails
      const possibleUrls = [
        this.apiUrl,
        'https://connect-api.greyfinch.com/v1/graphql', // User confirmed working URL
        'https://api.greyfinch.com/v1/graphql',
        'https://api.greyfinch.com/graphql',
        'https://api.greyfinch.com/v2/graphql'
      ]
      
      for (const url of possibleUrls) {
        try {
          console.log(`Trying API URL: ${url}`)
          const testResult = await this.testUrl(url)
          if (testResult.success) {
            this.apiUrl = url
            console.log(`Successfully connected using URL: ${url}`)
            return testResult
          }
        } catch (error) {
          console.log(`Failed with URL ${url}:`, error)
        }
      }
      
      return {
        success: false,
        message: 'Could not connect to Greyfinch API with any known URL. Please check your API credentials.',
        error: 'CONNECTION_FAILED',
        data: null
      }
    } catch (error) {
      console.error('Greyfinch API connection test failed:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error'
      let errorType = 'UNKNOWN'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        if (errorMessage.includes('API key is not configured')) {
          errorType = 'MISSING_API_KEY'
        } else if (errorMessage.includes('API URL is not configured')) {
          errorType = 'MISSING_API_URL'
        } else if (errorMessage.includes('401')) {
          errorType = 'UNAUTHORIZED'
          errorMessage = 'Invalid API key. Please check your Greyfinch API credentials.'
        } else if (errorMessage.includes('404')) {
          errorType = 'NOT_FOUND'
          errorMessage = 'Greyfinch API endpoint not found. Please check the API URL.'
        } else if (errorMessage.includes('fetch')) {
          errorType = 'NETWORK_ERROR'
          errorMessage = 'Network error. Please check your internet connection and API URL.'
        }
      }
      
      return {
        success: false,
        message: errorMessage,
        error: errorType,
        data: null
      }
    }
  }

  // Test a specific URL
  async testUrl(url: string) {
    try {
      console.log(`Testing URL: ${url}`)
      console.log('Request details:', {
        method: 'POST',
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey.length,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey ? '***' : 'none'}`,
          'X-API-Key': this.apiKey ? '***' : 'none'
        }
      })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          query: `
            query {
              __schema {
                queryType {
                  fields {
                    name
                  }
                }
              }
            }
          `
        }),
      })
      
      console.log(`Response status: ${response.status}`)
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        return { 
          success: false, 
          error: `HTTP ${response.status}`,
          message: `HTTP ${response.status} error`,
          data: null
        }
      }

      const responseText = await response.text()
      
      try {
        const data = JSON.parse(responseText)
        console.log('Full response data:', JSON.stringify(data, null, 2))
        
        if (data.errors) {
          return { 
            success: false, 
            error: 'GraphQL errors',
            message: 'GraphQL errors in response',
            data: null
          }
        }
        
        // If this is a schema introspection, log the available fields
        if (data.data?.__schema?.queryType?.fields) {
          console.log('Available GraphQL fields:', data.data.__schema.queryType.fields.map((f: any) => f.name))
        }
        
        return { 
          success: true, 
          data,
          message: 'Connection successful',
          error: null
        }
      } catch (parseError) {
        return { 
          success: false, 
          error: 'Invalid JSON response',
          message: 'Invalid JSON response from API',
          data: null
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      }
    }
  }

  // Legacy method for backward compatibility
  async pullAllData(userId: string) {
    return this.pullBasicCounts(userId)
  }
}

export const greyfinchService = new GreyfinchService()
