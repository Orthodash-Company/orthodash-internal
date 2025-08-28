import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  // Temporarily disabled to prevent GraphQL errors
  return NextResponse.json({
    success: true,
    message: 'Deep exploration temporarily disabled',
    data: {
      workingQueries: [],
      failingQueries: [],
      insights: ['Deep exploration disabled to prevent GraphQL errors'],
      timestamp: new Date().toISOString()
    }
  })
  try {
    console.log('🔍 Starting deep API exploration...')
    
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

    console.log('✅ Connected to Greyfinch API, starting deep exploration...')

    const results = {
      queries: [] as Array<{name: string, result: any, error?: string}>,
      mutations: [] as Array<{name: string, result: any, error?: string}>,
      insights: [] as string[],
      timestamp: new Date().toISOString()
    }

    // Test different query patterns
    const queryTests = [
      {
        name: 'Basic Type Query',
        query: `query { __typename }`
      },
      {
        name: 'Schema Query',
        query: `query { __schema { types { name } } }`
      },
      {
        name: 'Root Type Query',
        query: `query { __schema { queryType { name fields { name } } } }`
      },
      {
        name: 'All Types Query',
        query: `query { __schema { types { name kind } } }`
      },
      {
        name: 'Test with Arguments',
        query: `query { patients(limit: 1) { id } }`
      },
      {
        name: 'Test with Variables',
        query: `query GetData($limit: Int) { patients(limit: $limit) { id } }`,
        variables: { limit: 1 }
      },
      {
        name: 'Test with Aliases',
        query: `query { 
          patientData: patients { id }
          appointmentData: appointments { id }
        }`
      },
      {
        name: 'Test with Fragments',
        query: `query {
          ... on query_root {
            __typename
          }
        }`
      }
    ]

    // Test mutation patterns
    const mutationTests = [
      {
        name: 'Create Patient',
        query: `mutation { createPatient(input: {}) { id } }`
      },
      {
        name: 'Update Patient',
        query: `mutation { updatePatient(id: "1", input: {}) { id } }`
      },
      {
        name: 'Delete Patient',
        query: `mutation { deletePatient(id: "1") { id } }`
      }
    ]

    console.log('🧪 Testing query patterns...')

    for (const test of queryTests) {
      try {
        console.log(`Testing query: ${test.name}`)
        
        let result
        if (test.variables) {
          result = await greyfinch.makeGraphQLRequest(test.query, test.variables)
        } else {
          result = await greyfinch.makeGraphQLRequest(test.query)
        }
        
        results.queries.push({
          name: test.name,
          result: result
        })
        
        console.log(`✅ ${test.name} result:`, result)
        
        // Add insights based on the result
        if (result && typeof result === 'object') {
          const keys = Object.keys(result)
          if (keys.length > 0) {
            results.insights.push(`${test.name} returned keys: ${keys.join(', ')}`)
          }
          
          // Check for schema information
          if (result.__schema) {
            results.insights.push(`${test.name} returned schema information`)
          }
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ ${test.name} failed: ${errorMessage}`)
        
        results.queries.push({
          name: test.name,
          result: null,
          error: errorMessage
        })
        
        // Add insights based on the error
        if (errorMessage.includes('introspection')) {
          results.insights.push('Introspection queries are disabled')
        }
        if (errorMessage.includes('suggestion')) {
          results.insights.push('API provides field suggestions (hidden)')
        }
        if (errorMessage.includes('mutation')) {
          results.insights.push('Mutations may not be supported')
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    console.log('🧪 Testing mutation patterns...')

    for (const test of mutationTests) {
      try {
        console.log(`Testing mutation: ${test.name}`)
        
        const result = await greyfinch.makeGraphQLRequest(test.query)
        
        results.mutations.push({
          name: test.name,
          result: result
        })
        
        console.log(`✅ ${test.name} result:`, result)
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ ${test.name} failed: ${errorMessage}`)
        
        results.mutations.push({
          name: test.name,
          result: null,
          error: errorMessage
        })
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    console.log(`📊 Deep exploration complete. Queries: ${results.queries.length}, Mutations: ${results.mutations.length}`)

    return NextResponse.json({
      success: true,
      message: 'Deep API exploration completed',
      data: results
    })

  } catch (error) {
    console.error('❌ Deep exploration error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to complete deep exploration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
