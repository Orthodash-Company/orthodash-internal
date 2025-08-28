import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Temporarily disabled to prevent GraphQL errors
  return NextResponse.json({
    success: true,
    message: 'Debug route temporarily disabled',
    data: {
      connection: 'disabled',
      timestamp: new Date().toISOString()
    }
  })
}
