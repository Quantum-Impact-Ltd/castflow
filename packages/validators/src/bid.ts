import { z } from 'zod'

export const submitBidSchema = z.object({
  proposedRate: z.number().min(1, 'Rate must be at least £1').max(100000),
  // Required for hourly jobs — validated in the API layer against job.paymentType
  estimatedHours: z.number().min(0.5).max(24).optional(),
  coverNote: z.string().min(20, 'Cover note must be at least 20 characters').max(500).trim(),
  // Internal portfolio-item IDs — app-generated, not guaranteed UUID-shaped
  // (e.g. seeded IDs), so validate as non-empty strings rather than `.uuid()`.
  // A strict uuid() check rejected valid IDs and the per-element error nested
  // under `.0`, so it never surfaced as a visible field message — the bid just
  // failed silently.
  highlightedPortfolioItems: z
    .array(z.string().min(1))
    .min(1, 'Select at least one portfolio item')
    .max(5, 'Maximum 5 portfolio items'),
})

export const updateBidSchema = submitBidSchema.partial()
// Only editable while bid.status === 'pending'

export const counterOfferSchema = z.object({
  proposedRate: z.number().min(1).max(100000),
  estimatedHours: z.number().min(0.5).max(24).optional(),
  message: z.string().max(500).optional(),
})

export type SubmitBidInput = z.infer<typeof submitBidSchema>
export type UpdateBidInput = z.infer<typeof updateBidSchema>
export type CounterOfferInput = z.infer<typeof counterOfferSchema>
