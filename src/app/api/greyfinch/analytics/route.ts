import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting analytics data collection for Gilbert and Scottsdale locations...')
    
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

    console.log('✅ Connected to Greyfinch API, collecting analytics data...')

    const analyticsData = {
      locations: {
        gilbert: { count: 0, dateAdded: null },
        scottsdale: { count: 0, dateAdded: null }
      },
      patients: { count: 0, dateAdded: null },
      appointments: { count: 0, dateAdded: null },
      leads: { count: 0, dateAdded: null },
      lastUpdated: new Date().toISOString()
    }

    // Try to get location data first
    console.log('📍 Attempting to get location data...')
    try {
      // Try different location field names
      const locationFields = ['locations', 'location', 'office', 'offices', 'practice_locations']
      
      for (const fieldName of locationFields) {
        try {
          const locationQuery = await greyfinch.makeGraphQLRequest(`
            query GetLocations {
              ${fieldName} {
                id
                name
                address
                createdAt
                dateAdded
                created_at
                date_added
              }
            }
          `)
          
          if (locationQuery?.[fieldName] && Array.isArray(locationQuery[fieldName])) {
            const locations = locationQuery[fieldName]
            console.log(`✅ Found ${locations.length} locations using field: ${fieldName}`)
            
            // Filter for Gilbert and Scottsdale
            const gilbertLocation = locations.find((loc: any) => 
              loc.name?.toLowerCase().includes('gilbert') || 
              loc.address?.toLowerCase().includes('gilbert')
            )
            
            const scottsdaleLocation = locations.find((loc: any) => 
              loc.name?.toLowerCase().includes('scottsdale') || 
              loc.address?.toLowerCase().includes('scottsdale')
            )
            
            if (gilbertLocation) {
              analyticsData.locations.gilbert.count = 1
              analyticsData.locations.gilbert.dateAdded = gilbertLocation.createdAt || gilbertLocation.dateAdded || gilbertLocation.created_at || gilbertLocation.date_added
            }
            
            if (scottsdaleLocation) {
              analyticsData.locations.scottsdale.count = 1
              analyticsData.locations.scottsdale.dateAdded = scottsdaleLocation.createdAt || scottsdaleLocation.dateAdded || scottsdaleLocation.created_at || scottsdaleLocation.date_added
            }
            
            break // Found working field, stop trying others
          }
        } catch (e) {
          console.log(`❌ Location field '${fieldName}' failed:`, e)
        }
      }
    } catch (e) {
      console.log('❌ Location query failed:', e)
    }

    // Try to get patient count
    console.log('👥 Attempting to get patient count...')
    try {
      const patientFields = ['patients', 'patient', 'patient_records', 'patient_data']
      
      for (const fieldName of patientFields) {
        try {
          const patientQuery = await greyfinch.makeGraphQLRequest(`
            query GetPatients {
              ${fieldName} {
                id
                createdAt
                dateAdded
                created_at
                date_added
              }
            }
          `)
          
          if (patientQuery?.[fieldName] && Array.isArray(patientQuery[fieldName])) {
            const patients = patientQuery[fieldName]
            analyticsData.patients.count = patients.length
            
            // Get earliest date added
            const dates = patients
              .map((p: any) => p.createdAt || p.dateAdded || p.created_at || p.date_added)
              .filter(Boolean)
              .sort()
            
            if (dates.length > 0) {
              analyticsData.patients.dateAdded = dates[0]
            }
            
            console.log(`✅ Found ${patients.length} patients using field: ${fieldName}`)
            break
          }
        } catch (e) {
          console.log(`❌ Patient field '${fieldName}' failed:`, e)
        }
      }
    } catch (e) {
      console.log('❌ Patient query failed:', e)
    }

    // Try to get appointment count
    console.log('📅 Attempting to get appointment count...')
    try {
      const appointmentFields = ['appointments', 'appointment', 'appointment_records', 'appointment_data']
      
      for (const fieldName of appointmentFields) {
        try {
          const appointmentQuery = await greyfinch.makeGraphQLRequest(`
            query GetAppointments {
              ${fieldName} {
                id
                createdAt
                dateAdded
                created_at
                date_added
              }
            }
          `)
          
          if (appointmentQuery?.[fieldName] && Array.isArray(appointmentQuery[fieldName])) {
            const appointments = appointmentQuery[fieldName]
            analyticsData.appointments.count = appointments.length
            
            // Get earliest date added
            const dates = appointments
              .map((a: any) => a.createdAt || a.dateAdded || a.created_at || a.date_added)
              .filter(Boolean)
              .sort()
            
            if (dates.length > 0) {
              analyticsData.appointments.dateAdded = dates[0]
            }
            
            console.log(`✅ Found ${appointments.length} appointments using field: ${fieldName}`)
            break
          }
        } catch (e) {
          console.log(`❌ Appointment field '${fieldName}' failed:`, e)
        }
      }
    } catch (e) {
      console.log('❌ Appointment query failed:', e)
    }

    // Try to get lead count
    console.log('🎯 Attempting to get lead count...')
    try {
      const leadFields = ['leads', 'lead', 'lead_records', 'lead_data', 'prospects']
      
      for (const fieldName of leadFields) {
        try {
          const leadQuery = await greyfinch.makeGraphQLRequest(`
            query GetLeads {
              ${fieldName} {
                id
                createdAt
                dateAdded
                created_at
                date_added
              }
            }
          `)
          
          if (leadQuery?.[fieldName] && Array.isArray(leadQuery[fieldName])) {
            const leads = leadQuery[fieldName]
            analyticsData.leads.count = leads.length
            
            // Get earliest date added
            const dates = leads
              .map((l: any) => l.createdAt || l.dateAdded || l.created_at || l.date_added)
              .filter(Boolean)
              .sort()
            
            if (dates.length > 0) {
              analyticsData.leads.dateAdded = dates[0]
            }
            
            console.log(`✅ Found ${leads.length} leads using field: ${fieldName}`)
            break
          }
        } catch (e) {
          console.log(`❌ Lead field '${fieldName}' failed:`, e)
        }
      }
    } catch (e) {
      console.log('❌ Lead query failed:', e)
    }

    console.log('📊 Analytics data collected:', analyticsData)

    return NextResponse.json({
      success: true,
      message: 'Analytics data collected successfully',
      data: analyticsData
    })

  } catch (error) {
    console.error('❌ Analytics endpoint error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to collect analytics data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
