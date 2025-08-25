import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret } = await request.json()
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "API key and secret are required" }, { status: 400 })
    }

    // Update environment variables for this session
    process.env.GREYFINCH_API_KEY = apiKey.trim()
    process.env.GREYFINCH_API_SECRET = apiSecret.trim()

    // Test the new credentials
    const testResponse = await fetch('https://api.greyfinch.com/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey.trim(),
        'X-API-Secret': apiSecret.trim(),
      },
      body: JSON.stringify({
        query: 'query { __schema { queryType { name } } }'
      })
    })
    
    if (!testResponse.ok) {
      throw new Error(`API test failed: ${testResponse.status}`)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "API credentials updated and verified successfully"
    })
  } catch (error) {
    console.error('Failed to setup Greyfinch credentials:', error)
    return NextResponse.json({ 
      error: "Failed to setup credentials",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
