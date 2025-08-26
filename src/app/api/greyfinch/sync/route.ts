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

    console.log('Starting Greyfinch sync for user:', userId)

    // First pull fresh data from Greyfinch
    const greyfinchData = await greyfinchService.pullAllData(userId)

    if (!greyfinchData.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to pull data from Greyfinch',
        error: greyfinchData.message
      }, { status: 500 })
    }

    // Then sync to Supabase
    await greyfinchSyncService.syncAllData(userId, greyfinchData)

    return NextResponse.json({
      success: true,
      message: 'Greyfinch data synced successfully',
      data: {
        counts: greyfinchData.counts,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Greyfinch sync failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to sync Greyfinch data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
