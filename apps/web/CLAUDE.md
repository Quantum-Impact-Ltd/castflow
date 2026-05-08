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

## Data Fetching Pattern

```typescript
// Server Component — fetch directly, no useEffect
export default async function JobFeedPage({ searchParams }) {
  const jobs = await getJobs(searchParams)  // Direct API call
  return <JobFeed initialJobs={jobs} />
}

// Client Component — TanStack Query for interactive updates
'use client'
function JobFeed({ initialJobs }) {
  const { data: jobs } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.get('/jobs', { params: filters }),
    initialData: initialJobs,  // Hydrate from server
    staleTime: 30_000,
  })
}
```

## API Client

```typescript
// lib/api.ts — never call fetch directly, always use this
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  withCredentials: true, // for Better Auth cookies
})

// Response interceptor — handles auth errors globally
api.interceptors.response.use(
  (res) => res.data, // unwrap { success: true, data: ... }
  (err) => {
    if (err.response?.status === 401) {
      // redirect to login
    }
    return Promise.reject(err.response?.data?.error)
  }
)
```

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

  const onSubmit = form.handleSubmit(async (data) => {
    await api.post('/jobs', data)
  })

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

```typescript
// 1. Get presigned URL from API
// 2. Upload directly to R2 (never through Next.js server)
// 3. Confirm URL to API

async function uploadPortfolioImage(file: File) {
  // Step 1
  const { uploadUrl, publicUrl } = await api.post('/uploads/presigned-url', {
    type: 'portfolio_photo',
    contentType: file.type,
    size: file.size,
  })

  // Step 2 — upload directly to R2
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  // Step 3 — tell API it's done
  await api.post('/uploads/confirm', {
    url: publicUrl,
    type: 'portfolio_photo',
  })

  return publicUrl
}
```

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

## Key Query Keys (TanStack Query)

Use these consistently so cache invalidation works correctly:

```typescript
// Jobs
;['jobs', filters][('job', jobId)][('jobs', 'saved')][('caster', 'jobs')][ // Job feed // Single job // Saved jobs // Caster's own jobs
  // Bids
  ('bids', jobId)
][('artist', 'bids')][('bid', bidId)][ // All bids on a job (caster view) // Artist's own bids // Single bid
  // Bookings
  ('bookings', 'artist')
][('bookings', 'caster')][('booking', bookingId)][
  // Messages
  'threads'
][('messages', threadId)][ // Inbox // Thread messages
  // Misc
  'notifications'
][('artist', 'earnings')][('talent', 'search', filters)]
```

## shadcn/ui Usage

Install components with `npx shadcn@latest add [component]` — never manually create them.
Common components used: Button, Input, Textarea, Select, Form, Dialog, Sheet, Tabs, Badge, Avatar, Card, Table, Skeleton, Toast (via Sonner).

## Routing Conventions

- `/artist/*` — artist panel
- `/caster/*` — caster panel
- `/admin/*` — admin panel
- `/artists/:id` — public artist profile (accessible to all)
- `/onboarding/*` — onboarding flows (separate from panels)
