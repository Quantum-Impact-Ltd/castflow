import { z } from 'zod'

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(500).trim().optional(),
})

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>

// A reviewee reporting a review left about them (harassment / spam / inaccurate).
export const reportReviewSchema = z.object({
  reason: z.enum(['harassment', 'spam', 'inaccurate', 'other']),
  detail: z.string().max(500).trim().optional(),
})

export type ReportReviewInput = z.infer<typeof reportReviewSchema>
