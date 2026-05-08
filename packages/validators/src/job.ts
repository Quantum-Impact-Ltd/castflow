import { z } from 'zod'

export const createJobSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100).trim(),
    description: z.string().min(50, 'Description must be at least 50 characters').max(5000).trim(),
    category: z.enum(['model', 'actor', 'voiceover', 'extra']),
    subcategory: z.string().max(50).optional(),
    visibility: z.enum(['public', 'invite_only']).default('public'),

    genderRequired: z.enum(['male', 'female', 'non_binary', 'any']),
    ageMin: z.number().int().min(18).max(80).optional(),
    ageMax: z.number().int().min(18).max(80).optional(),
    locationCity: z.string().min(2).max(100).trim(),
    physicalRequirements: z.record(z.unknown()).optional(),
    skillsRequired: z.array(z.string().max(100)).max(20).optional().default([]),

    shootDate: z
      .string()
      .datetime()
      .refine((d) => new Date(d) > new Date(), 'Shoot date must be in the future'),
    shootEndDate: z.string().datetime().optional(),
    shootDurationHours: z.number().min(0.5, 'Minimum shoot duration is 30 minutes').max(24),

    // Payment type — fixed (flat fee) or hourly (rate × hours)
    paymentType: z.enum(['fixed', 'hourly']),
    rateSetBy: z.enum(['caster', 'open']),
    rateAmount: z.number().min(1).max(100000).optional(),
    // When paymentType=fixed+rateSetBy=caster: flat fee total
    // When paymentType=hourly+rateSetBy=caster: hourly rate
    // When rateSetBy=open: null — artists propose in their bid

    requiresNda: z.boolean().default(false),
    exclusivity: z.boolean().default(false),
    usageRights: z.string().min(5).max(500).trim(),

    headcountRequired: z.number().int().min(1).max(50).default(1),

    applicationDeadline: z
      .string()
      .datetime()
      .refine((d) => new Date(d) > new Date(), 'Application deadline must be in the future'),
  })
  .refine((data) => !(data.rateSetBy === 'caster' && !data.rateAmount), {
    message: 'Rate amount is required when caster sets the rate',
    path: ['rateAmount'],
  })
  .refine((data) => !data.ageMin || !data.ageMax || data.ageMin <= data.ageMax, {
    message: 'Minimum age must not exceed maximum age',
    path: ['ageMax'],
  })
  .refine((data) => !data.shootEndDate || new Date(data.shootEndDate) >= new Date(data.shootDate), {
    message: 'End date must be on or after shoot date',
    path: ['shootEndDate'],
  })

// Only non-critical fields are editable after bids have been received
// paymentType and category cannot change after creation (enforced in service too)
export const updateJobSchema = z.object({
  title: z.string().min(5).max(100).trim().optional(),
  description: z.string().min(50).max(5000).trim().optional(),
  subcategory: z.string().max(50).optional(),
  genderRequired: z.enum(['male', 'female', 'non_binary', 'any']).optional(),
  ageMin: z.number().int().min(18).max(80).optional(),
  ageMax: z.number().int().min(18).max(80).optional(),
  locationCity: z.string().min(2).max(100).trim().optional(),
  physicalRequirements: z.record(z.unknown()).optional(),
  skillsRequired: z.array(z.string()).optional(),
  shootDate: z.string().datetime().optional(),
  shootDurationHours: z.number().min(0.5).max(24).optional(),
  rateAmount: z.number().min(1).max(100000).optional(),
  requiresNda: z.boolean().optional(),
  exclusivity: z.boolean().optional(),
  usageRights: z.string().min(5).max(500).trim().optional(),
  headcountRequired: z.number().int().min(1).max(50).optional(),
  applicationDeadline: z.string().datetime().optional(),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
