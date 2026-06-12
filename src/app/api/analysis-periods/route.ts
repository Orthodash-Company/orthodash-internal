import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthUser } from '@/lib/require-auth-user'
import { evaluateAnalysisPeriod } from '@/lib/services/greyfinch/analysis-period'

const CostSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  category: z.string(),
  date: z.string(),
})

const PeriodSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  locationIds: z.array(z.string()).default([]),
  acquisitionCosts: z.array(CostSchema).default([]),
})

const RequestSchema = z.object({
  periods: z.array(PeriodSchema),
  refresh: z.boolean().optional(),
})

const CONCURRENCY = 2

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      signal?.throwIfAborted()
      const index = nextIndex++
      results[index] = await mapper(items[index], index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  )

  return results
}

export async function POST(request: NextRequest) {
  const { user, unauthorizedResponse } = await requireAuthUser()
  if (!user) return unauthorizedResponse

  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { periods, refresh } = parsed.data

  try {
    const results = await mapWithConcurrency(periods, CONCURRENCY, (period) =>
      evaluateAnalysisPeriod(period, { refresh, signal: request.signal }),
      request.signal,
    )

    return NextResponse.json({ success: true, periods: results })
  } catch (error) {
    if (request.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return NextResponse.json({ success: false, error: 'Request cancelled' }, { status: 499 })
    }
    console.error('[analysis-periods] failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch analysis periods' },
      { status: 502 }
    )
  }
}
