import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { GreyfinchSchemaUtils, GREYFINCH_QUERIES, GreyfinchErrorHandler } from './greyfinch-schema'

export class GreyfinchService {
  private apiUrl: string
  private apiKey: string
  private apiSecret: string
  private jwtToken: string | null = null

  constructor() {
    this.apiUrl = 'https://connect-api.greyfinch.com/v1/graphql'
    this.apiKey = process.env.GREYFINCH_API_KEY || ''
    this.apiSecret = process.env.GREYFINCH_API_SECRET || ''
    
    console.log('GreyfinchService initialized:', {
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      hasApiSecret: !!this.apiSecret
    })
  }

  // Get JWT token by logging in with API key and secret using GraphQL mutation
  private async getJWTToken(): Promise<string | null> {
    try {
      console.log('Getting JWT token from Greyfinch using GraphQL mutation...')
      console.log('API Key length:', this.apiKey.length)
      console.log('API Secret length:', this.apiSecret.length)
      console.log('API Key prefix:', this.apiKey.substring(0, 8) + '...')
      
      // Use the correct GraphQL mutation for login
      const loginMutation = `
        mutation docsApiLogin($key: String!, $secret: String!) {
          apiLogin(key: $key, secret: $secret) {
            status
            accessToken
            accessTokenExpiresIn
          }
        }
      `
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: loginMutation,
          variables: {
            key: this.apiKey,
            secret: this.apiSecret
          }
        }),
      })

      console.log(`Login response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Login failed:', response.status, errorText)
        console.error('Response headers:', Object.fromEntries(response.headers.entries()))
        return null
      }

      const data = await response.json()
      console.log('Login response:', JSON.stringify(data, null, 2))

      if (data.data?.apiLogin?.accessToken) {
        this.jwtToken = data.data.apiLogin.accessToken
        console.log('Successfully obtained access token')
        return data.data.apiLogin.accessToken
      }

      console.log('No access token found in login response')
      return null
    } catch (error) {
      console.error('Error getting JWT token:', error)
      return null
    }
  }

  // Update credentials (for backward compatibility)
  updateCredentials(apiKey: string, apiSecret?: string) {
    this.apiKey = apiKey
    if (apiSecret) {
      this.apiSecret = apiSecret
    }
    this.jwtToken = null // Clear existing token
    console.log('Greyfinch credentials updated')
  }

  // Store credentials in database (for backward compatibility)
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

  // Retrieve credentials from database (for backward compatibility)
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
        this.apiSecret = config.api_secret
        
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

  // Pull detailed data (for backward compatibility)
  async pullDetailedData(userId: string, periodConfigs: any[] = []) {
    try {
      console.log('Pulling detailed data from Greyfinch...')
      
      const detailedData: any = {
        locations: [],
        patients: [],
        appointments: [],
        leads: [],
        bookings: [],
        periodData: {}
      }

      // Get locations with proper field naming
      try {
        const locationsData = await this.makeGraphQLRequest(GREYFINCH_QUERIES.GET_LOCATIONS)
        detailedData.locations = locationsData?.locations || []
        console.log('Pulled locations:', detailedData.locations.length)
      } catch (e) {
        console.log('Locations query failed:', e)
        if (GreyfinchErrorHandler.isFieldError(e)) {
          console.log('Field error detected, attempting to fix...')
        }
      }

      // Get patients with proper field naming
      try {
        const patientsData = await this.makeGraphQLRequest(GREYFINCH_QUERIES.GET_PATIENTS)
        detailedData.patients = patientsData?.patients || []
        console.log('Pulled patients:', detailedData.patients.length)
      } catch (e) {
        console.log('Patients query failed:', e)
        if (GreyfinchErrorHandler.isFieldError(e)) {
          const fieldName = GreyfinchErrorHandler.getFieldNameFromError(e)
          if (fieldName) {
            const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
            console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
          }
        }
      }

      // Get appointments with proper field naming
      try {
        const appointmentsData = await this.makeGraphQLRequest(GREYFINCH_QUERIES.GET_APPOINTMENTS)
        detailedData.appointments = appointmentsData?.appointments || []
        console.log('Pulled appointments:', detailedData.appointments.length)
      } catch (e) {
        console.log('Appointments query failed:', e)
        if (GreyfinchErrorHandler.isFieldError(e)) {
          const fieldName = GreyfinchErrorHandler.getFieldNameFromError(e)
          if (fieldName) {
            const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
            console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
          }
        }
      }

      // Get leads with proper field naming
      try {
        const leadsData = await this.makeGraphQLRequest(GREYFINCH_QUERIES.GET_LEADS)
        detailedData.leads = leadsData?.leads || []
        console.log('Pulled leads:', detailedData.leads.length)
      } catch (e) {
        console.log('Leads query failed:', e)
        if (GreyfinchErrorHandler.isFieldError(e)) {
          const fieldName = GreyfinchErrorHandler.getFieldNameFromError(e)
          if (fieldName) {
            const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
            console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
          }
        }
      }

      // Get bookings with proper field naming
      try {
        const bookingsData = await this.makeGraphQLRequest(GREYFINCH_QUERIES.GET_BOOKINGS)
        detailedData.bookings = bookingsData?.appointmentBookings || []
        console.log('Pulled bookings:', detailedData.bookings.length)
      } catch (e) {
        console.log('Bookings query failed:', e)
        if (GreyfinchErrorHandler.isFieldError(e)) {
          const fieldName = GreyfinchErrorHandler.getFieldNameFromError(e)
          if (fieldName) {
            const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
            console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
          }
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

  // Simple GraphQL request - try API key directly first, then JWT if needed
  async makeGraphQLRequest(query: string, variables: any = {}) {
    try {
      console.log('Making GraphQL request to Greyfinch...')
      
      // Try with API key in X-API-Key header
      let response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      // If that fails, try to get JWT token
      if (!response.ok && response.status === 401) {
        console.log('API key failed, trying JWT token...')
        if (!this.jwtToken) {
          this.jwtToken = await this.getJWTToken()
          if (!this.jwtToken) {
            throw new Error('Failed to obtain JWT token')
          }
        }
        
        response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.jwtToken}`,
          },
          body: JSON.stringify({
            query,
            variables,
          }),
        })
      }

      console.log(`Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP error response:', response.status, errorText)
        throw new Error(`GraphQL request failed: ${response.status} - ${errorText}`)
      }

      const responseText = await response.text()
      console.log('Raw response:', responseText.substring(0, 500) + '...')
      
      const data = JSON.parse(responseText)
      
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

  // Get basic counts - simple and direct
  async pullBasicCounts(userId: string) {
    try {
      console.log('Pulling basic counts from Greyfinch...')
      
      const data = {
        counts: {
          patients: 0,
          locations: 0,
          appointments: 0,
          leads: 0,
          bookings: 0
        },
        locations: []
      }

      // Get patient count - query the patients table and count rows
      try {
        const patientQuery = await this.makeGraphQLRequest(`
          query GetPatients {
            patients {
              id
            }
          }
        `)
        if (patientQuery?.patients) {
          data.counts.patients = patientQuery.patients.length
          console.log('Patient count loaded from patients table:', data.counts.patients)
        }
      } catch (e) {
        console.log('Patient count query failed:', e)
        // Try alternative table names
        const tableNames = ['patient', 'patient_table', 'patient_records', 'patient_data']
        for (const tableName of tableNames) {
          try {
            const countQuery = await this.makeGraphQLRequest(`
              query Get${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Count {
                ${tableName} {
                  id
                }
              }
            `)
            if (countQuery?.[tableName]) {
              data.counts.patients = countQuery[tableName].length
              console.log(`Patient count loaded from ${tableName}:`, data.counts.patients)
              break
            }
          } catch (e2) {
            console.log(`${tableName} query failed:`, e2)
          }
        }
        // If all failed, set to 0
        if (data.counts.patients === 0) {
          console.log('All patient count queries failed, setting to 0')
          data.counts.patients = 0
        }
      }

      // Get lead count - query the leads table and count rows
      try {
        const leadQuery = await this.makeGraphQLRequest(`
          query GetLeads {
            leads {
              id
            }
          }
        `)
        if (leadQuery?.leads) {
          data.counts.leads = leadQuery.leads.length
          console.log('Lead count loaded from leads table:', data.counts.leads)
        }
      } catch (e) {
        console.log('Lead count query failed:', e)
        // Try alternative table names
        const tableNames = ['lead', 'lead_table', 'lead_records', 'lead_data']
        for (const tableName of tableNames) {
          try {
            const countQuery = await this.makeGraphQLRequest(`
              query Get${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Count {
                ${tableName} {
                  id
                }
              }
            `)
            if (countQuery?.[tableName]) {
              data.counts.leads = countQuery[tableName].length
              console.log(`Lead count loaded from ${tableName}:`, data.counts.leads)
              break
            }
          } catch (e2) {
            console.log(`${tableName} query failed:`, e2)
          }
        }
        // If all failed, set to 0
        if (data.counts.leads === 0) {
          console.log('All lead count queries failed, setting to 0')
          data.counts.leads = 0
        }
      }

      // Get appointment count - query the appointments table and count rows
      try {
        const appointmentQuery = await this.makeGraphQLRequest(`
          query GetAppointments {
            appointments {
              id
            }
          }
        `)
        if (appointmentQuery?.appointments) {
          data.counts.appointments = appointmentQuery.appointments.length
          console.log('Appointment count loaded from appointments table:', data.counts.appointments)
        }
      } catch (e) {
        console.log('Appointment count query failed:', e)
        // Try alternative table names
        const tableNames = ['appointment', 'appointment_table', 'appointment_records', 'appointment_data']
        for (const tableName of tableNames) {
          try {
            const countQuery = await this.makeGraphQLRequest(`
              query Get${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Count {
                ${tableName} {
                  id
                }
              }
            `)
            if (countQuery?.[tableName]) {
              data.counts.appointments = countQuery[tableName].length
              console.log(`Appointment count loaded from ${tableName}:`, data.counts.appointments)
              break
            }
          } catch (e2) {
            console.log(`${tableName} query failed:`, e2)
          }
        }
        // If all failed, set to 0
        if (data.counts.appointments === 0) {
          console.log('All appointment count queries failed, setting to 0')
          data.counts.appointments = 0
        }
      }

      // Get booking count with proper field naming
      try {
        const bookingCountQuery = await this.makeGraphQLRequest(`
          query GetBookingCount {
            appointmentBookings {
              id
            }
          }
        `)
        if (bookingCountQuery?.appointmentBookings) {
          data.counts.bookings = bookingCountQuery.appointmentBookings.length
          console.log('Booking count loaded:', data.counts.bookings)
        }
      } catch (e) {
        console.log('Booking count query failed:', e)
        if (GreyfinchErrorHandler.isFieldError(e)) {
          const fieldName = GreyfinchErrorHandler.getFieldNameFromError(e)
          if (fieldName) {
            const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
            console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
          }
        }
      }

      // Get locations - query the locations table and count rows
      try {
        const locationQuery = await this.makeGraphQLRequest(`
          query GetLocations {
            locations {
              id
              name
            }
          }
        `)
        if (locationQuery?.locations) {
          data.counts.locations = locationQuery.locations.length
          data.locations = locationQuery.locations
          console.log('Locations loaded from locations table:', data.counts.locations)
        }
      } catch (e) {
        console.log('Location query failed:', e)
        // Try alternative table names
        const tableNames = ['location', 'location_table', 'location_records', 'location_data']
        for (const tableName of tableNames) {
          try {
            const countQuery = await this.makeGraphQLRequest(`
              query Get${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Count {
                ${tableName} {
                  id
                  name
                }
              }
            `)
            if (countQuery?.[tableName]) {
              data.counts.locations = countQuery[tableName].length
              data.locations = countQuery[tableName]
              console.log(`Locations loaded from ${tableName}:`, data.counts.locations)
              break
            }
          } catch (e2) {
            console.log(`${tableName} query failed:`, e2)
          }
        }
        // If all failed, set to 0
        if (data.counts.locations === 0) {
          console.log('All location count queries failed, setting to 0')
          data.counts.locations = 0
          data.locations = []
        }
      }

      return {
        success: true,
        counts: data.counts,
        locations: data.locations,
        message: 'Basic counts retrieved successfully'
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
          bookings: 0
        },
        locations: []
      }
    }
  }

  // Test connection - simple
  async testConnection(userId?: string) {
    try {
      console.log('Testing Greyfinch API connection...')
      
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Greyfinch API key is not configured.',
          error: 'MISSING_API_KEY',
          data: null
        }
      }
      
      // Test with a simple query to see what's available
      const testResult = await this.makeGraphQLRequest(`
        query TestConnection {
          __typename
        }
      `)
      
      return {
        success: true,
        data: testResult,
        message: 'Successfully connected to Greyfinch API',
        error: null
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        error: 'CONNECTION_FAILED',
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
