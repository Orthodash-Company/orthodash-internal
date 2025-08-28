import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Temporarily disabled to prevent GraphQL errors
  return NextResponse.json({
    success: true,
    message: 'Analytics temporarily disabled',
    data: {
      locations: {
        gilbert: { count: 2, dateAdded: new Date().toISOString() },
        scottsdale: { count: 2, dateAdded: new Date().toISOString() }
      },
      patients: { count: 0, dateAdded: null },
      appointments: { count: 0, dateAdded: null },
      leads: { count: 0, dateAdded: null },
      lastUpdated: new Date().toISOString()
    }
  })
}
