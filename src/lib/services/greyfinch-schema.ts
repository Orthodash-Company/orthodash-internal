import { greyfinchService } from './greyfinch'

// Greyfinch GraphQL API Field Naming Conventions
// Based on the v1.0 beta API documentation

export interface GreyfinchFieldInfo {
  name: string
  type: string
  description?: string
  isRequired: boolean
  isEnum: boolean
  enumValues?: string[]
}

export interface GreyfinchTypeInfo {
  name: string
  fields: GreyfinchFieldInfo[]
  description?: string
}

// Common field patterns in Greyfinch GraphQL API
export const GREYFINCH_FIELD_PATTERNS = {
  // Patient-related fields (camelCase)
  PATIENT_FIELDS: {
    id: 'uuid',
    firstName: 'String',
    lastName: 'String',
    middleName: 'String',
    birthDate: 'date',
    gender: 'Gender',
    title: 'Title',
    email: 'String',
    phone: 'String',
    address: 'String',
    primaryLocation: 'Location',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  },
  
  // Location-related fields
  LOCATION_FIELDS: {
    id: 'uuid',
    name: 'String',
    address: 'String',
    phone: 'String',
    email: 'String',
    isActive: 'Boolean',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  },
  
  // Appointment-related fields
  APPOINTMENT_FIELDS: {
    id: 'uuid',
    patientId: 'uuid',
    locationId: 'uuid',
    appointmentType: 'String',
    status: 'AppointmentStatus',
    scheduledDate: 'timestamp',
    actualDate: 'timestamp',
    duration: 'Integer',
    notes: 'String',
    revenue: 'Float',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  },
  
  // Lead-related fields
  LEAD_FIELDS: {
    id: 'uuid',
    firstName: 'String',
    lastName: 'String',
    email: 'String',
    phone: 'String',
    source: 'String',
    status: 'LeadStatus',
    locationId: 'uuid',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  },
  
  // Booking-related fields
  BOOKING_FIELDS: {
    id: 'uuid',
    appointmentId: 'uuid',
    startTime: 'timestamp',
    endTime: 'timestamp',
    localStartDate: 'timestamp',
    localStartTime: 'timestamp',
    timezone: 'String',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  },

  // Revenue/Production fields
  REVENUE_FIELDS: {
    id: 'uuid',
    amount: 'Float',
    appointmentId: 'uuid',
    patientId: 'uuid',
    locationId: 'uuid',
    date: 'timestamp',
    category: 'String',
    description: 'String',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  }
}

// Comprehensive GraphQL queries for real data extraction
export const GREYFINCH_QUERIES = {
  // Comprehensive analytics data query
  GET_ANALYTICS_DATA: `
    query GetAnalyticsData {
      locations {
        id
        name
        address
        isActive
        createdAt
        updatedAt
      }
      patients {
        id
        firstName
        lastName
        primaryLocation {
          id
          name
        }
        createdAt
        updatedAt
      }
      appointments {
        id
        patientId
        locationId
        appointmentType
        status
        scheduledDate
        actualDate
        duration
        revenue
        createdAt
        updatedAt
      }
      leads {
        id
        firstName
        lastName
        email
        phone
        source
        status
        locationId
        createdAt
        updatedAt
      }
      appointmentBookings {
        id
        appointmentId
        startTime
        endTime
        localStartDate
        localStartTime
        timezone
        createdAt
        updatedAt
      }
      revenue {
        id
        amount
        appointmentId
        patientId
        locationId
        date
        category
        description
        createdAt
        updatedAt
      }
    }
  `,

  // Simplified data query for basic counts
  GET_BASIC_COUNTS: `
    query GetBasicCounts {
      locations {
        id
        name
      }
      patients {
        id
        createdAt
      }
      appointments {
        id
        status
        scheduledDate
        revenue
        createdAt
      }
      leads {
        id
        source
        createdAt
      }
      appointmentBookings {
        id
        startTime
        createdAt
      }
    }
  `,

  // Revenue-focused query
  GET_REVENUE_DATA: `
    query GetRevenueData {
      appointments {
        id
        revenue
        scheduledDate
        actualDate
        status
        locationId
      }
      revenue {
        id
        amount
        date
        category
        locationId
      }
    }
  `,

  // Test connection query
  TEST_CONNECTION: `
    query TestConnection {
      __typename
    }
  `
}

// Utility functions for working with Greyfinch GraphQL API
export class GreyfinchSchemaUtils {
  
  /**
   * Validate field names against known patterns
   * Ensures proper camelCase usage
   */
  static validateFieldName(fieldName: string, type: string): boolean {
    const patterns = GREYFINCH_FIELD_PATTERNS as any
    const typeFields = patterns[`${type.toUpperCase()}_FIELDS`]
    
    if (!typeFields) {
      console.warn(`Unknown type: ${type}`)
      return true // Allow unknown types
    }
    
    return fieldName in typeFields
  }
  
