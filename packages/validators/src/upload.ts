import { z } from 'zod'

export const presignedUrlSchema = z.object({
  type: z.enum(['portfolio_photo', 'portfolio_video', 'id_document', 'demo_reel']),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
})

export const confirmUploadSchema = z.object({
  url: z.string().url().optional(),
  type: z.enum(['portfolio_photo', 'portfolio_video', 'id_document', 'demo_reel']),
  key: z.string().min(1),
  caption: z.string().max(200).optional(),
  isPrimary: z.boolean().optional(),
})

export const UPLOAD_LIMITS = {
  portfolio_photo: {
    types: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMb: 10,
  },
  portfolio_video: {
    types: ['video/mp4', 'video/quicktime'],
    maxSizeMb: 200,
  },
  id_document: {
    types: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeMb: 5,
  },
  demo_reel: {
    types: ['video/mp4', 'video/quicktime'],
    maxSizeMb: 200,
  },
} as const

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>
