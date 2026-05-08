// Single source of truth for TanStack Query keys.
//
// Mirrors the keys documented in apps/web/CLAUDE.md. Use this for both
// fetching and targeted cache invalidation — never hand-write a key string.
//
// Conventions:
//   - `all` keys are the broadest scope for that resource. Invalidate them
//     to refetch every list/detail under the resource.
//   - `list(filters)` keys include filter args so different filter sets
//     are cached independently.
//   - `detail(id)` keys are unique per entity for fine-grained invalidation
//     after a mutation.

type Filters = Record<string, unknown> | undefined

export const queryKeys = {
  jobs: {
    all: ['jobs'] as const,
    list: (filters?: Filters) => ['jobs', 'list', filters ?? {}] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    saved: () => ['jobs', 'saved'] as const,
  },
  caster: {
    jobs: () => ['caster', 'jobs'] as const,
  },
  bids: {
    forJob: (jobId: string) => ['bids', 'job', jobId] as const,
    detail: (id: string) => ['bids', 'detail', id] as const,
  },
  artist: {
    bids: () => ['artist', 'bids'] as const,
    earnings: () => ['artist', 'earnings'] as const,
  },
  bookings: {
    artist: () => ['bookings', 'artist'] as const,
    caster: () => ['bookings', 'caster'] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
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
  talent: {
    search: (filters?: Filters) => ['talent', 'search', filters ?? {}] as const,
  },
} as const
