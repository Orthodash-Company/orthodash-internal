import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export class GreyfinchService {
  private apiUrl: string
  private apiKey: string

  constructor() {
    this.apiUrl = process.env.GREYFINCH_API_URL || 'https://api.greyfinch.com/graphql'
    this.apiKey = ''
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
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
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

      const data = await response.json()
      
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

  // Pull basic counts only (fast, safe)
  async pullBasicCounts(userId: string) {
    try {
      console.log('Pulling basic counts from Greyfinch...')
      
      const counts = {
        patients: 0,
        locations: 0,
        appointments: 0,
        leads: 0,
        treatments: 0,
        companies: 0,
        apps: 0,
        appointmentBookings: 0
      }

      // Get locations count
      try {
        const locationsData = await this.makeGraphQLRequest(`
          query GetLocationsCount {
            locations(limit: 1) {
              id
            }
          }
        `)
        counts.locations = locationsData?.locations?.length || 0
        console.log('Locations count:', counts.locations)
      } catch (e) {
        console.log('Locations query failed:', e)
      }

      // Get patients count
      try {
        const patientsData = await this.makeGraphQLRequest(`
          query GetPatientsCount {
            patients(limit: 1) {
              id
            }
          }
        `)
        counts.patients = patientsData?.patients?.length || 0
        console.log('Patients count:', counts.patients)
      } catch (e) {
        console.log('Patients query failed:', e)
      }

      // Get appointments count
      try {
        const appointmentsData = await this.makeGraphQLRequest(`
          query GetAppointmentsCount {
            appointments(limit: 1) {
              id
            }
          }
        `)
        counts.appointments = appointmentsData?.appointments?.length || 0
        console.log('Appointments count:', counts.appointments)
      } catch (e) {
        console.log('Appointments query failed:', e)
      }

      // Get leads count (using patients as leads for now)
      counts.leads = counts.patients

      return {
        success: true,
        counts,
        message: 'Basic counts pulled successfully'
      }
    } catch (error) {
      console.error('Error pulling basic counts:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        counts: {
          patients: 0,
          locations: 0,
          appointments: 0,
          leads: 0,
          treatments: 0,
          companies: 0,
          apps: 0,
          appointmentBookings: 0
        }
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

  // Pull data for specific time period
  async pullPeriodData(periodConfig: any) {
    try {
      const { startDate, endDate, locationId } = periodConfig
      
      const periodData = {
        leads: [],
        patients: [],
        appointments: [],
        revenue: 0,
        costs: 0
      }

      // Get leads/patients for this period
      try {
        const leadsQuery = `
          query GetPeriodLeads($startDate: timestamptz, $endDate: timestamptz) {
            patients(where: {createdAt: {_gte: $startDate, _lte: $endDate}}, limit: 50) {
              id
              person {
                firstName
                lastName
              }
              createdAt
            }
          }
        `
        const leadsData = await this.makeGraphQLRequest(leadsQuery, { startDate, endDate })
        periodData.leads = leadsData?.patients || []
      } catch (e) {
        console.log('Period leads query failed:', e)
      }

      // Get appointments for this period
      try {
        const appointmentsQuery = `
          query GetPeriodAppointments($startDate: timestamptz, $endDate: timestamptz) {
            appointments(where: {bookings: {localStartDate: {_gte: $startDate, _lte: $endDate}}}, limit: 50) {
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
      } catch (e) {
        console.log('Period appointments query failed:', e)
      }

      return periodData
    } catch (error) {
      console.error('Error pulling period data:', error)
      return {
        leads: [],
        patients: [],
        appointments: [],
        revenue: 0,
        costs: 0
      }
    }
  }

  // Test connection with basic query
  async testConnection(userId?: string) {
    try {
      console.log('Testing Greyfinch API connection...')
      
      // If no API key is set but userId is provided, try to retrieve from database
      if (!this.apiKey && userId) {
        const credentials = await this.getCredentials(userId)
        if (!credentials) {
          return {
            success: false,
            message: 'Greyfinch API key is not configured. Please set up your API credentials in the Connections tab.',
            error: 'MISSING_API_KEY'
          }
        }
      }
      
      // Check if we have the required configuration
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Greyfinch API key is not configured. Please set up your API credentials in the Connections tab.',
          error: 'MISSING_API_KEY'
        }
      }
      
      if (!this.apiUrl) {
        return {
          success: false,
          message: 'Greyfinch API URL is not configured. Please set GREYFINCH_API_URL environment variable.',
          error: 'MISSING_API_URL'
        }
      }
      
      const result = await this.makeGraphQLRequest(`
        query TestConnection {
          locations(limit: 1) {
            id
            name
          }
        }
      `)
      
      return {
        success: true,
        message: 'Greyfinch API connection successful',
        data: result
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
        error: errorType
      }
    }
  }

  // Legacy method for backward compatibility
  async pullAllData(userId: string) {
    return this.pullBasicCounts(userId)
  }
}

export const greyfinchService = new GreyfinchService()
