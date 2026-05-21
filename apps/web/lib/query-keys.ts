// Single source of truth for TanStack Query keys.
//
// Use this for both fetching and targeted cache invalidation —
// never hand-write a key string.

type Filters = Record<string, unknown> | undefined

export const queryKeys = {
  session: () => ['session'] as const,
  jobs: {
    all: ['jobs'] as const,
    list: (filters?: Filters) => ['jobs', 'list', filters ?? {}] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    saved: () => ['jobs', 'saved'] as const,
  },
  caster: {
    jobs: () => ['caster', 'jobs'] as const,
    profile: () => ['caster', 'me'] as const,
  },
  bids: {
    forJob: (jobId: string) => ['bids', 'job', jobId] as const,
    detail: (id: string) => ['bids', 'detail', id] as const,
  },
  artist: {
    me: () => ['artist', 'me'] as const,
    idDocumentUrl: () => ['artist', 'me', 'id-document', 'url'] as const,
    bids: () => ['artist', 'bids'] as const,
    earnings: () => ['artist', 'earnings'] as const,
    payouts: () => ['artist', 'payouts'] as const,
    invites: () => ['artist', 'invites'] as const,
    invite: (id: string) => ['artist', 'invites', id] as const,
  },
  bookings: {
    artist: () => ['bookings', 'artist'] as const,
    caster: () => ['bookings', 'caster'] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },
  contract: {
    forBooking: (bookingId: string) => ['contract', bookingId] as const,
  },
  dispute: {
    forBooking: (bookingId: string) => ['dispute', bookingId] as const,
  },
  threads: {
    inbox: () => ['threads'] as const,
  },
  messages: {
    forThread: (threadId: string) => ['messages', threadId] as const,
  },
  notifications: {
    all: () => ['notifications'] as const,
  },
  reviews: {
    forArtist: (profileId: string) => ['reviews', 'artist', profileId] as const,
    forBooking: (bookingId: string) => ['reviews', 'booking', bookingId] as const,
  },
  talent: {
    search: (filters?: Filters) => ['talent', 'search', filters ?? {}] as const,
    detail: (id: string) => ['talent', 'detail', id] as const,
  },
  calendar: {
    feed: () => ['calendar', 'feed'] as const,
  },
  admin: {
    users: (filters?: Filters) => ['admin', 'users', filters ?? {}] as const,
    user: (id: string) => ['admin', 'users', id] as const,
    applications: (filters?: Filters) => ['admin', 'applications', filters ?? {}] as const,
    application: (id: string) => ['admin', 'applications', id] as const,
    jobs: (filters?: Filters) => ['admin', 'jobs', filters ?? {}] as const,
    job: (id: string) => ['admin', 'jobs', id] as const,
    bookings: (filters?: Filters) => ['admin', 'bookings', filters ?? {}] as const,
    booking: (id: string) => ['admin', 'bookings', id] as const,
    payments: (filters?: Filters) => ['admin', 'payments', filters ?? {}] as const,
    disputes: (filters?: Filters) => ['admin', 'disputes', filters ?? {}] as const,
    flaggedMessages: (filters?: Filters) =>
      ['admin', 'flagged', 'messages', filters ?? {}] as const,
    flaggedReviews: (filters?: Filters) => ['admin', 'flagged', 'reviews', filters ?? {}] as const,
    analytics: () => ['admin', 'analytics'] as const,
    logs: (filters?: Filters) => ['admin', 'logs', filters ?? {}] as const,
  },
} as const
