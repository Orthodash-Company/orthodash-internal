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
  }
}

// Common GraphQL queries with proper field naming
export const GREYFINCH_QUERIES = {
  // Basic patient query with camelCase fields
  GET_PATIENTS: `
    query GetPatients {
      patients {
        id
        firstName
        lastName
        middleName
        birthDate
        gender
        title
        email
        phone
        primaryLocation {
          id
          name
        }
        createdAt
        updatedAt
      }
    }
  `,
  
  // Basic location query
  GET_LOCATIONS: `
    query GetLocations {
      locations {
        id
        name
        address
        phone
        email
        isActive
        createdAt
        updatedAt
      }
    }
  `,
  
  // Basic appointment query
  GET_APPOINTMENTS: `
    query GetAppointments {
      appointments {
        id
        patientId
        locationId
        appointmentType
        status
        scheduledDate
        actualDate
        duration
        notes
        createdAt
        updatedAt
      }
    }
  `,
  
  // Basic lead query
  GET_LEADS: `
    query GetLeads {
      leads {
        id
        firstName
        lastName
        email
        phone
        source
        status
        createdAt
        updatedAt
      }
    }
  `,
  
  // Basic booking query
  GET_BOOKINGS: `
    query GetBookings {
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
    }
  `,
  
  // Schema introspection query
  INTROSPECT_SCHEMA: `
    query IntrospectSchema {
      __schema {
        types {
          name
          description
          fields {
            name
            description
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    }
  `,
  
  // Type-specific introspection
  INTROSPECT_TYPE: `
    query IntrospectType($typeName: String!) {
      __type(name: $typeName) {
        name
        description
        fields {
          name
          description
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
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
   * Introspect the GraphQL schema to get type information
   */
  static async introspectSchema(): Promise<any> {
    try {
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.INTROSPECT_SCHEMA)
      return result
    } catch (error) {
      console.error('Schema introspection failed:', error)
      throw error
    }
  }
  
  /**
   * Introspect a specific type
   */
  static async introspectType(typeName: string): Promise<any> {
    try {
      const result = await greyfinchService.makeGraphQLRequest(
        GREYFINCH_QUERIES.INTROSPECT_TYPE,
        { typeName }
      )
      return result
    } catch (error) {
      console.error(`Type introspection failed for ${typeName}:`, error)
      throw error
    }
  }
  
  /**
   * Get all available field names for a type
   */
  static async getTypeFields(typeName: string): Promise<string[]> {
    try {
      const result = await this.introspectType(typeName)
      const fields = result.__type?.fields || []
      return fields.map((field: any) => field.name)
    } catch (error) {
      console.error(`Failed to get fields for type ${typeName}:`, error)
      return []
    }
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
