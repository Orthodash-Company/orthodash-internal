import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Temporarily disabled to prevent GraphQL errors
  return NextResponse.json({
    success: true,
    message: 'Simple test route temporarily disabled',
    data: {
      patients: { count: 0, success: false },
      locations: { count: 0, success: false },
      appointments: { count: 0, success: false },
      leads: { count: 0, success: false },
      timestamp: new Date().toISOString()
    }
  })
}
