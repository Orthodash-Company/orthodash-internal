import { z } from 'zod'

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  timeZone: z.string()
})

export type Location = z.infer<typeof LocationSchema>

export const LiveCountsParamsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})