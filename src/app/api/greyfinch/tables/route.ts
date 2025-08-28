import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('Greyfinch tables endpoint called')
    
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key configured'
      }, { status: 400 })
    }
    
    greyfinchService.updateCredentials(envApiKey)
    
    // Test connection first
    const connectionTest = await greyfinchService.testConnection('tables-user')
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection failed',
        error: connectionTest.message
      }, { status: 400 })
    }
    
    // Common table names in practice management systems
    const tableNames = [
      // Core practice data
      'patients', 'patient', 'patient_table', 'patient_records', 'patient_data',
      'locations', 'location', 'location_table', 'location_records', 'location_data',
      'appointments', 'appointment', 'appointment_table', 'appointment_records', 'appointment_data',
      'leads', 'lead', 'lead_table', 'lead_records', 'lead_data',
      'bookings', 'booking', 'booking_table', 'booking_records', 'booking_data',
      
      // Practice management specific
      'practices', 'practice', 'practice_table', 'practice_records',
      'clinics', 'clinic', 'clinic_table', 'clinic_records',
      'offices', 'office', 'office_table', 'office_records',
      
      // User and staff data
      'users', 'user', 'user_table', 'user_records',
      'staff', 'staff_table', 'staff_records',
      'employees', 'employee', 'employee_table', 'employee_records',
      
      // Treatment and medical data
      'treatments', 'treatment', 'treatment_table', 'treatment_records',
      'procedures', 'procedure', 'procedure_table', 'procedure_records',
      'visits', 'visit', 'visit_table', 'visit_records',
      'sessions', 'session', 'session_table', 'session_records',
      
      // Billing and financial
      'billing', 'billings', 'billing_table', 'billing_records',
      'invoices', 'invoice', 'invoice_table', 'invoice_records',
      'payments', 'payment', 'payment_table', 'payment_records',
      'transactions', 'transaction', 'transaction_table', 'transaction_records',
      
      // Generic database patterns
      'tables', 'table', 'table_list', 'table_info',
      'counts', 'count', 'count_all', 'count_tables',
      'stats', 'statistics', 'stats_all', 'statistics_all',
      
      // GraphQL specific patterns
      'query', 'queries', 'query_root', 'schema',
      'meta', 'metadata', 'meta_data', 'meta_info'
    ]
    
    const results = []
    
    for (const tableName of tableNames) {
      try {
        // Try to get count from table
        const countResult = await greyfinchService.makeGraphQLRequest(`
          query Get${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Count {
            ${tableName} {
              count
            }
          }
        `)
        
        if (countResult?.[tableName]?.count !== undefined) {
          results.push({
            table: tableName,
            success: true,
            count: countResult[tableName].count,
            type: 'count_field'
          })
          continue
        }
        
        // Try to get count as a direct field
        const directCountResult = await greyfinchService.makeGraphQLRequest(`
          query Get${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Count {
            count_${tableName}
          }
        `)
        
        if (directCountResult?.[`count_${tableName}`] !== undefined) {
          results.push({
            table: tableName,
            success: true,
            count: directCountResult[`count_${tableName}`],
            type: 'direct_count'
          })
          continue
        }
        
        // Try to get table info
        const tableInfoResult = await greyfinchService.makeGraphQLRequest(`
          query Get${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Info {
            ${tableName} {
              __typename
            }
          }
        `)
        
        if (tableInfoResult?.[tableName]) {
          results.push({
            table: tableName,
            success: true,
            count: 'available',
            type: 'table_exists',
            typename: tableInfoResult[tableName]?.[0]?.__typename || 'unknown'
          })
          continue
        }
        
        results.push({
          table: tableName,
          success: false,
          error: 'Table not found'
        })
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          table: tableName,
          success: false,
          error: errorMessage
        })
      }
    }
    
    const workingTables = results.filter(r => r.success)
    const failingTables = results.filter(r => !r.success)
    
    // Try to get a list of all available tables
    let allTables = []
    try {
      const tablesListResult = await greyfinchService.makeGraphQLRequest(`
        query GetAllTables {
          tables {
            name
            count
          }
        }
      `)
      
      if (tablesListResult?.tables) {
        allTables = tablesListResult.tables
      }
    } catch (error) {
      console.log('Could not get tables list:', error)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Table discovery completed',
      summary: {
        totalTables: results.length,
        workingTables: workingTables.length,
        failingTables: failingTables.length
      },
      workingTables: workingTables.map(w => ({
        table: w.table,
        count: w.count,
        type: w.type,
        typename: w.typename
      })),
      allTables: allTables,
      failingTables: failingTables.slice(0, 10).map(f => ({
        table: f.table,
        error: f.error
      }))
    })
    
  } catch (error) {
    console.error('Greyfinch tables failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Table discovery failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
