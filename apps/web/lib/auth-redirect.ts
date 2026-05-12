// Pure post-login redirect logic. No React, no Next imports — easy to unit-test.

export interface SessionUserLike {
  role: 'admin' | 'caster' | 'artist'
  approvalStatus?: 'pending' | 'approved' | 'rejected' | null
}

export function postLoginPath(user: SessionUserLike): string {
  if (user.role === 'admin') return '/admin'
  if (user.role === 'caster') return '/caster/dashboard'
  // artist
  if (user.approvalStatus === 'approved') return '/artist/dashboard'
  return '/onboarding/pending'
}
