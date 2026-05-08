import { z } from 'zod'

export const submitBidSchema = z.object({
  proposedRate: z.number().min(1, 'Rate must be at least £1').max(100000),
  // Required for hourly jobs — validated in the API layer against job.paymentType
  estimatedHours: z.number().min(0.5).max(24).optional(),
  coverNote: z.string().min(20, 'Cover note must be at least 20 characters').max(500).trim(),
  highlightedPortfolioItems: z
    .array(z.string().uuid())
    .min(1, 'Select at least one portfolio item')
    .max(5, 'Maximum 5 portfolio items'),
})

export const updateBidSchema = submitBidSchema.partial()
// Only editable while bid.status === 'pending'

export type SubmitBidInput = z.infer<typeof submitBidSchema>
