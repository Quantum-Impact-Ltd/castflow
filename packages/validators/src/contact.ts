import { z } from 'zod'

export const contactTopics = ['sales', 'support', 'safety', 'press', 'other'] as const
export type ContactTopic = (typeof contactTopics)[number]

export const contactMessageSchema = z.object({
  name: z.string().min(2, 'Please enter your name').max(100),
  email: z.string().email('Enter a valid email address').max(200),
  company: z.string().max(120).optional(),
  topic: z.enum(contactTopics),
  message: z
    .string()
    .min(20, 'Tell us a bit more — 20+ characters helps us route this fast')
    .max(2000, 'Keep it under 2000 characters'),
  // Honeypot — must be empty. Real users never see this field; bots fill it.
  website: z.string().max(0).optional(),
})

export type ContactMessageInput = z.infer<typeof contactMessageSchema>
