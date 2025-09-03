import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting basic API exploration...')
    
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

    console.log('✅ Connected to Greyfinch API, starting basic exploration...')

    const results = {
      basicQueries: [] as Array<{query: string, result: any, error?: string}>,
      insights: [] as string[],
      timestamp: new Date().toISOString()
    }

    // Test very basic queries to understand the API structure
    const basicQueries = [
      {
        name: 'Empty Query',
        query: `query { __typename }`
      },
      {
        name: 'Patients Query',
        query: `query GetPatients {
          patients {
            id
            firstName
            lastName
          }
        }`
      },
      {
        name: 'Simple Type Query',
        query: `query { __typename }`
      },
      {
        name: 'Test with ID',
        query: `query { id }`
      },
      {
        name: 'Test with Name',
        query: `query { name }`
      },
      {
        name: 'Test with Data',
        query: `query { data }`
      },
      {
        name: 'Test with Records',
        query: `query { records }`
      },
      {
        name: 'Test with Items',
        query: `query { items }`
      },
      {
        name: 'Test with Entities',
        query: `query { entities }`
      },
      {
        name: 'Test with Objects',
        query: `query { objects }`
      }
    ]

    console.log(`🧪 Testing ${basicQueries.length} basic queries...`)

    for (const queryTest of basicQueries) {
      try {
        console.log(`Testing: ${queryTest.name}`)
        
        const result = await greyfinch.makeGraphQLRequest(queryTest.query)
        
        results.basicQueries.push({
          query: queryTest.name,
          result: result
        })
        
        console.log(`✅ ${queryTest.name} result:`, result)
        
        // Add insights based on the result
        if (result && typeof result === 'object') {
          const keys = Object.keys(result)
          if (keys.length > 0) {
            results.insights.push(`${queryTest.name} returned keys: ${keys.join(', ')}`)
          }
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ ${queryTest.name} failed: ${errorMessage}`)
        
        results.basicQueries.push({
          query: queryTest.name,
          result: null,
          error: errorMessage
        })
        
        // Add insights based on the error
        if (errorMessage.includes('introspection')) {
          results.insights.push('Introspection is disabled')
        }
        if (errorMessage.includes('field')) {
          results.insights.push(`Field not found in ${queryTest.name}`)
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    console.log(`📊 Basic exploration complete. Insights: ${results.insights.length}`)

    return NextResponse.json({
      success: true,
      message: 'Basic API exploration completed',
      data: results
    })

  } catch (error) {
    console.error('❌ Basic exploration error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to complete basic exploration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
