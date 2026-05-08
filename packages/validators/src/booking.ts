import { z } from 'zod'

export const cancelBookingSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason for cancellation').max(500).trim(),
})

export const raiseDisputeSchema = z.object({
  reason: z.enum(['no_show_artist', 'no_show_caster', 'payment_issue', 'quality_issue', 'other']),
  description: z
    .string()
    .min(50, 'Please describe the issue in at least 50 characters')
    .max(2000)
    .trim(),
})

export const submitDisputeSideSchema = z.object({
  submission: z
    .string()
    .min(50, 'Please describe your side of the situation in at least 50 characters')
    .max(2000)
    .trim(),
})

export const signContractSchema = z.object({
  signatureStr: z.string().min(2, 'Please type your full legal name').max(200).trim(),
})

export const resolveDisputeSchema = z.object({
  resolution: z.enum(['full_release_to_artist', 'full_refund_to_caster', 'split', 'escalated']),
  splitArtistPct: z.number().int().min(0).max(100).optional(),
  adminNotes: z.string().min(10).max(2000).trim(),
})

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
export type RaiseDisputeInput = z.infer<typeof raiseDisputeSchema>
export type SignContractInput = z.infer<typeof signContractSchema>
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>
