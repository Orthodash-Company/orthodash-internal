import { NextRequest, NextResponse } from 'next/server'

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
}
