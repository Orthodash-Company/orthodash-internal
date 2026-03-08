import { NextRequest, NextResponse } from 'next/server'

import { requireAuthUser } from '@/lib/require-auth-user'
import { greyfinchSyncService } from '@/lib/services/greyfinch-sync'
import { GreyfinchSchemaUtils } from '@/lib/services/greyfinch-schema'

export async function POST(_request: NextRequest) {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser()
    if (!user) {
      return unauthorizedResponse
    }

    console.log('🔄 Starting Greyfinch data sync for user:', user.id)

    const rawGreyfinchData = await GreyfinchSchemaUtils.getAnalyticsData()
    await greyfinchSyncService.syncAllData(user.id, { data: rawGreyfinchData })

    const processedData = GreyfinchSchemaUtils.processDataByLocation(rawGreyfinchData)

    return NextResponse.json({
      success: true,
      message: 'Greyfinch data synced successfully',
      data: {
        ...processedData,
        lastUpdated: new Date().toISOString(),
        apiStatus: 'Gilbert Data',
      },
    })
  } catch (error) {
    console.error('❌ Greyfinch sync error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to sync Greyfinch data',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
