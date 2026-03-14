import { z } from 'zod'
import { NextResponse } from 'next/server'
import { tryCatch } from '@/lib/try-catch'
import { requireAuthUser } from '@/lib/require-auth-user'
import { LocationSchema } from '@/lib/services/greyfinch/types'
import { GQL_LOCATIONS } from '@/lib/services/greyfinch/queries'
import { greyfinchService } from '@/lib/services/greyfinch/client'

const LOCATION_IDS = [
  '097eb1d8-ec62-45d9-8c21-d08af1cf66c8', // Gilbert
  '4a2bf9bd-222b-4690-9d12-5fc95daa7d93', // Phoenix-Ahwatukee
];

export const GET = async () => {

  const { user, unauthorizedResponse } = await requireAuthUser()
  if (!user) return unauthorizedResponse

  const [dataGetLocations, errorGetLocations] = await tryCatch(greyfinchService.makeGraphQLRequest(GQL_LOCATIONS))

  if (errorGetLocations) {

    console.error('[locations] Error:', errorGetLocations)

    return NextResponse.json(
      { success: false, error: errorGetLocations },
      { status: 502 }
    )
  }

  const parseResultLocations = z.array(LocationSchema).safeParse(dataGetLocations.locations)

  if (!parseResultLocations.success) {

    console.error('[locations] Error:', parseResultLocations.error)

    return NextResponse.json(
      { success: false, error: parseResultLocations.error },
      { status: 502 }
    )
  }

  const locations = parseResultLocations.data
    .filter(({ id }) => LOCATION_IDS.includes(id))

  return NextResponse.json({
    success: true,
    data: { locations, lastUpdated: new Date().toISOString() },
  })
}
