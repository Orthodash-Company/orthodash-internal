// GET /api/greyfinch/locations
// Runs GetLocations query — returns the two active dashboard locations.
// Used by LocationsManager and the Live Data tab.

import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch/client'
import { GQL_LOCATIONS, DASHBOARD_LOCATION_IDS } from '@/lib/services/greyfinch/queries'
import { requireAuthUser } from '@/lib/require-auth-user'

export async function GET(_request: NextRequest) {
  const { user, unauthorizedResponse } = await requireAuthUser()
  if (!user) return unauthorizedResponse

  try {
    const result = await greyfinchService.makeGraphQLRequest(GQL_LOCATIONS)

    const allLocations: Array<{ id: string; name: string }> = Array.isArray(result?.locations)
      ? (result.locations as Array<{ id: string; name: string }>)
      : []

    // Only expose the two active dashboard locations
    const locations = allLocations.filter((loc) =>
      (DASHBOARD_LOCATION_IDS as readonly string[]).includes(loc.id)
    )

    return NextResponse.json({
      success: true,
      data: {
        locations,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[analytics] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    )
  }
}
