import { Hono } from 'hono'
import { registerArtistSchema, registerCasterSchema } from '@castflow/validators'
import { AuthService } from '../services/AuthService'
import { rateLimit } from '../middleware/rateLimit'
import { AppError } from '../errors'

export const authRoutes = new Hono()

// 10 registrations / hour / IP — enough for shared offices, throttles bot signups.
const registerLimit = rateLimit({
  scope: 'auth:register',
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts. Try again later.',
})

authRoutes.post('/register-artist', registerLimit, async (c) => {
  const parsed = registerArtistSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await AuthService.registerArtist(parsed.data)
  return c.json({ success: true, data: result })
})

authRoutes.post('/register-caster', registerLimit, async (c) => {
  const parsed = registerCasterSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await AuthService.registerCaster(parsed.data)
  return c.json({ success: true, data: result })
})
