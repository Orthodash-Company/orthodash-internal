import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  // Temporarily disabled to prevent GraphQL errors
  return NextResponse.json({
    success: true,
    message: 'Dashboard discovery temporarily disabled',
    data: {
      workingQueries: [],
      failingQueries: [],
      insights: ['Dashboard discovery disabled to prevent GraphQL errors'],
      timestamp: new Date().toISOString()
    }
  })
  try {
    console.log('🔍 Starting dashboard-based field discovery...')
    
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

    console.log('✅ Connected to Greyfinch API, starting dashboard-based discovery...')

    const results = {
      workingFields: [] as string[],
      failingFields: [] as Array<{field: string, error: string}>,
      insights: [] as string[],
      timestamp: new Date().toISOString()
    }

    // Field names based on the actual dashboard data
    const dashboardFields = [
      // Office/Location related
      'office', 'offices', 'gilbert', 'scottsdale', 'location', 'locations',
      
      // Patient related (from dashboard)
      'newPatientAppointments', 'newPatientStarts', 'newPatientAppointment', 'newPatientStart',
      'patientAppointments', 'patientStarts', 'patientAppointment', 'patientStart',
      
      // Appointment related
      'appointments', 'appointment', 'newAppointments', 'newAppointment',
      
      // No shows (from dashboard)
      'noShows', 'noShow', 'noShowsPercentage', 'noShowPercentage',
      
      // Collections (from dashboard)
      'collections', 'collection',
      
      // Production (from dashboard)
      'production', 'productions',
      
      // Time-based queries (from dashboard patterns)
      'quarterly', 'quarterlyData', 'quarterlyReport', 'quarterlyStats',
      'monthly', 'monthlyData', 'monthlyReport', 'monthlyStats',
      'yearly', 'yearlyData', 'yearlyReport', 'yearlyStats',
      
      // Report/analytics related
      'reports', 'report', 'analytics', 'analytic', 'stats', 'statistics',
      'metrics', 'metric', 'kpis', 'kpi', 'dashboard', 'dashboardData',
      
      // Data aggregation
      'summary', 'summaries', 'overview', 'overviews', 'data', 'dataset',
      
      // Specific to practice management
      'practice', 'practices', 'clinic', 'clinics', 'medical', 'healthcare'
    ]

    console.log(`🧪 Testing ${dashboardFields.length} dashboard-based field names...`)

    for (const fieldName of dashboardFields) {
      try {
        console.log(`Testing field: ${fieldName}`)
        
        const query = await greyfinch.makeGraphQLRequest(`
          query Test${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              __typename
              id
              name
              count
              value
              office
              location
            }
          }
        `)
        
        if (query && query[fieldName]) {
          console.log(`✅ Field '${fieldName}' works!`)
          results.workingFields.push(fieldName)
          
          // Try to get more details about this field
          try {
            const detailQuery = await greyfinch.makeGraphQLRequest(`
              query Get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Details {
                ${fieldName} {
                  id
                  name
                  count
                  value
                  office
                  location
                  quarter
                  year
                  __typename
                }
              }
            `)
            
            if (detailQuery && detailQuery[fieldName] && Array.isArray(detailQuery[fieldName])) {
              const count = detailQuery[fieldName].length
              results.insights.push(`${fieldName}: Found ${count} records`)
              
              // Check for specific data patterns
              const firstRecord = detailQuery[fieldName][0]
              if (firstRecord) {
                const keys = Object.keys(firstRecord)
                results.insights.push(`${fieldName} has fields: ${keys.join(', ')}`)
              }
            }
          } catch (detailError) {
            console.log(`Detail query for ${fieldName} failed:`, detailError)
          }
        } else {
          console.log(`❌ Field '${fieldName}' returned no data`)
          results.failingFields.push({
            field: fieldName,
            error: 'No data returned'
          })
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150))
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ Field '${fieldName}' failed: ${errorMessage}`)
        results.failingFields.push({
          field: fieldName,
          error: errorMessage
        })
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    }

    console.log(`📊 Dashboard discovery complete. Working fields: ${results.workingFields.length}, Failed: ${results.failingFields.length}`)

    return NextResponse.json({
      success: true,
      message: 'Dashboard-based field discovery completed',
      data: results
    })

  } catch (error) {
    console.error('❌ Dashboard discovery error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to complete dashboard discovery',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
