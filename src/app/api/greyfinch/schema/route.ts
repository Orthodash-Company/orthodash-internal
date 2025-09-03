import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'
import { GreyfinchSchemaUtils, GREYFINCH_QUERIES } from '@/lib/services/greyfinch-schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeName = searchParams.get('type')
    const action = searchParams.get('action') || 'introspect'
    
    console.log('Greyfinch schema endpoint called:', { typeName, action })
    
    // Check if we have API credentials
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Greyfinch API key is not configured.',
        error: 'MISSING_API_KEY'
      }, { status: 400 })
    }
    
    // Update service with environment credentials
    greyfinchService.updateCredentials(envApiKey)
    
    let result: any
    
    switch (action) {
      case 'introspect':
        if (typeName) {
          // Get known fields for specific type
          result = GreyfinchSchemaUtils.getKnownTypeFields(typeName)
        } else {
          // Test connection
          result = await GreyfinchSchemaUtils.testConnection()
        }
        break
        
      case 'fields':
        if (!typeName) {
          return NextResponse.json({ 
            success: false, 
            message: 'Type name is required for fields action.',
            error: 'MISSING_TYPE_NAME'
          }, { status: 400 })
        }
        result = GreyfinchSchemaUtils.getKnownTypeFields(typeName)
        break
        
      case 'validate':
        const query = searchParams.get('query')
        if (!query) {
          return NextResponse.json({ 
            success: false, 
            message: 'Query is required for validation action.',
            error: 'MISSING_QUERY'
          }, { status: 400 })
        }
        result = GreyfinchSchemaUtils.validateQuery(query)
        break
        
      case 'patterns':
        // Return known field patterns
        result = {
          patterns: {
            patient: ['id', 'firstName', 'lastName', 'middleName', 'birthDate', 'gender', 'title', 'email', 'phone', 'primaryLocation', 'createdAt', 'updatedAt'],
            location: ['id', 'name', 'address', 'phone', 'email', 'isActive', 'createdAt', 'updatedAt'],
            appointment: ['id', 'patientId', 'locationId', 'appointmentType', 'status', 'scheduledDate', 'actualDate', 'duration', 'notes', 'createdAt', 'updatedAt'],
            lead: ['id', 'firstName', 'lastName', 'email', 'phone', 'source', 'status', 'createdAt', 'updatedAt'],
            booking: ['id', 'appointmentId', 'startTime', 'endTime', 'localStartDate', 'localStartTime', 'timezone', 'createdAt', 'updatedAt']
          }
        }
        break
        
      default:
        return NextResponse.json({ 
          success: false, 
          message: `Unknown action: ${action}`,
          error: 'UNKNOWN_ACTION',
          availableActions: ['introspect', 'fields', 'validate', 'patterns']
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Schema ${action} completed successfully`,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Schema introspection failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Schema introspection failed',
      error: 'SCHEMA_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, variables } = body
    
    if (!query) {
      return NextResponse.json({ 
        success: false, 
        message: 'Query is required.',
        error: 'MISSING_QUERY'
      }, { status: 400 })
    }
    
    console.log('Custom GraphQL query requested:', { query, variables })
    
    // Check if we have API credentials
    const envApiKey = process.env.GREYFINCH_API_KEY
    if (!envApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Greyfinch API key is not configured.',
        error: 'MISSING_API_KEY'
      }, { status: 400 })
    }
    
    // Update service with environment credentials
    greyfinchService.updateCredentials(envApiKey)
    
    // Validate query first
    const validation = GreyfinchSchemaUtils.validateQuery(query)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Query validation failed',
        errors: validation.errors,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }
    
    // Execute the query
    const result = await greyfinchService.makeGraphQLRequest(query, variables)
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Custom GraphQL query executed successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Custom GraphQL query failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Custom GraphQL query failed',
      error: 'QUERY_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
