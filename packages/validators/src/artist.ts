import { z } from 'zod'

/**
 * Minimum age for any artist on the platform. Hard rule — never lower this
 * (see CLAUDE.md non-negotiable business rules).
 */
export const MIN_ARTIST_AGE = 18

/**
 * Returns true when `dob` (ISO date string, e.g. '1995-06-15') puts the
 * person at least MIN_ARTIST_AGE years old today. Used by both the
 * artistPersonalInfoSchema (onboarding) and registerArtistSchema (signup)
 * so the 18+ check fires at the earliest possible point.
 */
export function isOldEnoughToRegister(dob: string): boolean {
  const parsed = new Date(dob)
  if (Number.isNaN(parsed.getTime())) return false
  const age = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return age >= MIN_ARTIST_AGE
}

const ageCheck = isOldEnoughToRegister

export const artistPersonalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  dob: z.string().refine(ageCheck, 'You must be 18 or older to register on CastFlow'),
  gender: z.string().min(1, 'Gender is required'),
  pronouns: z.string().max(50).optional(),
  city: z.string().min(2).max(100).trim(),
  bio: z.string().max(300).optional(),
})

export const modelStatsSchema = z.object({
  heightCm: z.number().int().min(100).max(250),
  weightKg: z.number().min(30).max(300).optional(),
  dressSize: z.string().min(1),
  shoeSize: z.string().min(1),
  bustCm: z.number().int().min(50).max(200).optional(),
  waistCm: z.number().int().min(40).max(180).optional(),
  hipCm: z.number().int().min(50).max(200).optional(),
  hairColour: z.string().min(1),
  eyeColour: z.string().min(1),
  skinTone: z.enum(['fair', 'light', 'medium', 'olive', 'tan', 'deep']),
})

export const actorStatsSchema = z
  .object({
    heightCm: z.number().int().min(100).max(250),
    hairColour: z.string().min(1),
    eyeColour: z.string().min(1),
    voiceType: z.string().max(50).optional(),
    spotlightUrl: z.string().url().optional().or(z.literal('')),
    equityMember: z.boolean().default(false),
    ageRangeMin: z.number().int().min(18).max(80),
    ageRangeMax: z.number().int().min(18).max(80),
  })
  .refine((d) => d.ageRangeMin <= d.ageRangeMax, {
    message: 'Minimum age must be less than maximum age',
    path: ['ageRangeMax'],
  })

export const artistExperienceSchema = z.object({
  experienceLevel: z.enum(['new_face', 'semi_pro', 'professional']),
  instagramHandle: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9._]*$/, 'Invalid Instagram handle')
    .optional(),
  hourlyRate: z.number().min(1).max(10000).optional(),
  halfDayRate: z.number().min(1).max(10000).optional(),
  fullDayRate: z.number().min(1).max(10000).optional(),
})

export const artistSkillSchema = z.object({
  skillType: z.enum(['accent', 'language', 'special_skill', 'training']),
  skillValue: z.string().min(1).max(100).trim(),
})

export const updateArtistTypeSchema = z.object({
  artistType: z.enum(['model', 'actor']),
})

export const replaceSkillsSchema = z.object({
  skills: z.array(artistSkillSchema).max(50),
})

export const updateAvailabilitySchema = z.object({
  availabilityStatus: z.enum(['available', 'unavailable']),
})

export type ArtistPersonalInfoInput = z.infer<typeof artistPersonalInfoSchema>
export type ModelStatsInput = z.infer<typeof modelStatsSchema>
export type ActorStatsInput = z.infer<typeof actorStatsSchema>
export type ArtistExperienceInput = z.infer<typeof artistExperienceSchema>
export type ArtistSkillInput = z.infer<typeof artistSkillSchema>
export type UpdateArtistTypeInput = z.infer<typeof updateArtistTypeSchema>
export type ReplaceSkillsInput = z.infer<typeof replaceSkillsSchema>
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>
