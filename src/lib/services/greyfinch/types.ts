import { z } from 'zod'

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  timeZone: z.string(),
})

export type Location = z.infer<typeof LocationSchema>

export const PeriodAnalyticsParamsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  refresh: z.string().nullish().transform((val) => val === 'true'),
})

export type PeriodAnalyticsParams = z.infer<typeof PeriodAnalyticsParamsSchema>