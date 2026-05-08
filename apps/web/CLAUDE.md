# CastFlow Web — Claude Code Instructions

## Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** Better Auth client
- **Data Fetching:** TanStack Query v5
- **Forms:** React Hook Form + Zod
- **UI:** shadcn/ui + Tailwind CSS
- **Rich Text:** Tiptap (job description editor)
- **File Upload:** react-dropzone
- **Payments:** Stripe.js + @stripe/react-stripe-js
- **Real-time:** Hono native WebSocket (via browser WebSocket API)
- **PDF View:** react-pdf

## Directory Structure

```
apps/web/
├── app/
│   ├── (public)/             # Unauthenticated pages
│   │   ├── page.tsx          # Landing / homepage
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── terms/, privacy/, contact/
│   ├── (artist)/             # Artist-only pages (layout checks role)
│   │   ├── layout.tsx        # Auth guard: must be artist + approved
│   │   ├── onboarding/       # Multi-step, not accessible after complete
│   │   ├── artist/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── jobs/
│   │   │   ├── bids/
│   │   │   ├── bookings/
│   │   │   ├── earnings/
│   │   │   ├── messages/
│   │   │   └── settings/
│   ├── (caster)/             # Caster-only pages
│   │   ├── layout.tsx        # Auth guard: must be caster + active
│   │   ├── onboarding/
│   │   └── caster/
│   │       ├── dashboard/
│   │       ├── jobs/
│   │       ├── talent/
│   │       ├── bookings/
│   │       ├── messages/
│   │       └── settings/
│   ├── (admin)/              # Admin-only pages
│   │   ├── layout.tsx        # Auth guard: must be admin
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── applications/
│   │       ├── users/
│   │       ├── jobs/
│   │       ├── bookings/
│   │       ├── payments/
│   │       ├── disputes/
│   │       ├── flagged/
│   │       ├── analytics/
│   │       └── logs/
│   ├── artists/[id]/         # Public artist profiles (shared route)
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # shadcn/ui components (auto-generated, don't edit)
│   ├── shared/               # Components used across multiple panels
│   ├── artist/               # Artist-specific components
│   ├── caster/               # Caster-specific components
│   ├── admin/                # Admin-specific components
│   └── forms/                # Reusable form components
├── lib/
│   ├── auth-client.ts        # Better Auth client instance
│   ├── api.ts                # Axios instance with base URL + interceptors
│   ├── query-client.ts       # TanStack Query client config
│   └── utils.ts              # cn() helper and misc utils
├── hooks/                    # Custom React hooks
├── providers/                # Context providers (QueryClient, session, etc.)
└── CLAUDE.md                 # This file
```

## Auth Setup

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Usage in components
const { data: session, isPending } = authClient.useSession()

// Social login (one line)
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',
})
```

## Role-Based Layout Guards

Each route group has a layout.tsx that checks the session role and redirects if wrong:

```typescript
// app/(artist)/layout.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-client'

