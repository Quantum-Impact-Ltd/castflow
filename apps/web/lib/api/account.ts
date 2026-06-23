import { fetcher } from '@/lib/fetcher'

/**
 * Deletes the signed-in artist's account. The API enforces the PRD guards
 * server-side (blocked when there are active bookings) and returns a
 * 409 CONFLICT with a message the UI surfaces.
 */
export function deleteArtistAccount() {
  return fetcher<{ ok: true }>('/artists/me', { method: 'DELETE' })
}

/**
 * Deletes the signed-in caster's account. The API enforces the PRD guards
 * (blocked when there are active bookings) and returns a 409 CONFLICT the
 * UI surfaces.
 */
export function deleteCasterAccount() {
  return fetcher<{ ok: true }>('/casters/me', { method: 'DELETE' })
}