  /**
   * Get field type information
   */
  static getFieldType(fieldName: string, type: string): string | null {
    const patterns = GREYFINCH_FIELD_PATTERNS as any
    const typeFields = patterns[`${type.toUpperCase()}_FIELDS`]
    
    if (!typeFields) {
      return null
    }
    
    return typeFields[fieldName] || null
  }
  
  /**
   * Convert snake_case to camelCase (for field name validation)
   */
  static toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  /**
   * Convert camelCase to snake_case (for database fields)
   */
  static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
  
  /**
   * Test the GraphQL connection
   */
  static async testConnection(): Promise<any> {
    try {
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.TEST_CONNECTION)
      return result
    } catch (error) {
      console.error('Connection test failed:', error)
      throw error
    }
  }
  
  /**
   * Get comprehensive analytics data
   */
  static async getAnalyticsData(): Promise<any> {
    try {
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_ANALYTICS_DATA)
      return result
    } catch (error) {
      console.error('Analytics data fetch failed:', error)
      throw error
    }
  }

  /**
   * Get basic count data
   */
  static async getBasicCounts(): Promise<any> {
    try {
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_BASIC_COUNTS)
      return result
    } catch (error) {
      console.error('Basic counts fetch failed:', error)
      throw error
    }
  }

  /**
   * Get revenue data
   */
  static async getRevenueData(): Promise<any> {
    try {
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_REVENUE_DATA)
      return result
    } catch (error) {
      console.error('Revenue data fetch failed:', error)
      throw error
    }
  }
  
  /**
   * Get available field names for known types
   */
  static getKnownTypeFields(typeName: string): string[] {
    const patterns = GREYFINCH_FIELD_PATTERNS as any
    const typeFields = patterns[`${typeName.toUpperCase()}_FIELDS`]
    
    if (!typeFields) {
      console.warn(`Unknown type: ${typeName}`)
      return []
    }
    
    return Object.keys(typeFields)
  }
  
  /**
   * Validate a GraphQL query against known patterns
   */
  static validateQuery(query: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check for common field naming issues
    const snakeCasePattern = /\b[a-z]+_[a-z]+\b/g
    const matches = query.match(snakeCasePattern)
    
    if (matches) {
      matches.forEach(match => {
        const camelCase = this.toCamelCase(match)
        errors.push(`Field "${match}" should be "${camelCase}" (camelCase)`)
      })
    }
    
    // Check for proper GraphQL syntax
    if (!query.includes('query') && !query.includes('mutation')) {
      errors.push('Query must start with "query" or "mutation"')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Generate a proper GraphQL query with field validation
   */
  static generateQuery(
    operation: 'query' | 'mutation',
    name: string,
    fields: Record<string, any>,
    type?: string
  ): string {
    const fieldNames = Object.keys(fields)
    
    // Validate field names if type is provided
    if (type) {
      fieldNames.forEach(fieldName => {
        if (!this.validateFieldName(fieldName, type)) {
          console.warn(`Unknown field "${fieldName}" for type "${type}"`)
        }
      })
    }
    
    const fieldString = fieldNames.join('\n    ')
    
    return `${operation} ${name} {
  ${fieldString}
}`
  }

  /**
   * Process and count data by location and date range
   */
  static processDataByLocation(data: any, startDate?: string | null, endDate?: string | null, location?: string | null) {
    const processed = {
      locations: {} as any,
      leads: { count: 0, data: [] as any[] },
      appointments: { count: 0, data: [] as any[] },
      bookings: { count: 0, data: [] as any[] },
      patients: { count: 0, data: [] as any[] },
      revenue: { total: 0, data: [] as any[] },
      summary: {
        totalLeads: 0,
        totalAppointments: 0,
        totalBookings: 0,
        totalPatients: 0,
        totalRevenue: 0,
        gilbertCounts: { leads: 0, appointments: 0, bookings: 0, patients: 0, revenue: 0 },
        scottsdaleCounts: { leads: 0, appointments: 0, bookings: 0, patients: 0, revenue: 0 }
      },
      lastUpdated: new Date().toISOString(),
      queryParams: { startDate, endDate, location },
      apiStatus: 'Data Processed'
    }

    // Process locations
    if (data.locations) {
      data.locations.forEach((location: any) => {
        const locationName = location.name?.toLowerCase() || 'unknown'
        processed.locations[location.id] = {
          id: location.id,
          name: location.name,
          count: 0
        }
      })
    }

    // Process leads
    if (data.leads) {
      processed.leads.data = data.leads
      processed.leads.count = data.leads.length
      processed.summary.totalLeads = data.leads.length

      // Count by location
      data.leads.forEach((lead: any) => {
        if (lead.locationId) {
          const location = data.locations?.find((l: any) => l.id === lead.locationId)
          if (location) {
            const locationName = location.name?.toLowerCase()
            if (locationName?.includes('gilbert')) {
              processed.summary.gilbertCounts.leads++
            } else if (locationName?.includes('scottsdale')) {
              processed.summary.scottsdaleCounts.leads++
            }
          }
        }
      })
    }

    // Process appointments
    if (data.appointments) {
      processed.appointments.data = data.appointments
      processed.appointments.count = data.appointments.length
      processed.summary.totalAppointments = data.appointments.length

      // Count by location and calculate revenue
      data.appointments.forEach((apt: any) => {
        if (apt.locationId) {
          const location = data.locations?.find((l: any) => l.id === apt.locationId)
          if (location) {
            const locationName = location.name?.toLowerCase()
            if (locationName?.includes('gilbert')) {
              processed.summary.gilbertCounts.appointments++
              processed.summary.gilbertCounts.revenue += apt.revenue || 0
            } else if (locationName?.includes('scottsdale')) {
              processed.summary.scottsdaleCounts.appointments++
              processed.summary.scottsdaleCounts.revenue += apt.revenue || 0
            }
          }
        }
        processed.summary.totalRevenue += apt.revenue || 0
      })
    }

    // Process bookings
    if (data.appointmentBookings) {
      processed.bookings.data = data.appointmentBookings
      processed.bookings.count = data.appointmentBookings.length
      processed.summary.totalBookings = data.appointmentBookings.length

      // Count by location
      data.appointmentBookings.forEach((booking: any) => {
        const appointment = data.appointments?.find((apt: any) => apt.id === booking.appointmentId)
        if (appointment?.locationId) {
          const location = data.locations?.find((l: any) => l.id === appointment.locationId)
          if (location) {
            const locationName = location.name?.toLowerCase()
            if (locationName?.includes('gilbert')) {
              processed.summary.gilbertCounts.bookings++
            } else if (locationName?.includes('scottsdale')) {
              processed.summary.scottsdaleCounts.bookings++
            }
          }
        }
      })
    }

    // Process patients
    if (data.patients) {
      processed.patients.data = data.patients
      processed.patients.count = data.patients.length
      processed.summary.totalPatients = data.patients.length

      // Count by location
      data.patients.forEach((patient: any) => {
        if (patient.primaryLocation?.id) {
          const location = data.locations?.find((l: any) => l.id === patient.primaryLocation.id)
          if (location) {
            const locationName = location.name?.toLowerCase()
            if (locationName?.includes('gilbert')) {
              processed.summary.gilbertCounts.patients++
            } else if (locationName?.includes('scottsdale')) {
              processed.summary.scottsdaleCounts.patients++
            }
          }
        }
      })
    }

    // Process revenue
    if (data.revenue) {
      processed.revenue.data = data.revenue
      processed.revenue.total = data.revenue.reduce((sum: number, rev: any) => sum + (rev.amount || 0), 0)
      processed.summary.totalRevenue += processed.revenue.total
    }

    return processed
  }
}

// Common mutation examples with proper field naming
export const GREYFINCH_MUTATIONS = {
  // Create patient mutation
  CREATE_PATIENT: `
    mutation CreatePatient($input: PatientsSetInput!) {
      addPatient(input: $input) {
        patient {
          id
          firstName
          lastName
          birthDate
          gender
          title
        }
      }
    }
  `,
  
  // Update patient mutation
  UPDATE_PATIENT: `
    mutation UpdatePatient($id: uuid!, $input: PatientsSetInput!) {
      updatePatient(id: $id, input: $input) {
        patient {
          id
          firstName
          lastName
          birthDate
          gender
          title
        }
      }
    }
  `,
  
  // Create appointment mutation
  CREATE_APPOINTMENT: `
    mutation CreateAppointment($input: AppointmentInput!) {
      addAppointment(input: $input) {
        appointment {
          id
          patientId
          locationId
          appointmentType
          status
          scheduledDate
        }
      }
    }
  `
}

// Error handling utilities
export class GreyfinchErrorHandler {
  static isFieldError(error: any): boolean {
    return error.message?.includes('field') || error.message?.includes('Field')
  }
  
  static isAuthenticationError(error: any): boolean {
    return error.message?.includes('unauthorized') || 
           error.message?.includes('authentication') ||
           error.message?.includes('401')
  }
  
  static isSchemaError(error: any): boolean {
    return error.message?.includes('schema') || 
           error.message?.includes('type') ||
           error.message?.includes('unknown field')
  }
  
  static getFieldNameFromError(error: any): string | null {
    const match = error.message?.match(/field "([^"]+)"/)
    return match ? match[1] : null
  }
  
  static suggestCorrection(fieldName: string): string {
    // Common field name corrections
    const corrections: Record<string, string> = {
      'first_name': 'firstName',
      'last_name': 'lastName',
      'middle_name': 'middleName',
      'birth_date': 'birthDate',
      'patient_id': 'patientId',
      'location_id': 'locationId',
      'appointment_type': 'appointmentType',
      'scheduled_date': 'scheduledDate',
      'actual_date': 'actualDate',
      'created_at': 'createdAt',
      'updated_at': 'updatedAt',
      'is_active': 'isActive',
      'start_time': 'startTime',
      'end_time': 'endTime',
      'local_start_date': 'localStartDate',
      'local_start_time': 'localStartTime'
    }
    
    return corrections[fieldName] || GreyfinchSchemaUtils.toCamelCase(fieldName)
  }
}

export default GreyfinchSchemaUtils
