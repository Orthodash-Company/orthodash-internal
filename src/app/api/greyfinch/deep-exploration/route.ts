import { NextRequest, NextResponse } from 'next/server'

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
}
