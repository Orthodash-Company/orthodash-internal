import { NextRequest, NextResponse } from 'next/server'

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
}
