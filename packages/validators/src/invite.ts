import { z } from 'zod'

export const inviteArtistSchema = z.object({
  artistId: z.string().uuid(),
  message: z.string().max(500).optional(),
})

export type InviteArtistInput = z.infer<typeof inviteArtistSchema>
