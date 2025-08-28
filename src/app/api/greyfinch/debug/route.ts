import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('Greyfinch debug endpoint called')
    
    const envApiKey = process.env.GREYFINCH_API_KEY
    const envApiSecret = process.env.GREYFINCH_API_SECRET
    
    console.log('Environment API key available:', !!envApiKey)
    console.log('Environment API secret available:', !!envApiSecret)
    
    if (!envApiKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key configured in environment variables',
        error: 'MISSING_API_KEY'
      }, { status: 400 })
    }
    
    // Update service with environment credentials
    greyfinchService.updateCredentials(envApiKey)
    
    // Test basic connection
    const connectionTest = await greyfinchService.testConnection('debug-user')
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection test failed',
        error: connectionTest.error,
        details: connectionTest.message
      }, { status: 400 })
    }
    
    // Try different field names to see what works
    const fieldTests = []
    
    // Test various field names for patients
    const patientFieldNames = ['patients', 'patient', 'patientList', 'patient_list', 'getPatients', 'getPatient']
    for (const fieldName of patientFieldNames) {
      try {
        const result = await greyfinchService.makeGraphQLRequest(`
          query Test${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              id
            }
          }
        `)
        fieldTests.push({
          field: fieldName,
          success: true,
          count: result[fieldName]?.length || 0,
          data: result[fieldName]?.slice(0, 2) || [] // First 2 items for preview
        })
      } catch (error) {
        fieldTests.push({
          field: fieldName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Test various field names for locations
    const locationFieldNames = ['locations', 'location', 'locationList', 'location_list', 'getLocations', 'getLocation']
    for (const fieldName of locationFieldNames) {
      try {
        const result = await greyfinchService.makeGraphQLRequest(`
          query Test${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              id
              name
            }
          }
        `)
        fieldTests.push({
          field: fieldName,
          success: true,
          count: result[fieldName]?.length || 0,
          data: result[fieldName]?.slice(0, 2) || [] // First 2 items for preview
        })
      } catch (error) {
        fieldTests.push({
          field: fieldName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Test various field names for appointments
    const appointmentFieldNames = ['appointments', 'appointment', 'appointmentList', 'appointment_list', 'getAppointments', 'getAppointment']
    for (const fieldName of appointmentFieldNames) {
      try {
        const result = await greyfinchService.makeGraphQLRequest(`
          query Test${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              id
            }
          }
        `)
        fieldTests.push({
          field: fieldName,
          success: true,
          count: result[fieldName]?.length || 0,
          data: result[fieldName]?.slice(0, 2) || [] // First 2 items for preview
        })
      } catch (error) {
        fieldTests.push({
          field: fieldName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Test various field names for leads
    const leadFieldNames = ['leads', 'lead', 'leadList', 'lead_list', 'getLeads', 'getLead']
    for (const fieldName of leadFieldNames) {
      try {
        const result = await greyfinchService.makeGraphQLRequest(`
          query Test${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              id
            }
          }
        `)
        fieldTests.push({
          field: fieldName,
          success: true,
          count: result[fieldName]?.length || 0,
          data: result[fieldName]?.slice(0, 2) || [] // First 2 items for preview
        })
      } catch (error) {
        fieldTests.push({
          field: fieldName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug test completed',
      connectionTest: connectionTest.data,
      fieldTests,
      summary: {
        workingFields: fieldTests.filter(t => t.success).map(t => t.field),
        failingFields: fieldTests.filter(t => !t.success).map(t => t.field),
        totalTests: fieldTests.length,
        successfulTests: fieldTests.filter(t => t.success).length
      }
    })
    
  } catch (error) {
    console.error('Greyfinch debug failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Debug test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
