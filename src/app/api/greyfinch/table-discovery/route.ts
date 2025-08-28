import { NextRequest, NextResponse } from 'next/server'
import { GreyfinchService } from '@/lib/services/greyfinch'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting table name discovery...')
    
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

    console.log('✅ Connected to Greyfinch API, starting table discovery...')

    const results = {
      workingFields: [] as string[],
      failingFields: [] as Array<{field: string, error: string}>,
      insights: [] as string[],
      timestamp: new Date().toISOString()
    }

    // Medical/Practice Management specific field names
    const medicalFields = [
      // Patient-related
      'patient', 'patients', 'patient_records', 'patient_data', 'patient_list',
      'client', 'clients', 'client_records', 'client_data',
      'customer', 'customers', 'customer_records', 'customer_data',
      
      // Appointment-related
      'appointment', 'appointments', 'appointment_records', 'appointment_data',
      'visit', 'visits', 'visit_records', 'visit_data',
      'session', 'sessions', 'session_records', 'session_data',
      'booking', 'bookings', 'booking_records', 'booking_data',
      'schedule', 'schedules', 'schedule_records', 'schedule_data',
      
      // Medical-specific
      'case', 'cases', 'case_records', 'case_data',
      'treatment', 'treatments', 'treatment_records', 'treatment_data',
      'procedure', 'procedures', 'procedure_records', 'procedure_data',
      'diagnosis', 'diagnoses', 'diagnosis_records', 'diagnosis_data',
      
      // Location/Office
      'location', 'locations', 'location_records', 'location_data',
      'office', 'offices', 'office_records', 'office_data',
      'practice', 'practices', 'practice_records', 'practice_data',
      'clinic', 'clinics', 'clinic_records', 'clinic_data',
      'facility', 'facilities', 'facility_records', 'facility_data',
      
      // Lead/Prospect
      'lead', 'leads', 'lead_records', 'lead_data',
      'prospect', 'prospects', 'prospect_records', 'prospect_data',
      'inquiry', 'inquiries', 'inquiry_records', 'inquiry_data',
      'referral', 'referrals', 'referral_records', 'referral_data',
      
      // Staff/User
      'staff', 'staff_member', 'staff_members', 'staff_records',
      'user', 'users', 'user_records', 'user_data',
      'employee', 'employees', 'employee_records', 'employee_data',
      'provider', 'providers', 'provider_records', 'provider_data',
      'doctor', 'doctors', 'doctor_records', 'doctor_data',
      
      // Financial
      'invoice', 'invoices', 'invoice_records', 'invoice_data',
      'payment', 'payments', 'payment_records', 'payment_data',
      'billing', 'billing_records', 'billing_data',
      'insurance', 'insurance_records', 'insurance_data',
      
      // Generic database names
      'table', 'tables', 'record', 'records', 'data', 'dataset',
      'collection', 'collections', 'item', 'items', 'entry', 'entries',
      'row', 'rows', 'entity', 'entities', 'object', 'objects'
    ]

    console.log(`🧪 Testing ${medicalFields.length} medical/practice management field names...`)

    for (const fieldName of medicalFields) {
      try {
        console.log(`Testing field: ${fieldName}`)
        
        const query = await greyfinch.makeGraphQLRequest(`
          query Test${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} {
            ${fieldName} {
              __typename
              id
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
                  createdAt
                  updatedAt
                  __typename
                }
              }
            `)
            
            if (detailQuery && detailQuery[fieldName] && Array.isArray(detailQuery[fieldName])) {
              const count = detailQuery[fieldName].length
              results.insights.push(`${fieldName}: Found ${count} records`)
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

    console.log(`📊 Table discovery complete. Working fields: ${results.workingFields.length}, Failed: ${results.failingFields.length}`)

    return NextResponse.json({
      success: true,
      message: 'Table discovery completed',
      data: results
    })

  } catch (error) {
    console.error('❌ Table discovery error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to complete table discovery',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
