import { NextRequest, NextResponse } from 'next/server'
import { QuickBooksService } from '@/lib/services/quickbooks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    console.log('QuickBooks OAuth request:', { action, hasCode: !!code, hasState: !!state })

    const quickbooksService = new QuickBooksService()

    switch (action) {
      case 'authorize':
        // Generate authorization URL
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/quickbooks/auth?action=callback`
        const authUrl = quickbooksService.getAuthorizationUrl(callbackUrl)
        
        console.log('Generated QuickBooks authorization URL')
        
        return NextResponse.json({
          success: true,
          message: 'Authorization URL generated',
          authUrl,
          callbackUrl
        })

      case 'callback':
        // Handle OAuth callback
        if (!code) {
          return NextResponse.json({
            success: false,
            message: 'Authorization code not provided'
          }, { status: 400 })
        }

        try {
          const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/quickbooks/auth?action=callback`
          const tokenData = await quickbooksService.exchangeCodeForToken(code, callbackUrl)
          
          console.log('QuickBooks token exchange successful')
          
          return NextResponse.json({
            success: true,
            message: 'QuickBooks authorization successful',
            tokenData: {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiresIn: tokenData.expires_in,
              tokenType: tokenData.token_type
            }
          })
        } catch (tokenError: any) {
          console.error('QuickBooks token exchange failed:', tokenError)
          return NextResponse.json({
            success: false,
            message: 'Failed to exchange authorization code for token',
            error: tokenError.message
          }, { status: 400 })
        }

      case 'test':
        // Test connection
        try {
          const isConnected = await quickbooksService.testConnection()
          
          if (isConnected) {
            return NextResponse.json({
              success: true,
              message: 'QuickBooks connection successful'
            })
          } else {
            return NextResponse.json({
              success: false,
              message: 'QuickBooks connection failed'
            }, { status: 400 })
          }
        } catch (testError: any) {
          console.error('QuickBooks connection test failed:', testError)
          return NextResponse.json({
            success: false,
            message: 'QuickBooks connection test failed',
            error: testError.message
          }, { status: 400 })
        }

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error: any) {
    console.error('QuickBooks auth endpoint error:', error)
    return NextResponse.json({
      success: false,
      message: 'QuickBooks authentication failed',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { consumerKey, consumerSecret, accessToken, accessTokenSecret, companyId, sandbox } = body

    console.log('Updating QuickBooks credentials...')

    const quickbooksService = new QuickBooksService()
    quickbooksService.updateCredentials(
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      companyId
    )

    // Test the connection
    const isConnected = await quickbooksService.testConnection()

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'QuickBooks credentials updated and connection verified'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'QuickBooks credentials updated but connection test failed'
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('QuickBooks credentials update error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update QuickBooks credentials',
      error: error.message
    }, { status: 500 })
  }
}
