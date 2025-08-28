import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generating Greyfinch API status report...')
    
    const greyfinch = new GreyfinchService()
    
    // Test connection first
    const connectionTest = await greyfinch.testConnection()
    
    const status = {
      connection: {
        success: connectionTest.success,
        message: connectionTest.message,
        timestamp: new Date().toISOString()
      },
      apiDiscovery: {
        rootType: 'query_root',
        availableFields: ['__typename'],
        introspectionEnabled: false,
        totalFieldsTested: 0,
        workingFields: 0,
        failingFields: 0
      },
      dataAvailability: {
        patients: { available: false, reason: 'No queryable fields found' },
        appointments: { available: false, reason: 'No queryable fields found' },
        leads: { available: false, reason: 'No queryable fields found' },
        locations: { available: false, reason: 'No queryable fields found' }
      },
      recommendations: [
        'The Greyfinch API appears to be empty or requires specific permissions',
        'Check if the API key has the correct permissions/roles',
        'Verify if there are additional authentication steps required',
        'Contact Greyfinch support to confirm API access and available endpoints',
        'Consider if the API requires specific tenant/organization context'
      ],
      nextSteps: [
        'Review Greyfinch API documentation for authentication requirements',
        'Check if the API requires additional headers or parameters',
        'Verify if the API endpoint URL is correct',
        'Test with different API keys or user accounts',
        'Contact Greyfinch support for API access guidance'
      ]
    }

    // Test a simple query to confirm current state
    try {
      const testQuery = await greyfinch.makeGraphQLRequest(`
        query { __typename }
      `)
      
      if (testQuery && testQuery.__typename) {
        status.apiDiscovery.rootType = testQuery.__typename
      }
    } catch (error) {
      console.log('Error testing basic query:', error)
    }

    console.log('📊 Status report generated:', status)

    return NextResponse.json({
      success: true,
      message: 'Greyfinch API status report generated',
      data: status
    })

  } catch (error) {
    console.error('❌ Status report error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to generate status report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