export default async function ArtistLayout({ children }) {
  const session = await auth.api.getSession({ headers: headers() })

  if (!session) redirect('/login')
  if (session.user.role !== 'artist') redirect('/login')
  if (session.user.approvalStatus === 'pending') redirect('/onboarding/pending')
  if (session.user.approvalStatus === 'rejected') redirect('/onboarding/pending')

  return <>{children}</>
}
```

## Server vs Client Components

**Default to Server Components.** Only add `'use client'` when you actually need it.

| Use Server Component            | Use Client Component    |
| ------------------------------- | ----------------------- |
| Job feed (initial render + SEO) | Forms (useState)        |
| Artist public profile           | File upload dropzone    |
| Admin tables (initial data)     | Stripe payment form     |
| Static pages                    | Real-time messaging     |
| Data that doesn't change often  | Anything with useEffect |

## Data Fetching Architecture

The standard layered pattern is:

```
Component → useQuery / useMutation → service (lib/api/*) → fetcher (lib/fetcher.ts)
```

**Hard rules:**

- Components never call `fetcher` directly. They call hooks.
- Hooks never embed business logic. They wrap a service call and wire `queryKey`, `staleTime`, `onSuccess` invalidation, etc.
- Service modules in `lib/api/*` are pure, framework-agnostic async functions (no React, no Next imports). They validate inputs against `@castflow/validators` schemas and return data typed against `@castflow/types`.
- Query keys come from `lib/query-keys.ts` — never inline a key string.
- Server Components fetch by calling service functions directly (they are isomorphic). Pass results down as props and let client components hydrate via `initialData`.

```typescript
// Server Component — calls a service function directly
import { listJobs } from '@/lib/api/jobs'

export default async function JobFeedPage({ searchParams }) {
  const jobs = await listJobs(searchParams)
  return <JobFeed initialJobs={jobs} />
}

// Client Component — useQuery hydrates from the server result
'use client'
import { useQuery } from '@tanstack/react-query'
import { listJobs } from '@/lib/api/jobs'
import { queryKeys } from '@/lib/query-keys'

function JobFeed({ initialJobs }: { initialJobs: Job[] }) {
  const { data: jobs } = useQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: ({ signal }) => listJobs(filters, { signal }),
    initialData: initialJobs,
  })
  // …render
}
```

## Fetcher (lib/fetcher.ts)

The fetcher is a thin native-`fetch` wrapper. Only `lib/api/*` service modules import it.

- Base URL: `${NEXT_PUBLIC_API_URL}/api/v1`
- Sends `credentials: 'include'` for Better Auth cookies
- Unwraps the `{success,data}` envelope and throws a typed `ApiError` on `{success:false}` or non-OK status
- Browser-only `/login` redirect on HTTP 401 (preserves prior axios-interceptor behavior; SSR callers handle their own redirect strategy)
- Accepts `{ signal }` so TanStack Query auto-cancels stale requests
- Accepts `{ params }` for query strings

```typescript
// lib/fetcher.ts (excerpt)
export async function fetcher<T>(path: string, opts?: RequestOptions): Promise<T>
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly fields?: Record<string, string[]>
}
```

## Service Pattern (lib/api/\*)

```typescript
// lib/api/jobs.ts
import { fetcher } from '@/lib/fetcher'
import type { Job, JobFilters } from '@castflow/types'

export function listJobs(filters: JobFilters, init?: { signal?: AbortSignal }) {
  return fetcher<Job[]>('/jobs', { params: filters, ...init })
}

export function getJob(id: string, init?: { signal?: AbortSignal }) {
  return fetcher<Job>(`/jobs/${id}`, init)
}

export function createJob(input: CreateJobInput) {
  return fetcher<Job>('/jobs', { method: 'POST', body: input })
}
```

Services do not exist until the feature that needs them does. Add per-feature, not preemptively.

## Hook Pattern (lib/hooks/\*)

```typescript
// lib/hooks/use-jobs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listJobs, createJob } from '@/lib/api/jobs'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: ({ signal }) => listJobs(filters, { signal }),
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess: (job) => {
      // Targeted invalidation only — do NOT invalidate `queryKeys.jobs.all`
      // unless the mutation truly affects every job query.
      void qc.invalidateQueries({ queryKey: queryKeys.caster.jobs() })
      qc.setQueryData(queryKeys.jobs.detail(job.id), job)
    },
    onError: (err) => toast.error(err.message),
  })
}
```

## QueryClient (lib/query-client.ts)

- Per-request on the server (no cross-user cache leaks), shared singleton in the browser
- `staleTime: 30s`, `gcTime: 5m`
- `retry: 2` for network/5xx; `retry: 0` for 4xx (validation, auth, not-found, conflict)
- Mutations do not retry — surface failures immediately

`providers/index.tsx` calls `getQueryClient()` and mounts `ReactQueryDevtools` in development only.

## Form Pattern

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createJobSchema } from '@castflow/validators'  // Shared schema

function JobPostForm() {
  const form = useForm({
    resolver: zodResolver(createJobSchema),
    defaultValues: { ... }
  })

  const createJob = useCreateJob()  // from lib/hooks/use-jobs

  const onSubmit = form.handleSubmit((data) => createJob.mutate(data))

  return (
    <form onSubmit={onSubmit}>
      {/* Use shadcn/ui Form components */}
    </form>
  )
}
```

## Multi-Step Form Pattern (Job Posting / Onboarding)

Use a single page with step state — NOT separate routes. This preserves form data between steps.

```typescript
const [step, setStep] = useState(1)
const TOTAL_STEPS = 6

