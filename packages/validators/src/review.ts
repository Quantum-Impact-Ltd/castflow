import { z } from 'zod'

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(500).trim().optional(),
})

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>
