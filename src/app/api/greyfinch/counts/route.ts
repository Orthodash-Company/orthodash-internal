// GET /api/greyfinch/counts
// Fetches patient, lead, and appointment booking counts from Greyfinch.
//
// NOTE: patients and appointmentBookings are capped at 20 by Greyfinch regardless of limit —
// their semantic meaning is unclear (they do not represent all-time totals).
// leads returns the true total and is the most reliable count here.

import { NextRequest, NextResponse } from 'next/server'
import { greyfinchService } from '@/lib/services/greyfinch'
import { GQL_BASIC_COUNTS } from '@/lib/services/greyfinch-queries'

export async function GET(_request: NextRequest) {
  try {
    const result = await greyfinchService.makeGraphQLRequest(GQL_BASIC_COUNTS)

    const patients = Array.isArray(result?.patients)
      ? (result.patients as unknown[]).length
      : null
    const leads = Array.isArray(result?.leads)
      ? (result.leads as unknown[]).length
      : null
    const appointments = Array.isArray(result?.appointmentBookings)
      ? (result.appointmentBookings as unknown[]).length
      : null

    return NextResponse.json({
      success: true,
      data: { patients, leads, appointments },
    })
  } catch (error) {
    console.error('[counts] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    )
  }
}