// Store all step data in one form instance
const form = useForm<CreateJobFormData>({
  resolver: zodResolver(createJobSchema),
})

// Only validate current step's fields on Next
const handleNext = async () => {
  const valid = await form.trigger(STEP_FIELDS[step])
  if (valid) setStep((s) => s + 1)
}
```

## File Upload Pattern

Live in `lib/api/uploads.ts` as a service. The R2 PUT uses raw `fetch`
(not the API fetcher) because it goes to a third-party origin, not our API.

```typescript
// lib/api/uploads.ts
import { fetcher } from '@/lib/fetcher'

interface PresignedUrl {
  uploadUrl: string
  publicUrl: string
}

export async function uploadPortfolioImage(file: File): Promise<string> {
  // 1. Get presigned URL from our API
  const { uploadUrl, publicUrl } = await fetcher<PresignedUrl>('/uploads/presigned-url', {
    method: 'POST',
    body: { type: 'portfolio_photo', contentType: file.type, size: file.size },
  })

  // 2. Upload directly to R2 — raw fetch, not our API
  const r2 = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!r2.ok) throw new Error('R2 upload failed')

  // 3. Confirm to our API
  await fetcher('/uploads/confirm', {
    method: 'POST',
    body: { url: publicUrl, type: 'portfolio_photo' },
  })

  return publicUrl
}
```

Wrap this in a `useUploadPortfolioImage` mutation hook when consumed from a component.

## Real-time Messaging

```typescript
'use client'
function MessageThread({ threadId }) {
  const ws = useRef<WebSocket>()

  useEffect(() => {
    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/messages/${threadId}`)
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      // Add message to local state / TanStack Query cache
      queryClient.setQueryData(['messages', threadId], (old) => [...old, msg])
    }
    return () => ws.current?.close()
  }, [threadId])

  const sendMessage = (content: string) => {
    ws.current?.send(JSON.stringify({ content }))
  }
}
```

## Sensitive Data Display Rules

- **Before booking confirmed:** Show caster only as company name, artist only as first name
- **After booking + contract signed:** Show full contact details on the booking detail page
- **Shoot location:** Only display after `contract.status === 'fully_signed'`
- **Earnings breakdown:** Always show gross → commission deduction → net (never hide the commission)
- **Admin only:** ID document URLs, full Stripe IDs, strike counts

## Notification Rules

- New job matching notifications are shown as a **daily digest** — not individual notifications per job
- All other notifications are real-time in-app + email

## Query Keys (TanStack Query)

All keys come from `lib/query-keys.ts`. Never inline a string. Use the
factory both for `useQuery` and for targeted invalidation.

```typescript
import { queryKeys } from '@/lib/query-keys'

useQuery({ queryKey: queryKeys.jobs.list(filters), queryFn: ... })
useQuery({ queryKey: queryKeys.jobs.detail(jobId), queryFn: ... })

queryClient.invalidateQueries({ queryKey: queryKeys.bids.forJob(jobId) })
queryClient.setQueryData(queryKeys.jobs.detail(job.id), job)
```

Resources covered: `jobs`, `caster.jobs`, `bids`, `artist.bids`,
`artist.earnings`, `bookings`, `threads.inbox`, `messages.forThread`,
`notifications.all`, `talent.search`. Add new resources to the factory
before using them.

**Invalidation rule:** invalidate the narrowest key that covers the
mutation's effect. Avoid blanket calls like
`invalidateQueries({ queryKey: queryKeys.jobs.all })` unless the mutation
genuinely affects every cached job query.

## shadcn/ui Usage

Install components with `npx shadcn@latest add [component]` — never manually create them.
Common components used: Button, Input, Textarea, Select, Form, Dialog, Sheet, Tabs, Badge, Avatar, Card, Table, Skeleton, Toast (via Sonner).

## Routing Conventions

- `/artist/*` — artist panel
- `/caster/*` — caster panel
- `/admin/*` — admin panel
- `/artists/:id` — public artist profile (accessible to all)
- `/onboarding/*` — onboarding flows (separate from panels)
