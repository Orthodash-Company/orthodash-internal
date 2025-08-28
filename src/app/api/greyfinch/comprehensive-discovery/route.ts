import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting comprehensive field discovery...')
    
    const greyfinch = new GreyfinchService()
    
    // Test connection first
    const connectionTest = await greyfinch.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Greyfinch API',
        error: connectionTest.message
      }, { status: 500 })
    }

    console.log('✅ Connected to Greyfinch API, starting comprehensive discovery...')

    const results = {
      workingFields: [] as string[],
      failingFields: [] as Array<{field: string, error: string}>,
      totalTested: 0,
      timestamp: new Date().toISOString()
    }

    // Comprehensive list of field names to test
    const fieldNamesToTest = [
      // Common practice management fields
      'patients', 'patient', 'patient_records', 'patient_data', 'patient_list',
      'appointments', 'appointment', 'appointment_records', 'appointment_data', 'appointment_list',
      'leads', 'lead', 'lead_records', 'lead_data', 'lead_list', 'prospects', 'prospect',
      'locations', 'location', 'location_records', 'location_data', 'office', 'offices',
      
      // Alternative naming patterns
      'getPatients', 'getPatient', 'getAppointments', 'getAppointment',
      'getLeads', 'getLead', 'getLocations', 'getLocation',
      'listPatients', 'listPatient', 'listAppointments', 'listAppointment',
      'listLeads', 'listLead', 'listLocations', 'listLocation',
      
      // Database-style names
      'patient_table', 'appointment_table', 'lead_table', 'location_table',
      'patientTable', 'appointmentTable', 'leadTable', 'locationTable',
      
      // API-style names
      'patientApi', 'appointmentApi', 'leadApi', 'locationApi',
      'patient_api', 'appointment_api', 'lead_api', 'location_api',
      
      // Generic names
      'data', 'records', 'items', 'entities', 'objects',
      'allPatients', 'allAppointments', 'allLeads', 'allLocations',
      'patientCount', 'appointmentCount', 'leadCount', 'locationCount',
      
      // Medical-specific names
      'cases', 'case', 'treatments', 'treatment', 'visits', 'visit',
      'schedules', 'schedule', 'bookings', 'booking',
      
      // Very generic names
      'query', 'search', 'find', 'get', 'list', 'all',
      'root', 'base', 'main', 'primary', 'core'
    ]

    console.log(`🧪 Testing ${fieldNamesToTest.length} field names...`)

    for (const fieldName of fieldNamesToTest) {
      results.totalTested++
      
      try {
        console.log(`Testing field: ${fieldName}`)
        
        const query = await greyfinch.makeGraphQLRequest(`
          query TestField {
            ${fieldName} {
              __typename
            }
          }
        `)
        
        if (query && query[fieldName]) {
          console.log(`✅ Field '${fieldName}' works!`)
          results.workingFields.push(fieldName)
        } else {
          console.log(`❌ Field '${fieldName}' returned no data`)
          results.failingFields.push({
            field: fieldName,
            error: 'No data returned'
          })
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ Field '${fieldName}' failed: ${errorMessage}`)
        results.failingFields.push({
          field: fieldName,
          error: errorMessage
        })
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`📊 Discovery complete. Working fields: ${results.workingFields.length}, Failed: ${results.failingFields.length}`)

    return NextResponse.json({
      success: true,
      message: 'Comprehensive field discovery completed',
      data: results
    })

  } catch (error) {
    console.error('❌ Comprehensive discovery error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to complete comprehensive discovery',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
