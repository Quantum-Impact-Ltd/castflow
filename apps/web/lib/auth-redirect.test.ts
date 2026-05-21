import { describe, it, expect } from 'vitest'
import { postLoginPath } from './auth-redirect'

describe('postLoginPath', () => {
  it('W1: admin → /admin', () => {
    expect(postLoginPath({ role: 'admin' })).toBe('/admin')
  })

  it('W2: caster → /caster/dashboard', () => {
    expect(postLoginPath({ role: 'caster' })).toBe('/caster/dashboard')
  })

  it('W3: artist with pending approval → /onboarding/artist (stepper handles submitted vs in-progress)', () => {
    expect(postLoginPath({ role: 'artist', approvalStatus: 'pending' })).toBe(
      '/onboarding/artist'
    )
  })

  it('W4: artist with rejected approval → /onboarding/artist (so they can edit and resubmit)', () => {
    expect(postLoginPath({ role: 'artist', approvalStatus: 'rejected' })).toBe(
      '/onboarding/artist'
    )
  })

  it('W5: artist with approved status → /artist/dashboard', () => {
    expect(postLoginPath({ role: 'artist', approvalStatus: 'approved' })).toBe('/artist/dashboard')
  })

  it('artist with missing approvalStatus falls back to onboarding stepper', () => {
    expect(postLoginPath({ role: 'artist' })).toBe('/onboarding/artist')
  })
})
