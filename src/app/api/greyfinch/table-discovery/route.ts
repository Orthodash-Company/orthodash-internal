import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Temporarily disabled to prevent GraphQL errors
  return NextResponse.json({
    success: true,
    message: 'Table discovery temporarily disabled',
    data: {
      workingFields: [],
      failingFields: [],
      totalTested: 0,
      timestamp: new Date().toISOString()
    }
  })
}
