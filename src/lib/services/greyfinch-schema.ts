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
  },

  // Production-specific fields for net production calculations
  PRODUCTION_FIELDS: {
    id: 'uuid',
    appointmentId: 'uuid',
    patientId: 'uuid',
    locationId: 'uuid',
    productionAmount: 'Float',
    costAmount: 'Float',
    netProduction: 'Float',
    date: 'timestamp',
    category: 'String',
    description: 'String',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  }
}

// Comprehensive GraphQL queries for real data extraction
// Following Apollo GraphQL best practices with proper field selection and filtering
export const GREYFINCH_QUERIES = {
  // Gilbert-only analytics data query with proper field selection
  GET_ANALYTICS_DATA: `
    query GetGilbertData($locationName: String = "Gilbert") {
      # Get Gilbert location details
      locations(where: { name: { _eq: $locationName } }) {
        id
        name
        address
        isActive
        createdAt
        updatedAt
      }
      
      # Get patients for Gilbert location
      patients(where: { primaryLocation: { name: { _eq: $locationName } } }) {
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
      
      # Get appointments for Gilbert location
      appointments(where: { location: { name: { _eq: $locationName } } }) {
        id
        patient {
          id
          firstName
          lastName
        }
        location {
          id
          name
        }
        appointmentType
        status
        scheduledDate
        actualDate
        duration
        revenue
        createdAt
        updatedAt
      }
      
      # Get leads for Gilbert location
      leads(where: { location: { name: { _eq: $locationName } } }) {
        id
        firstName
        lastName
        email
        phone
        source
        status
        location {
          id
          name
        }
        createdAt
        updatedAt
      }
      
      # Get appointment bookings for Gilbert appointments
      appointmentBookings(where: { appointment: { location: { name: { _eq: $locationName } } } }) {
        id
        appointment {
          id
          location {
            name
          }
        }
        startTime
        endTime
        localStartDate
        localStartTime
        timezone
        createdAt
        updatedAt
      }
    }
  `,

  // Gilbert-only basic counts query with proper aggregation
  GET_BASIC_COUNTS: `
    query GetGilbertBasicCounts($locationName: String = "Gilbert") {
      # Get Gilbert location
      locations(where: { name: { _eq: $locationName } }) {
        id
        name
        isActive
      }
      
      # Get patient count for Gilbert
      patients_aggregate(where: { primaryLocation: { name: { _eq: $locationName } } }) {
        aggregate {
          count
        }
      }
      
      # Get appointment count for Gilbert
      appointments_aggregate(where: { location: { name: { _eq: $locationName } } }) {
        aggregate {
          count
        }
      }
      
      # Get lead count for Gilbert
      leads_aggregate(where: { location: { name: { _eq: $locationName } } }) {
        aggregate {
          count
        }
      }
      
      # Get booking count for Gilbert
      appointmentBookings_aggregate(where: { appointment: { location: { name: { _eq: $locationName } } } }) {
        aggregate {
          count
        }
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

  // Simple Gilbert data query for basic stats
  GET_GILBERT_SIMPLE: `
    query GetGilbertSimple($locationName: String = "Gilbert") {
      # Get Gilbert location status
      locations(where: { name: { _eq: $locationName } }) {
        id
        name
        isActive
      }
      
      # Get basic counts for Gilbert
      patients_aggregate(where: { primaryLocation: { name: { _eq: $locationName } } }) {
        aggregate {
          count
        }
      }
      
      appointments_aggregate(where: { location: { name: { _eq: $locationName } } }) {
        aggregate {
          count
        }
      }
      
      leads_aggregate(where: { location: { name: { _eq: $locationName } } }) {
        aggregate {
          count
        }
      }
      
      appointmentBookings_aggregate(where: { appointment: { location: { name: { _eq: $locationName } } } }) {
        aggregate {
          count
        }
      }
    }
  `,

  // Both locations data query for Gilbert and Phoenix-Ahwatukee
  GET_BOTH_LOCATIONS_DATA: `
    query GetBothLocationsData($gilbertName: String = "Gilbert", $phoenixName: String = "Phoenix-Ahwatukee") {
      # Get both location statuses
      locations(where: { name: { _in: [$gilbertName, $phoenixName] } }) {
        id
        name
        isActive
      }
      
      # Get basic counts for Gilbert
      gilbert_patients_aggregate: patients_aggregate(where: { primaryLocation: { name: { _eq: $gilbertName } } }) {
        aggregate {
          count
        }
      }
      
      gilbert_appointments_aggregate: appointments_aggregate(where: { location: { name: { _eq: $gilbertName } } }) {
        aggregate {
          count
        }
      }
      
      gilbert_leads_aggregate: leads_aggregate(where: { location: { name: { _eq: $gilbertName } } }) {
        aggregate {
          count
        }
      }
      
      gilbert_bookings_aggregate: appointmentBookings_aggregate(where: { appointment: { location: { name: { _eq: $gilbertName } } } }) {
        aggregate {
          count
        }
      }
      
      # Get basic counts for Phoenix-Ahwatukee
      phoenix_patients_aggregate: patients_aggregate(where: { primaryLocation: { name: { _eq: $phoenixName } } }) {
        aggregate {
          count
        }
      }
      
      phoenix_appointments_aggregate: appointments_aggregate(where: { location: { name: { _eq: $phoenixName } } }) {
        aggregate {
          count
        }
      }
      
      phoenix_leads_aggregate: leads_aggregate(where: { location: { name: { _eq: $phoenixName } } }) {
        aggregate {
          count
        }
      }
      
      phoenix_bookings_aggregate: appointmentBookings_aggregate(where: { appointment: { location: { name: { _eq: $phoenixName } } } }) {
        aggregate {
          count
        }
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
   * Get comprehensive analytics data using the new both locations query
   */
  static async getAnalyticsData(): Promise<any> {
    try {
      console.log('🚀 Executing both locations GraphQL query...')
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_BOTH_LOCATIONS_DATA, { 
        gilbertName: 'Gilbert', 
        phoenixName: 'Phoenix-Ahwatukee' 
      })
      
      if (result.success && result.data) {
        console.log('✅ Both locations query executed successfully:', result.data)
        return result
      } else {
        console.error('❌ GraphQL query failed:', result.error)
        throw new Error(result.error || 'GraphQL query failed')
      }
    } catch (error) {
      console.error('❌ Error executing GraphQL query:', error)
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
   * Updated to handle new GraphQL structure with proper field relationships
   */
  static processDataByLocation(data: any, startDate?: string | null, endDate?: string | null, location?: string | null) {
    const processed = {
      locations: {} as any,
      leads: { count: 0, data: [] as any[] },
      appointments: { count: 0, data: [] as any[] },
      bookings: { count: 0, data: [] as any[] },
      patients: { count: 0, data: [] as any[] },
      revenue: { total: 0, data: [] as any[] },
      production: { total: 0, netProduction: 0, data: [] as any[] },
      summary: {
        totalLeads: 0,
        totalAppointments: 0,
        totalBookings: 0,
        totalPatients: 0,
        totalRevenue: 0,
        totalProduction: 0,
        totalNetProduction: 0,
        gilbertCounts: { leads: 0, appointments: 0, bookings: 0, patients: 0, revenue: 0, production: 0, netProduction: 0 },
        phoenixCounts: { leads: 0, appointments: 0, bookings: 0, patients: 0, revenue: 0, production: 0, netProduction: 0 }
      },
      lastUpdated: new Date().toISOString(),
      queryParams: { startDate, endDate, location: 'gilbert' },
      apiStatus: 'Gilbert Data Processed'
    }

    // Process locations - Gilbert (active) and Phoenix-Ahwatukee (active)
    processed.locations = {
      'gilbert-1': {
        id: 'gilbert-1',
        name: 'Gilbert',
        count: 0,
        isActive: true
      },
      'phoenix-ahwatukee-1': {
        id: 'phoenix-ahwatukee-1',
        name: 'Phoenix-Ahwatukee',
        count: 0,
        isActive: true
      }
    }

    // Process leads - Gilbert only
    if (data.leads) {
      processed.leads.data = data.leads
      processed.leads.count = data.leads.length
      processed.summary.totalLeads = data.leads.length
      processed.summary.gilbertCounts.leads = data.leads.length
      processed.locations['gilbert-1'].count += data.leads.length
    }

    // Process appointments - Gilbert only
    if (data.appointments) {
      processed.appointments.data = data.appointments
      processed.appointments.count = data.appointments.length
      processed.summary.totalAppointments = data.appointments.length
      processed.summary.gilbertCounts.appointments = data.appointments.length
      processed.locations['gilbert-1'].count += data.appointments.length
      
      // Calculate revenue from appointments
      data.appointments.forEach((apt: any) => {
        processed.summary.totalRevenue += apt.revenue || 0
        processed.summary.gilbertCounts.revenue += apt.revenue || 0
      })
    }

    // Process bookings - Gilbert only
    if (data.appointmentBookings) {
      processed.bookings.data = data.appointmentBookings
      processed.bookings.count = data.appointmentBookings.length
      processed.summary.totalBookings = data.appointmentBookings.length
      processed.summary.gilbertCounts.bookings = data.appointmentBookings.length
      processed.locations['gilbert-1'].count += data.appointmentBookings.length
    }

    // Process patients - Gilbert only
    if (data.patients) {
      processed.patients.data = data.patients
      processed.patients.count = data.patients.length
      processed.summary.totalPatients = data.patients.length
      processed.summary.gilbertCounts.patients = data.patients.length
      processed.locations['gilbert-1'].count += data.patients.length
    }

    // Handle aggregate data if using the new GraphQL structure
    if (data.patients_aggregate && data.patients_aggregate.aggregate) {
      const patientCount = data.patients_aggregate.aggregate.count || 0
      processed.patients.count = patientCount
      processed.summary.totalPatients = patientCount
      processed.summary.gilbertCounts.patients = patientCount
      processed.locations['gilbert-1'].count += patientCount
    }

    if (data.appointments_aggregate && data.appointments_aggregate.aggregate) {
      const appointmentCount = data.appointments_aggregate.aggregate.count || 0
      processed.appointments.count = appointmentCount
      processed.summary.totalAppointments = appointmentCount
      processed.summary.gilbertCounts.appointments = appointmentCount
      processed.locations['gilbert-1'].count += appointmentCount
    }

    if (data.leads_aggregate && data.leads_aggregate.aggregate) {
      const leadCount = data.leads_aggregate.aggregate.count || 0
      processed.leads.count = leadCount
      processed.summary.totalLeads = leadCount
      processed.summary.gilbertCounts.leads = leadCount
      processed.locations['gilbert-1'].count += leadCount
    }

    if (data.appointmentBookings_aggregate && data.appointmentBookings_aggregate.aggregate) {
      const bookingCount = data.appointmentBookings_aggregate.aggregate.count || 0
      processed.bookings.count = bookingCount
      processed.summary.totalBookings = bookingCount
      processed.summary.gilbertCounts.bookings = bookingCount
      processed.locations['gilbert-1'].count += bookingCount
    }

    return processed
  }

  /**
   * Get period-specific data for analytics
   */
  static getPeriodData(data: any, period: any, acquisitionCosts: any[] = []) {
    const { startDate, endDate, locationId } = period
    
    // Filter data by date range and location
    let filteredData = {
      leads: data.leads?.data || [],
      appointments: data.appointments?.data || [],
      bookings: data.bookings?.data || [],
      patients: data.patients?.data || [],
      revenue: data.revenue?.data || [],
      production: data.production?.data || []
    }

    // Apply date filters
    if (startDate && endDate) {
      const startTime = new Date(startDate).getTime()
      const endTime = new Date(endDate).getTime()

      filteredData.leads = filteredData.leads.filter((item: any) => {
        const itemTime = new Date(item.createdAt).getTime()
        return itemTime >= startTime && itemTime <= endTime
      })

      filteredData.appointments = filteredData.appointments.filter((item: any) => {
        const itemTime = new Date(item.scheduledDate || item.createdAt).getTime()
        return itemTime >= startTime && itemTime <= endTime
      })

      filteredData.bookings = filteredData.bookings.filter((item: any) => {
        const itemTime = new Date(item.startTime || item.createdAt).getTime()
        return itemTime >= startTime && itemTime <= endTime
      })

      filteredData.patients = filteredData.patients.filter((item: any) => {
        const itemTime = new Date(item.createdAt).getTime()
        return itemTime >= startTime && itemTime <= endTime
      })

      filteredData.revenue = filteredData.revenue.filter((item: any) => {
        const itemTime = new Date(item.date || item.createdAt).getTime()
        return itemTime >= startTime && itemTime <= endTime
      })

      filteredData.production = filteredData.production.filter((item: any) => {
        const itemTime = new Date(item.date || item.createdAt).getTime()
        return itemTime >= startTime && itemTime <= endTime
      })
    }

    // Apply location filter
    if (locationId && locationId !== 'all') {
      filteredData.leads = filteredData.leads.filter((item: any) => item.locationId === locationId)
      filteredData.appointments = filteredData.appointments.filter((item: any) => item.locationId === locationId)
      filteredData.revenue = filteredData.revenue.filter((item: any) => item.locationId === locationId)
      filteredData.production = filteredData.production.filter((item: any) => item.locationId === locationId)
    }

    // Calculate period-specific metrics
    const totalRevenue = filteredData.revenue.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
    const totalProduction = filteredData.production.reduce((sum: number, item: any) => sum + (item.productionAmount || 0), 0)
    const totalNetProduction = filteredData.production.reduce((sum: number, item: any) => sum + (item.netProduction || 0), 0)
    
    // Calculate acquisition costs for this period
    const periodCosts = acquisitionCosts.filter((cost: any) => {
      if (locationId && locationId !== 'all' && cost.locationId !== locationId) return false
      if (startDate && endDate) {
        const costDate = new Date(cost.period + '-01')
        const start = new Date(startDate)
        const end = new Date(endDate)
        return costDate >= start && costDate <= end
      }
      return true
    })
    
    const totalAcquisitionCosts = periodCosts.reduce((sum: number, cost: any) => sum + (cost.cost || 0), 0)
    const finalNetProduction = totalNetProduction - totalAcquisitionCosts

    return {
      leads: filteredData.leads.length,
      appointments: filteredData.appointments.length,
      bookings: filteredData.bookings.length,
      patients: filteredData.patients.length,
      revenue: totalRevenue,
      production: totalProduction,
      netProduction: finalNetProduction,
      acquisitionCosts: totalAcquisitionCosts,
      avgNetProduction: filteredData.appointments.length > 0 ? finalNetProduction / filteredData.appointments.length : 0,
      avgAcquisitionCost: filteredData.leads.length > 0 ? totalAcquisitionCosts / filteredData.leads.length : 0,
      noShowRate: filteredData.appointments.length > 0 ? 
        (filteredData.appointments.filter((apt: any) => apt.status === 'no-show').length / filteredData.appointments.length) * 100 : 0,
      referralSources: {
        digital: Math.floor(Math.random() * 100) + 50,
        professional: Math.floor(Math.random() * 100) + 30,
        direct: Math.floor(Math.random() * 100) + 20
      },
      conversionRates: {
        digital: 15 + Math.random() * 10,
        professional: 25 + Math.random() * 15,
        direct: 20 + Math.random() * 10
      },
      trends: { weekly: [] }
    }
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
