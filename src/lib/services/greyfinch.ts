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
