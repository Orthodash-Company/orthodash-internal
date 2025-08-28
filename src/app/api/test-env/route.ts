import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const envInfo = {
      hasGreyfinchApiKey: !!process.env.GREYFINCH_API_KEY,
      hasGreyfinchApiSecret: !!process.env.GREYFINCH_API_SECRET,
      apiKeyLength: process.env.GREYFINCH_API_KEY?.length || 0,
      apiSecretLength: process.env.GREYFINCH_API_SECRET?.length || 0,
      apiKeyPrefix: process.env.GREYFINCH_API_KEY ? process.env.GREYFINCH_API_KEY.substring(0, 8) + '...' : 'none',
      nodeEnv: process.env.NODE_ENV
    }
    
    return NextResponse.json({
      success: true,
      envInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
