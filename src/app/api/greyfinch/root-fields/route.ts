import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('Greyfinch root fields endpoint called')
    
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key configured'
      }, { status: 400 })
    }
    
    greyfinchService.updateCredentials(envApiKey)
    
    // Test connection first
    const connectionTest = await greyfinchService.testConnection('root-fields-user')
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection failed',
        error: connectionTest.message
      }, { status: 400 })
    }
    
    const results = []
    
    // Common GraphQL root field names that might be used
    const rootFieldNames = [
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
      
      // GraphQL conventions
      'node', 'nodes', 'edges', 'pageInfo',
      'viewer', 'me', 'currentUser',
      
      // API specific
      'api', 'graphql', 'query', 'mutation',
      
      // Database/table related
      'table', 'tables', 'database', 'db',
      'schema', 'meta', 'metadata',
      
      // Count related
      'count', 'counts', 'stats', 'statistics',
      'total', 'totals', 'summary', 'summaries'
    ]
    
    for (const fieldName of rootFieldNames) {
      try {
        const query = await greyfinchService.makeGraphQLRequest(`
          query Get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              __typename
            }
          }
        `)
        
        if (query?.[fieldName]) {
          results.push({
            field: fieldName,
            success: true,
            typename: query[fieldName]?.[0]?.__typename || 'unknown',
            count: Array.isArray(query[fieldName]) ? query[fieldName].length : 'not_array'
          })
        }
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
      message: 'Root fields discovery completed',
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
      }))
    })
    
  } catch (error) {
    console.error('Greyfinch root fields failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Root fields discovery failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
