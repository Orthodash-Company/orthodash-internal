import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export class GreyfinchService {
  private apiUrl: string
  private apiKey: string
  private apiSecret: string

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

  // Update credentials (for backward compatibility)
  updateCredentials(apiKey: string, apiSecret?: string) {
    this.apiKey = apiKey
    if (apiSecret) {
      this.apiSecret = apiSecret
    }
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

      // Get locations
      try {
        const locationsData = await this.makeGraphQLRequest(`
          query GetLocations {
            locations {
              id
              name
            }
          }
        `)
        detailedData.locations = locationsData?.locations || []
        console.log('Pulled locations:', detailedData.locations.length)
      } catch (e) {
        console.log('Locations query failed:', e)
      }

      // Get patients
      try {
        const patientsData = await this.makeGraphQLRequest(`
          query GetPatients {
            patients {
              id
            }
          }
        `)
        detailedData.patients = patientsData?.patients || []
        console.log('Pulled patients:', detailedData.patients.length)
      } catch (e) {
        console.log('Patients query failed:', e)
      }

      // Get appointments
      try {
        const appointmentsData = await this.makeGraphQLRequest(`
          query GetAppointments {
            appointments {
              id
            }
          }
        `)
        detailedData.appointments = appointmentsData?.appointments || []
        console.log('Pulled appointments:', detailedData.appointments.length)
      } catch (e) {
        console.log('Appointments query failed:', e)
      }

      // Get leads
      try {
        const leadsData = await this.makeGraphQLRequest(`
          query GetLeads {
            leads {
              id
            }
          }
        `)
        detailedData.leads = leadsData?.leads || []
        console.log('Pulled leads:', detailedData.leads.length)
      } catch (e) {
        console.log('Leads query failed:', e)
      }

      // Get bookings
      try {
        const bookingsData = await this.makeGraphQLRequest(`
          query GetBookings {
            appointmentBookings {
              id
            }
          }
        `)
        detailedData.bookings = bookingsData?.appointmentBookings || []
        console.log('Pulled bookings:', detailedData.bookings.length)
      } catch (e) {
        console.log('Bookings query failed:', e)
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

  // Simple GraphQL request - just use API key as Bearer token
  private async makeGraphQLRequest(query: string, variables: any = {}) {
    try {
      console.log('Making GraphQL request to Greyfinch...')
      
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

      // Get patient count
      try {
        const patientCountQuery = await this.makeGraphQLRequest(`
          query GetPatientCount {
            patients {
              id
            }
          }
        `)
        if (patientCountQuery?.patients) {
          data.counts.patients = patientCountQuery.patients.length
          console.log('Patient count loaded:', data.counts.patients)
        }
      } catch (e) {
        console.log('Patient count query failed:', e)
      }

      // Get lead count
      try {
        const leadCountQuery = await this.makeGraphQLRequest(`
          query GetLeadCount {
            leads {
              id
            }
          }
        `)
        if (leadCountQuery?.leads) {
          data.counts.leads = leadCountQuery.leads.length
          console.log('Lead count loaded:', data.counts.leads)
        }
      } catch (e) {
        console.log('Lead count query failed:', e)
      }

      // Get appointment count
      try {
        const appointmentCountQuery = await this.makeGraphQLRequest(`
          query GetAppointmentCount {
            appointments {
              id
            }
          }
        `)
        if (appointmentCountQuery?.appointments) {
          data.counts.appointments = appointmentCountQuery.appointments.length
          console.log('Appointment count loaded:', data.counts.appointments)
        }
      } catch (e) {
        console.log('Appointment count query failed:', e)
      }

      // Get booking count
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
      }

      // Get locations
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
          data.locations = locationQuery.locations
          data.counts.locations = locationQuery.locations.length
          console.log('Locations loaded:', data.counts.locations)
        }
      } catch (e) {
        console.log('Location query failed:', e)
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
      
      // Simple test query
      const testResult = await this.makeGraphQLRequest(`
        query TestConnection {
          patients {
            id
          }
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
