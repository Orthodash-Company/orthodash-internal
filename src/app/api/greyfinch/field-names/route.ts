import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('Greyfinch field names endpoint called')
    
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key configured'
      }, { status: 400 })
    }
    
    greyfinchService.updateCredentials(envApiKey)
    
    // Test connection first
    const connectionTest = await greyfinchService.testConnection('field-names-user')
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection failed',
        error: connectionTest.message
      }, { status: 400 })
    }
    
    const results = []
    
    // Common field name variations for patients
    const patientFieldNames = [
      'patients', 'patient', 'patientList', 'patient_list', 'getPatients', 'getPatient',
      'allPatients', 'all_patients', 'patientRecords', 'patient_records',
      'patientData', 'patient_data', 'patientCollection', 'patient_collection'
    ]
    
    for (const fieldName of patientFieldNames) {
      try {
        const query = await greyfinchService.makeGraphQLRequest(`
          query Get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              id
            }
          }
        `)
        
        if (query?.[fieldName]) {
          results.push({
            field: fieldName,
            success: true,
            count: query[fieldName].length,
            type: 'patients'
          })
          break // Found a working field name
        }
      } catch (error) {
        results.push({
          field: fieldName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'patients'
        })
      }
    }
    
    // Common field name variations for locations
    const locationFieldNames = [
      'locations', 'location', 'locationList', 'location_list', 'getLocations', 'getLocation',
      'allLocations', 'all_locations', 'locationRecords', 'location_records',
      'locationData', 'location_data', 'locationCollection', 'location_collection'
    ]
    
    for (const fieldName of locationFieldNames) {
      try {
        const query = await greyfinchService.makeGraphQLRequest(`
          query Get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              id
              name
            }
          }
        `)
        
        if (query?.[fieldName]) {
          results.push({
            field: fieldName,
            success: true,
            count: query[fieldName].length,
            type: 'locations'
          })
          break // Found a working field name
        }
      } catch (error) {
        results.push({
          field: fieldName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'locations'
        })
      }
    }
    
    // Common field name variations for appointments
    const appointmentFieldNames = [
      'appointments', 'appointment', 'appointmentList', 'appointment_list', 'getAppointments', 'getAppointment',
      'allAppointments', 'all_appointments', 'appointmentRecords', 'appointment_records',
      'appointmentData', 'appointment_data', 'appointmentCollection', 'appointment_collection'
    ]
    
    for (const fieldName of appointmentFieldNames) {
      try {
        const query = await greyfinchService.makeGraphQLRequest(`
          query Get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              id
            }
          }
        `)
        
        if (query?.[fieldName]) {
          results.push({
            field: fieldName,
            success: true,
            count: query[fieldName].length,
            type: 'appointments'
          })
          break // Found a working field name
        }
      } catch (error) {
        results.push({
          field: fieldName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'appointments'
        })
      }
    }
    
    // Common field name variations for leads
    const leadFieldNames = [
      'leads', 'lead', 'leadList', 'lead_list', 'getLeads', 'getLead',
      'allLeads', 'all_leads', 'leadRecords', 'lead_records',
      'leadData', 'lead_data', 'leadCollection', 'lead_collection'
    ]
    
    for (const fieldName of leadFieldNames) {
      try {
        const query = await greyfinchService.makeGraphQLRequest(`
          query Get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              id
            }
          }
        `)
        
        if (query?.[fieldName]) {
          results.push({
            field: fieldName,
            success: true,
            count: query[fieldName].length,
            type: 'leads'
          })
          break // Found a working field name
        }
      } catch (error) {
        results.push({
          field: fieldName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'leads'
        })
      }
    }
    
    const workingTests = results.filter(r => r.success)
    const failingTests = results.filter(r => !r.success)
    
    return NextResponse.json({
      success: true,
      message: 'Field names test completed',
      summary: {
        totalTests: results.length,
        workingTests: workingTests.length,
        failingTests: failingTests.length
      },
      workingTests,
      failingTests: failingTests.slice(0, 10) // Show first 10 failures
    })
    
  } catch (error) {
    console.error('Greyfinch field names failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Field names test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
