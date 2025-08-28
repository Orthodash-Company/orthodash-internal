import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  // Temporarily disabled to prevent GraphQL errors
  return NextResponse.json({
    success: true,
    message: 'Parameter testing temporarily disabled',
    data: {
      workingQueries: [],
      failingQueries: [],
      insights: ['Parameter testing disabled to prevent GraphQL errors'],
      timestamp: new Date().toISOString()
    }
  })

    const results = {
      workingQueries: [] as Array<{name: string, result: any}>,
      failingQueries: [] as Array<{name: string, error: string}>,
      insights: [] as string[],
      timestamp: new Date().toISOString()
    }

    // Test queries with parameters based on dashboard patterns
    const parameterQueries = [
      {
        name: 'Office with Quarter Parameter',
        query: `query GetOfficeData($quarter: String, $year: Int) {
          office(quarter: $quarter, year: $year) {
            name
            count
            value
          }
        }`,
        variables: { quarter: 'Q2', year: 2025 }
      },
      {
        name: 'Appointments with Location Parameter',
        query: `query GetAppointments($location: String, $period: String) {
          appointments(location: $location, period: $period) {
            count
            office
            quarter
            year
          }
        }`,
        variables: { location: 'Gilbert', period: 'Q2 2025' }
      },
      {
        name: 'New Patient Appointments with Filters',
        query: `query GetNewPatientAppointments($office: String, $quarter: String, $year: Int) {
          newPatientAppointments(office: $office, quarter: $quarter, year: $year) {
            count
            office
            quarter
            year
          }
        }`,
        variables: { office: 'Gilbert', quarter: 'Q2', year: 2025 }
      },
      {
        name: 'No Shows with Parameters',
        query: `query GetNoShows($location: String, $unit: String, $year: Int) {
          noShows(location: $location, unit: $unit, year: $year) {
            count
            percentage
            office
            quarter
          }
        }`,
        variables: { location: 'Gilbert', unit: 'Quarter', year: 2025 }
      },
      {
        name: 'Production Data with Filters',
        query: `query GetProduction($office: String, $period: String) {
          production(office: $office, period: $period) {
            count
            office
            period
            year
          }
        }`,
        variables: { office: 'Gilbert', period: 'Q2 2025' }
      },
      {
        name: 'Collections with Location',
        query: `query GetCollections($location: String, $quarter: String) {
          collections(location: $location, quarter: $quarter) {
            count
            office
            quarter
            year
          }
        }`,
        variables: { location: 'Gilbert', quarter: 'Q2' }
      },
      {
        name: 'Reports with Parameters',
        query: `query GetReports($type: String, $location: String, $period: String) {
          reports(type: $type, location: $location, period: $period) {
            data
            office
            period
          }
        }`,
        variables: { type: 'newPatientAppointments', location: 'Gilbert', period: 'Q2 2025' }
      },
      {
        name: 'Analytics with Filters',
        query: `query GetAnalytics($metric: String, $office: String, $quarter: String) {
          analytics(metric: $metric, office: $office, quarter: $quarter) {
            value
            office
            quarter
            year
          }
        }`,
        variables: { metric: 'newPatientAppointments', office: 'Gilbert', quarter: 'Q2' }
      }
    ]

    console.log(`🧪 Testing ${parameterQueries.length} parameterized queries...`)

    for (const queryTest of parameterQueries) {
      try {
        console.log(`Testing query: ${queryTest.name}`)
        
        const result = await greyfinch.makeGraphQLRequest(queryTest.query, queryTest.variables)
        
        if (result && Object.keys(result).length > 0) {
          console.log(`✅ ${queryTest.name} works!`)
          results.workingQueries.push({
            name: queryTest.name,
            result: result
          })
          
          // Add insights based on the result
          const keys = Object.keys(result)
          results.insights.push(`${queryTest.name} returned: ${keys.join(', ')}`)
        } else {
          console.log(`❌ ${queryTest.name} returned no data`)
          results.failingQueries.push({
            name: queryTest.name,
            error: 'No data returned'
          })
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ ${queryTest.name} failed: ${errorMessage}`)
        results.failingQueries.push({
          name: queryTest.name,
          error: errorMessage
        })
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    console.log(`📊 Parameter testing complete. Working queries: ${results.workingQueries.length}, Failed: ${results.failingQueries.length}`)

    return NextResponse.json({
      success: true,
      message: 'Parameter-based query testing completed',
      data: results
    })

  } catch (error) {
    console.error('❌ Parameter testing error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to complete parameter testing',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
