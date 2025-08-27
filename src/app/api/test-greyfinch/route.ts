import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'
import { greyfinchSyncService } from '@/lib/services/greyfinch-sync'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 })
    }

    console.log('Testing Greyfinch data sync for user:', userId)

    // Step 1: Test Greyfinch API connection
    console.log('Step 1: Testing Greyfinch API connection...')
    const connectionTest = await greyfinchService.testConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Greyfinch API connection failed',
        error: connectionTest.message
      }, { status: 500 })
    }

    console.log('✅ Greyfinch API connection successful')

    // Step 2: Pull data from Greyfinch
    console.log('Step 2: Pulling data from Greyfinch...')
    const greyfinchData = await greyfinchService.pullAllData(userId)

    if (!greyfinchData.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to pull data from Greyfinch',
        error: greyfinchData.message
      }, { status: 500 })
    }

    console.log('✅ Greyfinch data pulled successfully:', greyfinchData.counts)

    // Step 3: Sync data to Supabase
    console.log('Step 3: Syncing data to Supabase...')
    await greyfinchSyncService.syncAllData(userId, greyfinchData)

    console.log('✅ Data synced to Supabase successfully')

    return NextResponse.json({
      success: true,
      message: 'Greyfinch data sync test completed successfully',
      data: {
        connection: connectionTest,
        greyfinchData: {
          counts: greyfinchData.counts
        },
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Greyfinch test failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Greyfinch test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
