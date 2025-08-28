import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('Greyfinch patient fields endpoint called')
    
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key configured'
      }, { status: 400 })
    }
    
    greyfinchService.updateCredentials(envApiKey)
    
    // Test connection first
    const connectionTest = await greyfinchService.testConnection('patient-fields-user')
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection failed',
        error: connectionTest.message
      }, { status: 400 })
    }
    
    // Try to get patient data with different field combinations
    const fieldTests = []
    
    // Common patient fields
    const patientFields = [
      'id', 'firstName', 'lastName', 'middleName', 'birthDate', 'gender',
      'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country',
      'createdAt', 'updatedAt', 'status', 'active', 'isActive',
      'primaryLocation', 'location', 'locationId',
      'doctor', 'physician', 'provider', 'providerId',
      'insurance', 'insuranceId', 'insuranceNumber',
      'notes', 'comments', 'description'
    ]
    
    // Test getting a single patient with all fields
    try {
      const patientQuery = await greyfinchService.makeGraphQLRequest(`
        query GetPatient {
          patients {
            id
            firstName
            lastName
            email
            phone
            createdAt
            updatedAt
          }
        }
      `)
      
      if (patientQuery?.patients) {
        fieldTests.push({
          test: 'patients_query',
          success: true,
          count: patientQuery.patients.length,
          sampleData: patientQuery.patients[0] || null,
          availableFields: Object.keys(patientQuery.patients[0] || {})
        })
      }
    } catch (error) {
      fieldTests.push({
        test: 'patients_query',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test getting patient count using aggregation
    try {
      const patientCountQuery = await greyfinchService.makeGraphQLRequest(`
        query GetPatientCount {
          patients_aggregate {
            aggregate {
              count
            }
          }
        }
      `)
      
      if (patientCountQuery?.patients_aggregate?.aggregate?.count !== undefined) {
        fieldTests.push({
          test: 'patients_aggregate_count',
          success: true,
          count: patientCountQuery.patients_aggregate.aggregate.count
        })
      }
    } catch (error) {
      fieldTests.push({
        test: 'patients_aggregate_count',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test getting patient count using different patterns
    const countPatterns = [
      'patients_count',
      'count_patients', 
      'patientCount',
      'getPatientCount',
      'totalPatients',
      'patientsTotal'
    ]
    
    for (const pattern of countPatterns) {
      try {
        const countQuery = await greyfinchService.makeGraphQLRequest(`
          query GetCount {
            ${pattern}
          }
        `)
        
        if (countQuery?.[pattern] !== undefined) {
          fieldTests.push({
            test: pattern,
            success: true,
            count: countQuery[pattern]
          })
        }
      } catch (error) {
        fieldTests.push({
          test: pattern,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Test getting locations
    try {
      const locationQuery = await greyfinchService.makeGraphQLRequest(`
        query GetLocations {
          locations {
            id
            name
            address
            createdAt
            updatedAt
          }
        }
      `)
      
      if (locationQuery?.locations) {
        fieldTests.push({
          test: 'locations_query',
          success: true,
          count: locationQuery.locations.length,
          sampleData: locationQuery.locations[0] || null,
          availableFields: Object.keys(locationQuery.locations[0] || {})
        })
      }
    } catch (error) {
      fieldTests.push({
        test: 'locations_query',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test getting appointments
    try {
      const appointmentQuery = await greyfinchService.makeGraphQLRequest(`
        query GetAppointments {
          appointments {
            id
            patientId
            locationId
            scheduledDate
            status
            createdAt
            updatedAt
          }
        }
      `)
      
      if (appointmentQuery?.appointments) {
        fieldTests.push({
          test: 'appointments_query',
          success: true,
          count: appointmentQuery.appointments.length,
          sampleData: appointmentQuery.appointments[0] || null,
          availableFields: Object.keys(appointmentQuery.appointments[0] || {})
        })
      }
    } catch (error) {
      fieldTests.push({
        test: 'appointments_query',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    const workingTests = fieldTests.filter(t => t.success)
    const failingTests = fieldTests.filter(t => !t.success)
    
    return NextResponse.json({
      success: true,
      message: 'Patient fields exploration completed',
      summary: {
        totalTests: fieldTests.length,
        workingTests: workingTests.length,
        failingTests: failingTests.length
      },
      workingTests,
      failingTests: failingTests.slice(0, 5)
    })
    
  } catch (error) {
    console.error('Greyfinch patient fields failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Patient fields exploration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
