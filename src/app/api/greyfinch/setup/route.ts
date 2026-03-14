import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch/client'
import { requireAuthUser } from '@/lib/require-auth-user'

export async function POST(request: NextRequest) {
  const { user, unauthorizedResponse } = await requireAuthUser()
  if (!user) return unauthorizedResponse

  try {
    const { apiKey, apiSecret } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'API key is required' }, { status: 400 })
    }

    greyfinchService.updateCredentials(apiKey, apiSecret)

    const connectionTest = await greyfinchService.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Greyfinch API',
        error: connectionTest.message,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Greyfinch connection successful',
      data: connectionTest.data,
    })
  } catch (error) {
    console.error('Greyfinch setup failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Greyfinch API',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
