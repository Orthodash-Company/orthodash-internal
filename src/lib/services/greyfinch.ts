import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { GREYFINCH_MUTATIONS, GREYFINCH_QUERIES, GREYFINCH_QUERY_BUILDERS } from './greyfinch-schema'

type BasicCounts = {
  patients: number
  locations: number
  appointments: number
  leads: number
  bookings: number
}

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

type LocationRow = {
  id: string
  name: string
}

const DEFAULT_BASIC_COUNTS: BasicCounts = {
  patients: 0,
  locations: 0,
  appointments: 0,
  leads: 0,
  bookings: 0,
}

const RESOURCE_FALLBACKS = {
  patients: ['patients', 'patient', 'patient_table', 'patient_records', 'patient_data'],
  leads: ['leads', 'lead', 'lead_table', 'lead_records'],
  appointments: ['appointments', 'appointment', 'appointment_table', 'appointment_records', 'appointment_data'],
  bookings: ['appointmentBookings'],
  locations: ['locations', 'location', 'location_table', 'location_records', 'location_data'],
} as const

export class GreyfinchService {
  private readonly apiUrl: string
  private apiKey: string
  private apiSecret: string
  private jwtToken: string | null = null
  private readonly requestTimeoutMs: number

  constructor() {
    this.apiUrl = 'https://connect-api.greyfinch.com/v1/graphql'
    this.apiKey = process.env.GREYFINCH_API_KEY || ''
    this.apiSecret = process.env.GREYFINCH_API_SECRET || ''
    this.requestTimeoutMs = 15000
  }

  private createTimeoutController() {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs)

    return {
      controller,
      cleanup: () => clearTimeout(timeoutId),
    }
  }

  private async parseGraphQLResponse<T>(response: Response): Promise<T> {
    const responseText = await response.text()

    let data: GraphQLResponse<T>
    try {
      data = JSON.parse(responseText) as GraphQLResponse<T>
    } catch {
      throw new Error('Invalid JSON response from Greyfinch')
    }

    if (data.errors?.length) {
      throw new Error(`GraphQL errors: ${data.errors.map((error) => error.message || 'Unknown GraphQL error').join(', ')}`)
    }

    if (!data.data) {
      throw new Error('Missing data in Greyfinch response')
    }

    return data.data
  }

  private async postGraphQL<T>(body: { query: string; variables?: Record<string, unknown> }, jwtToken?: string): Promise<T> {
    const { controller, cleanup } = this.createTimeoutController()

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`GraphQL request failed: ${response.status} - ${errorText}`)
      }

      return await this.parseGraphQLResponse<T>(response)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Greyfinch request timed out after ${this.requestTimeoutMs / 1000} seconds`)
      }
      throw error
    } finally {
      cleanup()
    }
  }

  private async ensureJwtToken() {
    if (this.jwtToken) {
      return this.jwtToken
    }

    this.jwtToken = await this.getJWTToken()
    if (!this.jwtToken) {
      throw new Error('Failed to obtain JWT token')
    }

    return this.jwtToken
  }

  private async fetchIdList(resource: string): Promise<Array<{ id: string }>> {
    const result = await this.makeGraphQLRequest(GREYFINCH_QUERY_BUILDERS.resourceIds(resource))
    return Array.isArray(result?.[resource]) ? result[resource] : []
  }

  private async fetchResourceWithFallbacks(resourceNames: readonly string[]) {
    for (const resourceName of resourceNames) {
      try {
        const rows = await this.fetchIdList(resourceName)
        return { resourceName, rows }
      } catch (error) {
        console.log(`${resourceName} query failed`, error)
      }
    }

    return {
      resourceName: resourceNames[0],
      rows: [],
    }
  }

  private async fetchLocationsWithFallbacks(resourceNames: readonly string[]): Promise<LocationRow[]> {
    for (const resourceName of resourceNames) {
      try {
        const result = await this.makeGraphQLRequest(GREYFINCH_QUERY_BUILDERS.namedResource(resourceName))
        const rows = Array.isArray(result?.[resourceName]) ? result[resourceName] : []
        return rows
      } catch (error) {
        console.log(`${resourceName} query failed`, error)
      }
    }

    return []
  }

  // Get JWT token by logging in with API key and secret using GraphQL mutation
  private async getJWTToken(): Promise<string | null> {
    try {
      const data = await this.postGraphQL<{
        apiLogin?: {
          accessToken?: string
        }
      }>({
        query: GREYFINCH_MUTATIONS.LOGIN,
        variables: {
          key: this.apiKey,
          secret: this.apiSecret,
        },
      })

      if (data.apiLogin?.accessToken) {
        this.jwtToken = data.apiLogin.accessToken
        console.log('Successfully obtained access token')
        return data.apiLogin.accessToken
      }

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
        this.apiKey = String(config.api_key ?? '')
        this.apiSecret = String(config.api_secret ?? '')
        
        console.log('Greyfinch credentials retrieved from database for user:', userId)
        return {
          apiKey: String(config.api_key ?? ''),
          apiSecret: String(config.api_secret ?? '')
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to retrieve Greyfinch credentials:', error)
      return null
    }
  }

  // Pull detailed data (for backward compatibility)
  async pullDetailedData(_userId: string, _periodConfigs: any[] = []) {
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

      const queries = [
        { key: 'locations', extract: (data: any) => data?.locations || [] },
        { key: 'patients', extract: (data: any) => data?.patients || [] },
        { key: 'appointments', extract: (data: any) => data?.appointments || [] },
        { key: 'leads', extract: (data: any) => data?.leads || [] },
        { key: 'bookings', extract: (data: any) => data?.appointmentBookings || [] },
      ] as const

      const analyticsData = await this.makeGraphQLRequest(GREYFINCH_QUERIES.GET_ANALYTICS_DATA)

      for (const query of queries) {
        try {
          detailedData[query.key] = query.extract(analyticsData)
          console.log(`Pulled ${query.key}:`, detailedData[query.key].length)
        } catch (error) {
          console.log(`${query.key} query failed:`, error)
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
      const jwtToken = await this.ensureJwtToken()
      return await this.postGraphQL<Record<string, any>>({ query, variables }, jwtToken)
    } catch (error) {
      console.error('GraphQL request error:', error)
      throw error
    }
  }

  // Get basic counts - simple and direct
  async pullBasicCounts(_userId: string) {
    try {
      console.log('Pulling basic counts from Greyfinch...')
      
      const data = {
        counts: { ...DEFAULT_BASIC_COUNTS } as BasicCounts,
        locations: [] as LocationRow[]
      }

      const [patientsResult, leadsResult, appointmentsResult, bookingsResult, locationsResult] = await Promise.all([
        this.fetchResourceWithFallbacks(RESOURCE_FALLBACKS.patients),
        this.fetchResourceWithFallbacks(RESOURCE_FALLBACKS.leads),
        this.fetchResourceWithFallbacks(RESOURCE_FALLBACKS.appointments),
        this.fetchResourceWithFallbacks(RESOURCE_FALLBACKS.bookings),
        this.fetchLocationsWithFallbacks(RESOURCE_FALLBACKS.locations),
      ])

      data.counts.patients = patientsResult.rows.length
      data.counts.leads = leadsResult.rows.length
      data.counts.appointments = appointmentsResult.rows.length
      data.counts.bookings = bookingsResult.rows.length
      data.counts.locations = locationsResult.length
      data.locations = locationsResult

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
        counts: { ...DEFAULT_BASIC_COUNTS },
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
      const testResult = await this.makeGraphQLRequest(GREYFINCH_QUERIES.TEST_CONNECTION)
      
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
