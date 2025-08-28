import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('Greyfinch simple test endpoint called')
    
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key configured'
      }, { status: 400 })
    }
    
    greyfinchService.updateCredentials(envApiKey)
    
    // Test connection first
    const connectionTest = await greyfinchService.testConnection('simple-test-user')
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection failed',
        error: connectionTest.message
      }, { status: 400 })
    }
    
    const results = []
    
    // Test patients with just id
    try {
      const patientQuery = await greyfinchService.makeGraphQLRequest(`
        query GetPatients {
          patients {
            id
          }
        }
      `)
      
      if (patientQuery?.patients) {
        results.push({
          table: 'patients',
          success: true,
          count: patientQuery.patients.length,
          sampleData: patientQuery.patients[0] || null
        })
      }
    } catch (error) {
      results.push({
        table: 'patients',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test locations with just id and name
    try {
      const locationQuery = await greyfinchService.makeGraphQLRequest(`
        query GetLocations {
          locations {
            id
            name
          }
        }
      `)
      
      if (locationQuery?.locations) {
        results.push({
          table: 'locations',
          success: true,
          count: locationQuery.locations.length,
          sampleData: locationQuery.locations[0] || null
        })
      }
    } catch (error) {
      results.push({
        table: 'locations',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test appointments with just id
    try {
      const appointmentQuery = await greyfinchService.makeGraphQLRequest(`
        query GetAppointments {
          appointments {
            id
          }
        }
      `)
      
      if (appointmentQuery?.appointments) {
        results.push({
          table: 'appointments',
          success: true,
          count: appointmentQuery.appointments.length,
          sampleData: appointmentQuery.appointments[0] || null
        })
      }
    } catch (error) {
      results.push({
        table: 'appointments',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test leads with just id
    try {
      const leadQuery = await greyfinchService.makeGraphQLRequest(`
        query GetLeads {
          leads {
            id
          }
        }
      `)
      
      if (leadQuery?.leads) {
        results.push({
          table: 'leads',
          success: true,
          count: leadQuery.leads.length,
          sampleData: leadQuery.leads[0] || null
        })
      }
    } catch (error) {
      results.push({
        table: 'leads',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    const workingTests = results.filter(r => r.success)
    const failingTests = results.filter(r => !r.success)
    
    return NextResponse.json({
      success: true,
      message: 'Simple test completed',
      summary: {
        totalTests: results.length,
        workingTests: workingTests.length,
        failingTests: failingTests.length
      },
      workingTests,
      failingTests
    })
    
  } catch (error) {
    console.error('Greyfinch simple test failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Simple test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
