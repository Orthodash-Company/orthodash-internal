import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('Greyfinch explore endpoint called')
    
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key configured'
      }, { status: 400 })
    }
    
    greyfinchService.updateCredentials(envApiKey)
    
    // Test connection first
    const connectionTest = await greyfinchService.testConnection('explore-user')
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection failed',
        error: connectionTest.message
      }, { status: 400 })
    }
    
    // Try common GraphQL field names that might be used in practice management systems
    const commonFields = [
      // Practice management specific
      'practice', 'practices', 'clinic', 'clinics', 'office', 'offices',
      'user', 'users', 'staff', 'employee', 'employees',
      'client', 'clients', 'customer', 'customers',
      'record', 'records', 'file', 'files',
      'visit', 'visits', 'session', 'sessions',
      'treatment', 'treatments', 'procedure', 'procedures',
      'billing', 'billings', 'invoice', 'invoices',
      'payment', 'payments', 'transaction', 'transactions',
      
      // Generic data fields
      'data', 'items', 'list', 'collection', 'all',
      'get', 'find', 'search', 'query',
      
      // Common prefixes
      'getPatients', 'getLocations', 'getAppointments', 'getLeads',
      'findPatients', 'findLocations', 'findAppointments', 'findLeads',
      'listPatients', 'listLocations', 'listAppointments', 'listLeads',
      'searchPatients', 'searchLocations', 'searchAppointments', 'searchLeads',
      
      // Alternative naming
      'patientRecords', 'locationData', 'appointmentData', 'leadData',
      'patientData', 'locationRecords', 'appointmentRecords', 'leadRecords',
      
      // GraphQL conventions
      'node', 'nodes', 'edges', 'pageInfo',
      'viewer', 'me', 'currentUser',
      
      // API specific
      'api', 'graphql', 'query', 'mutation'
    ]
    
    const results = []
    
    for (const fieldName of commonFields) {
      try {
        const result = await greyfinchService.makeGraphQLRequest(`
          query Explore${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              __typename
            }
          }
        `)
        
        results.push({
          field: fieldName,
          success: true,
          typename: result[fieldName]?.[0]?.__typename || 'unknown',
          count: Array.isArray(result[fieldName]) ? result[fieldName].length : 'not_array'
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          field: fieldName,
          success: false,
          error: errorMessage
        })
      }
    }
    
    const workingFields = results.filter(r => r.success)
    const failingFields = results.filter(r => !r.success)
    
    return NextResponse.json({
      success: true,
      message: 'Exploration completed',
      summary: {
        totalFields: results.length,
        workingFields: workingFields.length,
        failingFields: failingFields.length
      },
      workingFields: workingFields.map(w => ({
        field: w.field,
        typename: w.typename,
        count: w.count
      })),
      failingFields: failingFields.slice(0, 10).map(f => ({
        field: f.field,
        error: f.error
      })),
      // Show first few working fields with more detail
      sampleWorkingFields: workingFields.slice(0, 5)
    })
    
  } catch (error) {
    console.error('Greyfinch explore failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Exploration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
