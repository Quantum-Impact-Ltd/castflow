import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Must be at least 8 characters')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character')

export const registerArtistSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  artistType: z.enum(['model', 'actor']),
})

export const registerCasterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  companyName: z.string().min(1).max(100).trim(),
  companyType: z.enum(['brand', 'agency', 'production_house', 'independent']),
  contactName: z.string().min(1).max(100).trim(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
})

export type RegisterArtistInput = z.infer<typeof registerArtistSchema>
export type RegisterCasterInput = z.infer<typeof registerCasterSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
