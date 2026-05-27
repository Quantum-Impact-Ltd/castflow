# CastFlow — Dashboard Rebuild Plan

> Authoritative plan for rebuilding the **artist**, **caster**, and **admin**
> dashboards from scratch on top of the existing, untouched data layer
> (`lib/api/*` + `lib/hooks/*`), backend API, and public-site design system.
>
> **Status:** Step 1 (read codebase) ✅ · Step 2 (delete old dashboards) ✅ ·
> Step 3 (this plan) ✅ · **Step 4 (build) — awaiting confirmation.**
>
> Canonical references: `docs/PRD.md` §6–§16 (esp. §15 screen inventory),
> `apps/api/prisma/CLAUDE.md`, `apps/web/CLAUDE.md`, and the live API route
> files under `apps/api/src/routes/` (full endpoint inventory was read in
> Step 1; the §3 coverage matrix and §5 gaps capture the conclusions).

---

## 0. What was deleted in Step 2

Wiped entirely (recoverable via git):

| Removed | Detail |
| --- | --- |
| `app/(artist)/` | layout + 46 files (25 pages + clients/forms/lists) |
| `app/(caster)/` | layout + 42 files (28 pages + clients/forms/lists) |
| `app/(admin)/` | layout + 33 files (17 pages + clients) |
| `components/dashboard/` | shell, sidebar-nav, topbar, nav-config, states, stat-card, status-badge, page-header, index |
| `components/messaging/` | inbox, thread |
| `components/notifications/` | list |
| `components/caster/` | job-wizard |
| `components/settings/` | calendar-feed |

**Deliberately kept** (not dashboard-specific): `components/ui/*` (shadcn + Magic UI),
`components/landing/*`, `components/auth/*`, `components/legal/*`,
`components/onboarding/*`, `components/a11y/*`, `components/card/profile-card.tsx`
(used by the public `app/artists/[id]` view), all public pages, all of `lib/*`
(the data layer), `providers/*`, `app/layout.tsx`, root metadata/sitemap/robots.

> The repo is intentionally **non-building** until Step 4 — the deleted shell
> primitives (`states`, `PageHeader`, etc.) are re-created first, then pages.
> `lib/mock/*` is still imported by `app/artists/[id]/artist-profile-view.tsx`
> and will be removed when that view switches to real data (see §5 G7).

---

## 1. Architecture & cross-cutting decisions

### 1.1 Route structure

Keep the role-prefixed structure the data layer and `postLoginPath` already
target (the PRD/brief says "`/dashboard/*`" generically; our concrete prefixes
are the canonical interpretation):

```
app/
  (artist)/  → /artist/*    artist layout (guard + shell)
  (caster)/  → /caster/*    caster layout (guard + shell)
  (admin)/   → /admin/*      admin  layout (guard + shell)
```

`lib/auth-redirect.ts::postLoginPath` already routes admin→`/admin`,
caster→`/caster/dashboard`, approved-artist→`/artist/dashboard`,
unapproved-artist→`/onboarding/artist`. No change needed.

### 1.2 RBAC — defence in depth (three layers)

**Never trust the client.** Enforcement order:

1. **`apps/web/middleware.ts` (NEW — edge, first line).**
   `matcher: ['/artist/:path*', '/caster/:path*', '/admin/:path*']`.
   Checks presence of the Better Auth session cookie. **No cookie → 307 to
   `/login?next=<path>`.** Middleware does *not* attempt role checks (it has no
   cheap, trustworthy way to read role at the edge without the API round-trip);
   it only stops fully-unauthenticated traffic early and cheaply. This satisfies
   "use Next.js middleware to protect all dashboard routes."

2. **Server-component route-group `layout.tsx` (authoritative).** Each layout is
   `async`, calls `auth.api.getSession({ headers: await headers() })` (proxied to
   the API via `lib/auth-server.ts`), then:
   - no session → `redirect('/login')` (belt-and-braces with middleware);
   - `status ∈ {suspended, banned}` → `redirect('/suspended')`;
   - **role mismatch → render the `<Forbidden403/>` screen (HTTP-style 403), NOT
     a redirect.** This is the explicit requirement: an artist hitting
     `/admin/*` sees a 403, not a redirect loop. We return the 403 component
     directly from the layout (so the URL is preserved and there is no bounce).
   - artist layout additionally: `approvalStatus !== 'approved'` →
     `redirect('/onboarding/artist')`.
   - caster layout additionally: **fail-closed onboarding gate** — fetch
     `GET /api/v1/casters/me`; if not OK or `!onboardingCompletedAt` →
     `redirect('/onboarding/caster')`. (Preserves audit fix C3: `redirect()`
     stays outside any try/catch.)
   On success the layout wraps `children` in the role's `<DashboardShell>`.

3. **Server-side data shape (already enforced by the API).** The UI only ever
   renders what the server returns. Sensitive fields are stripped server-side
   (shoot location until contract `fully_signed`, contact details pre-booking,
   ID docs admin-only, bid counts never sent to artists). The UI mirrors this
   with explicit **locked/unlocked** states — it does not reconstruct hidden
   data. See §1.8.

Admin routes/data are unreachable by artists/casters at every layer: middleware
(cookie only), layout (403 on role mismatch), and API (`requireRole('admin')`
→ 403). There is no admin data in any non-admin bundle.

### 1.3 Shared layout components (to re-create in `components/dashboard/`)

Rebuilt faithfully to the deleted versions (same names so the plan's page specs
can reference them), styled with the existing `--sidebar-*` and brand tokens:

| Component | Responsibility |
| --- | --- |
| `DashboardShell` | `'use client'` app frame: fixed `w-64` left `<aside>` (hidden `<lg`) with `SidebarNav`, a `Topbar`, `<main className="flex-1 p-4 lg:p-8">`. Props: `role`, `brand`, `brandHref`, `user`, `notificationsHref`. |
| `SidebarNav` | Brand link + nav list from `nav-config`; active state via `usePathname()` + `matchPrefix`. |
| `Topbar` | Sticky `h-14`; mobile hamburger → `<Sheet>` with the nav; **notification bell** (live unread count via `useNotifications`); account `<DropdownMenu>` (email/role + Sign out → `useLogout()`). |
| `nav-config.ts` | `artistNav` / `casterNav` / `adminNav` arrays of `{href,label,icon,matchPrefix?}` (lucide icons). See §1.5. |
| `states.tsx` | `LoadingState` (skeleton rows), `ErrorState` (`message` + optional `onRetry`), `EmptyState` (dashed card: icon/title/description/action). The universal vocabulary used on **every** page. |
| `PageHeader` | `<h1>` + description + right-aligned actions slot. |
| `StatCard` | KPI tile: label, value, hint, icon. Dashboard homes. |
| `StatusBadge` | Maps every domain status string (BidStatus, BookingStatus, EscrowStatus, ContractStatus, DisputeStatus, JobStatus, ApprovalStatus, InviteStatus) → 5 variants (neutral/info/success/warning/danger) + a `title` tooltip explaining the status. |
| `LockedField` (NEW) | Renders an opaque "🔒 Revealed once the contract is fully signed" / "Shown after booking" placeholder. Used wherever the server returns a masked value. Never ships the hidden value to the DOM. |
| `Money` (NEW) | Thin wrapper over `formatCurrency` (en-GB/GBP) with optional commission breakdown popover. |
| `index.ts` | Barrel re-export. |

Role-specific shells are **not** needed — one `DashboardShell` parametrised by
`role` (matching the prior design). Role differences live only in `nav-config`,
the layout guards, and the pages themselves.

### 1.4 Reused (non-dashboard) components

`components/messaging/*` and `components/notifications/*` were deleted and will
be **re-created under `components/dashboard/`** (messaging: `MessageInbox`,
`MessageThreadView`; notifications: `NotificationList`) so artist+caster share
one implementation parametrised by `basePath`. The caster job wizard is rebuilt
as `components/dashboard/job-wizard.tsx`. The calendar-feed card is rebuilt as
`components/dashboard/calendar-feed-card.tsx` (shared artist+caster settings).

### 1.5 Navigation per role (sidebar)

**Artist** (`artistNav`): Dashboard · Job Feed · My Bids · Saved Jobs ·
Invitations · Bookings · Messages · Earnings · Reviews · My Profile ·
Notifications · Settings.

**Caster** (`casterNav`): Dashboard · My Jobs · Post a Job · Talent Search ·
Shortlist · Bookings · Messages · Notifications · Settings.

**Admin** (`adminNav`): Dashboard · Applications · Users · Jobs · Bookings ·
Payments · Disputes · Flagged · Analytics · Audit Log.

(Notifications also always reachable via the topbar bell on every role.)

### 1.6 Data-fetching pattern (unchanged, already built)

`Component → use-*hook (lib/hooks) → service (lib/api) → fetcher (lib/fetcher)`.
Every page is a **thin `async` server `page.tsx`** that `await params`/checks
nothing extra (the layout already guarded) and renders a `'use client'`
component which does the fetching via the existing hooks. Query keys come only
from `lib/query-keys.ts`. Mutations invalidate via the hooks' existing
`invalidateQueries`. **No new data-layer files unless a gap in §5 requires one.**

### 1.7 States convention (mandatory on every page)

- **Loading:** `<LoadingState/>` (skeletons shaped like the eventual content).
- **Empty:** `<EmptyState/>` with a meaningful icon/title/description and, where
  an action makes sense, a CTA (e.g. "Browse the job feed").
- **Error:** `<ErrorState onRetry={refetch}/>`; `ApiError.code === 'FORBIDDEN'`
  on artist surfaces maps to an "Account not approved yet" empty message
  (preserving the prior dashboard behaviour).
- List pages guard at the top level; dashboard-home cards guard independently so
  one failing widget doesn't blank the page.

### 1.8 Privacy / locked-state UI conventions (server-driven)

The UI reflects only what the API returns and shows an explicit lock state when
a value is withheld:

| Rule (PRD) | Server behaviour | UI |
| --- | --- | --- |
| Shoot location hidden until contract `fully_signed` (§10.7, §13.2) | `shootLocation`/`callTime` masked in booking/job/invite payloads | `<LockedField>` "Revealed once both parties sign" until `contract.status === 'fully_signed'` |
| Contact details hidden until booking (§13.2) | talent payloads expose only `firstName`/`companyName`; full contact only via post-booking includes | Show company/first name + a "Contact unlocks after booking" note; reveal name+email only when the booking payload carries them |
| Artists never see bid counts (§8.5) | public job payloads carry no bid count | No bid-count UI anywhere on artist surfaces; job cards show "spots remaining" only |
| ID document admin-only, no download (§13.1, §16) | presigned **read** URL, admin-only | `<img>`/PDF inline viewer with download disabled; never a download link |
| New artist "New to Platform" badge (§10.9) | `ratingCount === 0` | Badge instead of empty stars |

### 1.9 Real-time messaging (Hono WebSocket) — see §6 (flagged: touches backend)

### 1.10 Money & dates

`formatCurrency` (en-GB, GBP) and `formatDate` from `lib/utils.ts`. Commission
breakdown (gross → commission → net) shown on bid confirmation, booking detail,
and earnings, per PRD §11.2 ("shown clearly at every step").

---

## 2. Design system (match the public site exactly)

Source of truth: `app/globals.css` (Tailwind v4, CSS-first, no config file).

- **Brand:** blue `--brand-50…900`, `--brand-500 (#3a8dc4)` primary; default CTAs
  use brand (per commit `aed97f8`). **Accent:** warm `--cta-400/-500` for
  highlight moments only.
- **Surfaces:** oklch neutrals tinted to hue 240; **pure white is banned**.
  `--card`, `--muted`, `--accent`, `--border`, `--ring` per globals.
- **Sidebar tokens** (`--sidebar-*`) already exist — wire the shell to them.
- **Fonts:** **Geist** (`--font-sans`, body/UI), **Geist Mono**
  (`--font-mono`, eyebrow/label `uppercase tracking-[0.18em]`), **Instrument
  Serif** (`--font-serif`, editorial headings — used sparingly).
- **Radius:** `--radius: 0.625rem` scale (`sm`→`4xl`).
- **Components:** shadcn set in `components/ui/*` (button, card, dialog, sheet,
  tabs, table, select, form, input, textarea, switch, badge, avatar, skeleton,
  dropdown-menu, separator, sonner). Magic UI (marquee, particles, shine-border,
  neon-gradient-card, animated-beam) reserved for accent surfaces, not core
  dashboard chrome.
- **Motion:** `motion/react` for tasteful transitions; honour the global
  `prefers-reduced-motion` clamp. Dashboards stay calm — data first.
- **Dark mode:** tokens exist but no `ThemeProvider` is mounted; dashboards ship
  **light only** (out of scope to wire the toggle — flagged in §5 G11).
- **Components needing a `<select>`/multiselect/date range** beyond shadcn:
  build small composed primitives in `components/ui/` (e.g. `range-slider`,
  `multi-select`, `date-range`) styled to match. Listed per page where used.

---

## 3. Backend capability → screen coverage matrix

Every endpoint maps to at least one screen ("nothing left unused"). Full
per-endpoint middleware/role/schema/service detail lives in
`.tmp-backend-inventory.md`.

| Endpoint(s) | Surfaced on |
| --- | --- |
| `GET /artists/me`, `PATCH me/{personal,model-stats,actor-stats,experience,type}`, `PUT me/skills` | Artist › My Profile (view/edit) |
| `POST /artists/me/submit` | Artist profile re-submit banner (post-edit of re-review fields) |
| `GET /artists/me/id-document/url` | Artist › Settings (ID on file), reused by Admin application review |
| `GET /artists/:id/comp-card` | Artist public preview + Caster artist profile (download/print comp card) |
| `GET /talent`, `GET /talent/:id` | Caster › Talent Search, Artist public profile (caster view) |
| `GET /jobs` (+filters), `GET /jobs/:id` | Artist › Job Feed, Job Detail |
| `GET /jobs/me/list` | Caster › My Jobs, Dashboard |
| `POST /jobs`, `PATCH /jobs/:id`, `POST /jobs/:id/cancel` | Caster › Post Job wizard, Edit Job, My Jobs/Detail (close) |
| `POST /bids/jobs/:jobId`, `PATCH /bids/:id`, `POST /bids/:id/withdraw` | Artist › Submit Bid, My Bids, Bid Detail |
| `GET /bids/me/list` | Artist › My Bids |
| `POST /bids/:id/counter` | Artist › Bid Detail (counter on shortlisted) |
| `GET /bids/jobs/:jobId/list` | Caster › Job Detail (bids) |
| `POST /bids/:id/{shortlist,reject,undo-reject,accept}` | Caster › Job Detail bid actions, Booking flow (accept) |
| `POST /bids/counter/:id/{accept,decline}` | Caster › Job Detail / Bid Detail (counter response) |
| `GET /bookings/me/list`, `GET /bookings/:id` | Artist + Caster › Bookings, Booking Detail |
| `POST /bookings/:id/confirm-completion` | Caster › Booking Detail (date-locked) |
| `POST /bookings/:id/cancel` | Artist + Caster › Booking Detail (cancellation policy) |
| `GET /contracts/bookings/:id`, `POST .../generate`, `POST .../sign` | Artist + Caster › Contract review & sign |
| `POST /payments/bookings/:id/intent` | Caster › Booking payment (escrow) |
| `POST /payments/bookings/:id/release` | Caster › Booking Detail (release) |
| `POST /payments/connect/onboard`, `GET /payments/connect/status` | Artist › Earnings / Payout settings |
| `GET /messages/threads`, `GET/POST /messages/threads/:id`, `POST .../read` | Artist + Caster › Messages inbox + thread; Admin thread reader |
| `POST /reviews/bookings/:id`, `GET /reviews/bookings/:id`, `GET /reviews/artists/:profileId` | Artist + Caster › Leave review, My reviews; public profile reviews |
| `POST /disputes/bookings/:id`, `POST .../evidence`, `GET .../` | Artist + Caster › Raise dispute, Dispute detail |
| `POST /disputes/bookings/:id/resolve` | Admin › Dispute detail (resolve) |
| `GET /notifications`, `POST /read`, `POST /read-all`, `DELETE /:id` | All roles › Notifications + topbar bell |
| `POST /uploads/presigned-url`, `POST /confirm`, `DELETE /portfolio/:id`, `PATCH /portfolio/:id/primary` | Artist › Manage portfolio; caster logo; ID upload |
| `POST /invites/jobs/:jobId` | Caster › Talent Search / Artist profile (invite to apply) |
| `GET /invites/me/list`, `GET /invites/:id`, `POST /:id/{accept,decline}` | Artist › Invitations |
| `GET /calendar/me`, `POST /me/regenerate`, `GET /feed/:token` | Artist + Caster › Settings (calendar subscription) |
| `GET /admin/users`, `GET /:id`, `POST /:id/status` | Admin › Users, User detail (suspend/ban/reactivate) |
| `GET /admin/applications`, `POST /:id/{approve,reject}` | Admin › Applications queue + review |
| `GET /admin/jobs`, `GET /:id`, `POST /:id/remove` | Admin › Jobs, Job detail (remove) |
| `GET /admin/bookings`, `GET /:id` | Admin › Bookings, Booking detail |
| `GET /admin/payments`, `POST .../release`, `POST .../refund` | Admin › Payments, Payment detail (force release/refund) |
| `GET /admin/disputes` | Admin › Disputes queue |
| `GET /admin/flagged/messages`, `GET /admin/flagged/reviews` | Admin › Flagged content |
| `GET /admin/analytics/summary` | Admin › Dashboard tiles + Analytics (summary only — see G8) |
| `GET /admin/logs` | Admin › Audit log |
| `POST /webhooks/stripe` (Stripe→server) | No UI; effects surface via escrow status everywhere |

---

## 4. Notification event coverage (PRD §14)

The Notifications page + bell render `NotificationService` rows generically
(`type`, `title`, `body`, `relatedEntityType`, `relatedEntityId`, `readAt`).
Because the list is type-driven, **every** PRD §14 event renders automatically;
the page maps each `type` to an icon + a deep link to the related entity. No
per-event hardcoding. Artist events (approved/rejected, shortlisted, rejected,
accepted, contract ready/signed, cancelled, payment released, new message,
review received), caster events (new bid, message, contract signed, cancelled,
completion reminder, auto-release reminder, dispute raised, review received),
and admin events (new application, new dispute, flagged content) all flow
through this one renderer.

---

## 5. Backend gaps & how each is handled

> **RESOLVED (confirmed):** **build everything.** Every gap below is now
> in-scope to implement *fully* — the per-row "degrade / disabled" fallbacks are
> superseded; they remain only as the contingency if a specific item is later
> descoped. New backend work (migrations, routes, hooks) is authorised. See the
> Phase 0 backend list in §11.

The brief lists features the backend does **not** yet expose. Each becomes a
real, fully-functional implementation (no fake data, no disabled stubs).

| # | Gap | Handling |
| --- | --- | --- |
| G1 | **Availability toggle** has a validator (`updateAvailabilitySchema`) but **no route**. | **[needs backend]** add `PATCH /artists/me/availability` (schema ready) + `useUpdateAvailability` hook. Until then the toggle is disabled with a tooltip. Recommend building the route — it's ~10 lines. |
| G2 | **Saved jobs** (artist bookmark) — no endpoint (query-keys has a `saved` namespace but no API). | Implement **client-side** via `localStorage` (`useSavedJobs` hook) keyed by job id; Saved Jobs page hydrates by fetching each saved job via `GET /jobs/:id`. Clearly a per-device list. Flag for confirmation; trivial backend table if persistence-across-devices is wanted. |
| G3 | **Global talent shortlist** (caster saves artists across jobs) — no endpoint. | Same approach: client-side `localStorage` `useTalentShortlist`; Shortlist page hydrates via `GET /talent/:id`. The only server "shortlist" is per-bid (`/bids/:id/shortlist`). Flag. |
| G4 | **Report a message thread** for harassment/ToS — no user-facing report endpoint (messages auto-flag via regex only). | **[needs backend]** add `POST /messages/threads/:id/report`. Until then the thread UI shows the ToS warning + a "Report" button that is disabled with an explanatory tooltip. Recommend the small endpoint. |
| G5 | **Account deletion** — no endpoint. | **[needs backend]** add `DELETE /artists/me` / `DELETE /casters/me` with the PRD guards (blocked if active bookings / escrow held / pending payouts). Until then the Delete Account page renders the policy + a disabled control. Flag. |
| G6 | **Notification email preferences** — no field/endpoint. | Render the preferences UI but flag it [needs backend] (a `notificationPrefs Json` column + `PATCH`); until then it is read-only/disabled with a note. Flag. |
| G7 | **Public-by-id artist profile** — `GET /talent/:id` is caster-auth; the public `/artists/[id]` page currently uses **mock data**. | Caster "Artist public profile" → real `useTalentProfile`. Artist "public profile preview" → render their own `GET /artists/me` in the same view. The truly-public unauthenticated `/artists/[id]`: **[needs backend]** add a public read endpoint (sanitised, approved-only) **or** gate the page behind caster login. Remove `lib/mock` usage either way. Flag for decision. |
| G8 | **Analytics charts** — only `GET /admin/analytics/summary` (totals), no time-series. | Build the summary **tiles** now (real). Time-series charts (users/week, jobs/week, fill rate, revenue over time, dispute rate, avg time-to-booking) are **[needs backend]** — add `GET /admin/analytics/timeseries`. Until then the Analytics page shows the real summary + clearly-labelled "Coming soon — requires reporting endpoint" placeholders (no fake charts). Flag. |
| G9 | **Flagged content** — only `GET /admin/flagged/{messages,reviews}` (read-only, no reporter, no jobs/profiles, no clear/action endpoints). | Build the queue from the two real endpoints (messages + reviews). "Take action" maps to existing endpoints: remove the parent **job** (`/admin/jobs/:id/remove`), **suspend/ban** the author (`/admin/users/:id/status`). **[needs backend]** for: clear-flag, flag jobs/profiles, store reporter identity, remove-a-review. Surface what exists; disable unbacked actions with notes. Flag. |
| G10 | **Admin read access to a user's message threads / a dispute's thread history** — no enumeration endpoint; `GET /messages/threads/:id` works only with a known id (admin allowed). | Dispute detail: **[needs backend]** add an admin lookup `GET /admin/bookings/:id/thread` (or include `threadId` on admin booking/dispute detail) so the existing `GET /messages/threads/:id` can render history. Until then show the dispute's two written submissions (real) + a note that inline thread history needs the lookup. Flag. |
| G11 | **Caster billing history / downloadable invoices** — no caster payments list or invoice generator. | Billing page derives a real history from `GET /bookings/me/list` + each booking's payment summary. **[needs backend]** for downloadable PDF invoices. Disable the download with a note. Flag. |
| G12 | **Admin user-detail aggregation** (booking/bid history, payment history, login history, admin-actions-on-user) — `GET /admin/users/:id` returns user + profiles + `strikeCount` only; admin bookings/logs lack a `userId`/`entityId` filter. | Show what's real: account fields, linked profile, strike count, approval status. **[needs backend]** filters (`/admin/bookings?userId=`, `/admin/logs?entityId=`, expose `Session` rows for login history) to populate the rest. Surface available data; label the rest as needing filters. Flag. |

> **All of the above are confirmed in scope to build fully**, including the
> larger ones: G6 (notification-prefs column + PATCH), G8 (analytics time-series
> endpoint + charts), G9 (flag jobs/profiles, reporter identity, clear-flag,
> remove-review), G11 (PDF invoice generation), and G2/G3 (backend
> `SavedJob` / `TalentShortlist` tables). G7 gets a real public, sanitised,
> approved-only artist endpoint (the public `/artists/[id]` becomes real data).

---

## 6. Real-time messaging (Hono WebSocket) — **[flagged: touches backend]**

**Current reality:** the backend `/ws/messages/:threadId` handler has **no auth,
no participant check, and never broadcasts or persists** — it only logs. The
frontend has **no WebSocket code at all** (messaging is TanStack-Query
invalidation/poll today). So "wire up real-time correctly" requires backend
work, which is outside a pure dashboard build.

**Plan (recommended):**

1. **Backend** (`apps/api/src/index.ts` + a small `ws/registry.ts`):
   - On upgrade, authenticate via the session cookie (reuse
     `auth.api.getSession`) and verify the user is a participant of `threadId`
     **and** the thread is `unlocked` — else close with a policy code. (Mirrors
     the REST `THREAD_LOCKED` gate.)
   - Maintain an in-memory `Map<threadId, Set<socket>>` registry.
   - Persistence stays via `POST /messages/threads/:id` (unchanged). After a
     successful send, **broadcast** the persisted message to the thread's
     sockets (call the registry from `MessageService.sendMessage`, or have the
     route emit after the service returns). Single-instance MVP only — note the
     same multi-replica caveat as rate-limiting (needs pub/sub later).

2. **Frontend** (`lib/hooks/use-thread-socket.ts`, NEW):
   - `useThreadSocket(threadId)` opens `new WebSocket(${NEXT_PUBLIC_WS_URL}/ws/messages/${threadId})`
     on mount of the thread view, closes on unmount; on inbound message it
     `queryClient.setQueryData(queryKeys.messages.forThread(id), …)` to append,
     and bumps the inbox query. Falls back to the existing invalidation/poll if
     the socket errors or `NEXT_PUBLIC_WS_URL` is unset (so messaging always
     works). Cookie auth rides the WS handshake (same-origin credentials).
   - **Per role:** identical hook for artist and caster (both are thread
     participants); **admins do not open sockets** (read-only moderation via
     REST). Initialised only inside the `MessageThreadView` component, which
     only renders for unlocked threads.

> **RESOLVED (confirmed):** the **backend broadcast is in scope** — true
> real-time, plus the `useThreadSocket` client with graceful poll fallback.

---

## 7. ARTIST dashboard — page specs

Layout: `app/(artist)/layout.tsx` (guard per §1.2) → `DashboardShell role="artist"
notificationsHref="/artist/notifications"`. All artist pages require
`approvalStatus === 'approved'` (else layout redirects to onboarding).

### 7.1 Dashboard home — `/artist/dashboard` *(PRD: Dashboard)*
- **Data:** `useMyBids({status:'pending'})`, `useMyBookings()`, `useMyInvites({status:'pending'})`, `useNotifications({unread:true})`, `useMyArtistProfile` (availability + ratingCount for "New to Platform"), `useConnectStatus` (payout nudge).
- **UI:** `StatCard` row (Pending bids · Upcoming shoots · Unread messages · Availability); "New to Platform" badge when `ratingCount === 0` and no completed bookings; **availability toggle** (`Switch`, G1); upcoming confirmed shoots list; pending-bids list with `StatusBadge`; quick link → Job Feed; Stripe-Connect setup banner if `!payoutsEnabled`.
- **Actions:** toggle availability (G1); navigate to feed/bids/bookings/messages.
- **States:** each widget independent loading/empty/error; FORBIDDEN→"not approved" (defensive — layout already gates).
- **Rules:** §10.9 New-to-Platform badge; §8.5 no bid counts.

### 7.2 Job Feed — `/artist/jobs` *(Job feed)*
- **Data:** `useJobs(filters)` → `GET /jobs` (active, public, deadline-open, headcount-available; location stripped server-side). Filters: city, shoot-date range, rate range (client-applied over the returned page where the API lacks the facet; city via API param).
- **UI:** filter bar (city select, `date-range`, `range-slider`); job cards: title, category badge, shoot date, location *city* (never exact address), rate or "Open to Bids", **spots remaining** (`headcountRequired − headcountFilled`); **no bid count**; bookmark/save toggle (G2).
- **Actions:** open job; save/unsave (G2); clear filters.
- **States:** loading skeleton grid; empty "No matching jobs — adjust filters"; error+retry.
- **Rules:** §8.5 (no bid counts, spots remaining); category matching to artist type.

### 7.3 Job Detail — `/artist/jobs/[id]` *(Job detail)*
- **Data:** `useJob(id)`; `useMyBids` to detect an existing bid (one-per-job lock).
- **UI:** full job info (description, requirements, shoot date/duration, rate type, usage rights, NDA/exclusivity flags, deadline, spots remaining); exact location shown as `<LockedField>` (revealed only post-contract); caster shown as **company name only**. Primary CTA: "Submit Bid" (or "View your bid" if one exists).
- **Actions:** Submit Bid → 7.4; Save job (G2).
- **States:** loading; 404/410 (expired/filled) → friendly "This job is no longer open"; error+retry.
- **Rules:** §13.2 company-name-only; §10.5 one bid per job (CTA swaps to "Edit/View bid").

### 7.4 Submit Bid — `/artist/jobs/[id]/bid` *(Submit bid)*
- **Data:** `useJob(id)` (rate type/amount); `useMyArtistProfile` (portfolio for highlight picker).
- **UI/Form (RHF + `submitBidSchema`):** proposed rate — **pre-filled & read-only when `rateSetBy==='caster'` (fixed)**, editable when `rateSetBy==='open'`; **`estimatedHours` required when `paymentType==='hourly'`**; cover note (≤500, counter; schema min 20); highlight up to **5** portfolio items (multi-select from own portfolio); review summary → submit.
- **Actions:** `useSubmitBid` → `POST /bids/jobs/:jobId`; success → toast + redirect to My Bids.
- **States:** submitting; validation inline; **409 DUPLICATE → "You've already bid on this job"** (redirect to the existing bid); FORBIDDEN→not-approved.
- **Rules:** §8.6 (5 highlights, 500-char note, pre-filled fixed rate), payment-type hours logic.

### 7.5 My Bids — `/artist/bids` *(My bids)*
- **Data:** `useMyBids({status})` per tab.
- **UI:** Tabs — Pending · Shortlisted · Rejected · Accepted · All; each row: job title, **caster company name** (not personal), proposed rate, `StatusBadge`, submitted date, link to job. Pending rows show Edit/Withdraw; shortlisted+ are visibly **locked**.
- **Actions:** Edit (pending only) → 7.6; Withdraw (`useWithdrawBid`, pending/shortlisted) with confirm dialog.
- **States:** per-tab loading/empty ("No pending bids — browse the feed")/error.
- **Rules:** §10.5 edit/withdraw only while pending; lock thereafter.

### 7.6 Bid Detail — `/artist/bids/[id]` *(Bid detail)*
- **Data:** `useMyBids` (find by id) or detail via list; related job via `useJob`.
- **UI:** full bid (rate, hours, cover note, highlighted items), status timeline, caster company. If **shortlisted**: a **Counter-offer** panel (propose new rate/hours/message, one pending at a time) and a link to the (now unlocked) message thread.
- **Actions:** Edit/Withdraw (pending); `useProposeCounter` → `POST /bids/:id/counter` (shortlisted only); go to thread.
- **States:** loading/empty/error; counter "one pending offer" 409 handled.
- **Rules:** counter only on shortlisted; edit lock; messaging unlocked from shortlist.

### 7.7 Saved Jobs — `/artist/jobs/saved` *(Saved jobs)*
- **Data:** `useSavedJobs` (G2, localStorage ids) → hydrate via `GET /jobs/:id` each.
- **UI:** saved job cards (same card as feed) with Remove.
- **Actions:** remove from saved; open job.
- **States:** loading; empty "No saved jobs yet"; per-card error if a job 404s (offer remove).
- **Rules:** client-side persistence (flagged G2).

### 7.8 Invitations — `/artist/invites` *(no explicit PRD screen; surfaces unused `invites` API; PRD §9.3)*
- **Data:** `useMyInvites({status})`.
- **UI:** invite cards: job title, caster company, message, status; shoot location masked (pre-booking). Tabs Pending/Accepted/Declined.
- **Actions:** Accept (`POST /invites/:id/accept` → unlocks bidding on the invite-only job, routes to Submit Bid) / Decline.
- **States:** loading/empty "No invitations"/error.
- **Rules:** §9.3 invite-only flow; approved-artist only (API enforces).

### 7.9 Bookings — `/artist/bookings` *(My bookings)*
- **Data:** `useMyBookings()` (artist scope; location masked until signed).
- **UI:** booking cards: shoot date, caster **company**, agreed rate, **net payout after commission** (`Money` w/ breakdown), `StatusBadge`. 
- **Actions:** open detail; "Sign contract" shortcut when contract `pending`/`partially_signed`.
- **States:** loading/empty "No bookings yet"/error.
- **Rules:** §11.2 commission shown; §13.2 company-only until signed.

### 7.10 Booking Detail — `/artist/bookings/[id]` *(Booking detail)*
- **Data:** `useBooking(id)` (triggers lazy auto-release server-side), `useContract(bookingId)`, `useBookingReviews`.
- **UI:** shoot details with **address/call-time as `<LockedField>` until `contract.status==='fully_signed'`**; caster contact (name+email) shown **only when the booking payload carries them** (post-booking); contract status + escrow/payment status badges; **net payout breakdown**. If shoot date passed & booking `completed` & within **14–28 day** window → "Leave a review" prompt; if within 72h of shoot date → "Raise a dispute" entry.
- **Actions:** View/Sign contract (7.11); Cancel booking (cancellation-policy dialog, §10.6 tiers + strike warning when <48h); Leave review (7.16); Raise dispute (7.18).
- **States:** loading/empty/error; clear locked banners.
- **Rules:** §10.7 location lock; §13.2 contact reveal; §10.9 review window; §10.6 cancellation tiers + strikes; §10.8 dispute window.

### 7.11 Contract review & sign — `/artist/bookings/[id]/contract` *(Contract review & sign)*
- **Data:** `useContract(bookingId)` (`generate` if absent, idempotent).
- **UI:** formatted contract (legal names, job, shoot date, **location only if fully_signed**, agreed rate & payment terms, usage rights, exclusivity, NDA, jurisdiction); **72-hour signing deadline** countdown; PDF download when `pdfUrl` present.
- **Actions:** typed legal-name signature field + "I agree" checkbox → `useSignContract` → `POST .../sign`. Both signed → `fully_signed` (location unlocks).
- **States:** loading; deadline-passed/voided state; already-signed state; error.
- **Rules:** §12.2 e-signature; §10.7 72h deadline + reveal-on-sign.

### 7.12 Earnings — `/artist/earnings` *(Earnings dashboard)*
- **Data:** `useMyBookings()` + payment summaries; `useConnectStatus`.
- **UI:** summary `StatCard`s — Total earned (all-time released) · Pending escrow (held) · Paid out; per-booking table: gross → commission → net → status (`StatusBadge` on escrow). **Stripe Connect prompt** if `!payoutsEnabled`.
- **Actions:** "Set up payouts" → 7.13.
- **States:** loading/empty "No earnings yet"/error.
- **Rules:** §11.2/§11.3 full breakdown; commission from net.

### 7.13 Payout settings — `/artist/earnings/payout` *(Payout settings)*
- **Data:** `useConnectStatus` → `GET /payments/connect/status`.
- **UI:** Connect status card (not connected / pending / enabled); explanation of 2–3 business-day payouts.
- **Actions:** `useStartConnectOnboarding` → `POST /payments/connect/onboard` → redirect to Stripe; return shows live status.
- **States:** loading; error+retry; "complete on Stripe" pending state.
- **Rules:** §11.3.

### 7.14 My Profile (view) — `/artist/profile` *(My profile)* & Public preview — `/artist/profile/preview`
- **Data:** `useMyArtistProfile`.
- **UI (view):** profile as casters see it (primary photo, name, city, experience, bio, model stats / actor skills+reel, portfolio, rating or New-to-Platform, jobs completed, availability badge, Verified badge if `idVerified`). **Preview** route renders the same in the *public* `ArtistProfileView` shell with the **shareable URL** `castflow.co.uk/artists/<id>` + copy button + "Download comp card" (`/artists/:id/comp-card`).
- **Actions:** Edit → 7.15; copy shareable URL; download comp card.
- **States:** loading/empty/error.
- **Rules:** §8.4 public profile; §13.1 Verified badge; G7 (preview uses own real data, not mock).

### 7.15 Edit profile / stats / portfolio — `/artist/profile/edit` *(Edit profile, Edit stats, Manage portfolio)*
- **Data:** `useMyArtistProfile`.
- **UI:** sectioned editor (single page with anchors, or sub-tabs): Personal (`artistPersonalInfoSchema`), Experience & rates (`artistExperienceSchema` + Instagram), Model stats (`modelStatsSchema`) **or** Actor stats (`actorStatsSchema`) + Skills (`replaceSkillsSchema`) by `artistType`, Availability (G1), Portfolio manager (drag-reorder, set primary, captions, add/remove via `uploads`). Artist-type switch shown but **disabled once submitted/approved** with a note.
- **Actions:** the matching `PATCH /artists/me/*` / `PUT skills` hooks; portfolio: `useUploadFile` (presign→PUT w/ progress→confirm), `useDeletePortfolioItem`, `useSetPrimaryPortfolioItem`. **Re-review note:** changing review-relevant fields surfaces "Some changes may require admin re-review" and offers `submitForReview` where applicable.
- **States:** per-section saving/dirty/error; upload progress + retry (preserve audit M16/M17 behaviour).
- **Rules:** §8.13 re-review note; artist-type lock; min-3-photos guidance.

### 7.16 Messages inbox + thread — `/artist/messages`, `/artist/messages/[threadId]` *(Messages inbox, Message thread)*
- **Data:** `useThreads()`; thread: `useMessages`, `useSendMessage`, `useMarkThreadRead`, **`useThreadSocket` (§6)**.
- **UI:** inbox — thread cards (caster company, job title, last-message preview, time, unread badge); thread — conversation, composer, flagged-message redaction notice, ToS "no off-platform contact" warning, **Report thread** button (G4).
- **Actions:** send (live via socket, REST persists); mark read on open; report (G4, disabled until endpoint).
- **States:** inbox empty "Messaging unlocks when a caster shortlists you"; **thread 403 THREAD_LOCKED** → locked screen; loading/error.
- **Rules:** §8.10/§10.10 unlock-on-shortlist + off-platform flagging.

### 7.17 Reviews — `/artist/reviews` *(My reviews + Leave a review)*
- **Data:** `useArtistReviews(myProfileId)` (received); `useMyBookings` to find completable bookings (review-window).
- **UI:** reviews received (stars + comment + caster); "Reviews you've left"; a "Leave a review" prompt list for bookings in the **14–28 day** window.
- **Actions:** Leave review → 7.16-style modal/page (`submitReviewSchema`, 1–5 + ≤500); cannot edit after submit.
- **States:** loading/empty ("No reviews yet — New to Platform")/error; window-closed/early messaging from API.
- **Rules:** §10.9 window + immutability.

### 7.18 Notifications — `/artist/notifications` *(Notifications)*
- **Data:** `useNotifications({limit:100})`.
- **UI/Actions:** §4 renderer; mark-one/mark-all/delete; unread highlight; deep links.
- **States:** loading/empty/error.

### 7.19 Raise dispute — `/artist/bookings/[id]/dispute` & Dispute detail — `/artist/disputes/[id]` *(Raise dispute, Dispute detail)*
- **Data:** `useDispute(bookingId)`.
- **UI (raise):** reason (enum select) + description (≥50); only within **72h of shoot date**. **(detail):** both submissions, booking ref, status, resolution outcome if resolved, evidence submission box while `open`/`under_review`.
- **Actions:** `raiseDispute`; `submitDisputeEvidence`.
- **States:** window-closed message; loading/empty/error; "escrow frozen while open" banner.
- **Rules:** §10.8 72h window; §11.5 frozen escrow.

### 7.20 Account settings + Delete — `/artist/settings`, `/artist/settings/delete` *(Account settings, Delete account)*
- **Data:** session; `useConnectStatus`; `getCalendarFeedUrl`.
- **UI:** change email & password (Better Auth client flows); **notification preferences** (G6, disabled+note); **payout bank account** (Connect manage → 7.13); **availability toggle** (G1); **calendar subscription** (`CalendarFeedCard`: feed URL + regenerate + copy); Delete account page = policy + **disabled** control (G5, blocked if active bookings/pending payouts).
- **States:** per-control saving/error.
- **Rules:** §8.13 delete guards.

---

## 8. CASTER dashboard — page specs

Layout: `app/(caster)/layout.tsx` (guard + fail-closed onboarding gate per §1.2)
→ `DashboardShell role="caster"`.

### 8.1 Dashboard home — `/caster/dashboard` *(Dashboard)*
- **Data:** `useMyJobs({limit})` (active + bid `_count`), `useMyBookings()`, `useThreads()` (unread), `useNotifications({unread:true})`.
- **UI:** `StatCard`s — Active jobs · Unread messages · Upcoming confirmed shoots · **Total spend this month** (sum of held+released escrow on this month's bookings); active jobs list with **bid counts** (casters DO see counts); upcoming shoots; primary CTA "Post a New Job".
- **Actions:** post job; open jobs/bookings/messages.
- **States:** widget-level loading/empty/error.
- **Rules:** §7.2.

### 8.2 My Jobs — `/caster/jobs` *(My jobs)*
- **Data:** `useMyJobs({status})`.
- **UI:** grouped tabs — Active · Filled · Expired · Cancelled (map `JobStatus`); cards: title, category, shoot date, **bid count**, spots remaining, application deadline, `StatusBadge`.
- **Actions:** View bids (→8.6); Edit (→8.5); Close/Cancel (`cancelJob`, confirm); Delete-if-no-bids (uses cancel; delete only meaningful pre-bids — show only when `_count.bids === 0`).
- **States:** per-tab loading/empty/error.
- **Rules:** §10.3 edit rules; §7.3.

### 8.3 Post a Job (6-step wizard) — `/caster/jobs/new` *(Post job — 6 steps)*
- **Data/Form:** rebuilt `job-wizard.tsx`, one RHF instance with `createJobSchema`, per-step `form.trigger(STEP_FIELDS[n])`. Steps: **1 Basics** (title, category Model/Actor/Voiceover/Extra, subcategory, rich-text description via Tiptap); **2 Requirements** (gender, age min/max, city, model physical reqs *or* actor skills multiselect); **3 Shoot** (date, duration hours, rate type Fixed/Open, **rate amount required when fixed+caster-set**, headcount, application deadline); **4 Legal** (NDA, exclusivity, usage rights free text); **5 Visibility** (Public/Invite-only); **6 Review** (full summary, edit any step, Post).
- **Actions:** `useCreateJob` → `POST /jobs` → redirect to job detail. Public posts notify matching artists (server-side).
- **States:** per-step validation; submitting; payment-type conditional fields; error toast.
- **Rules:** §7.3; payment-type/rateSetBy logic; single canonical wizard (the old duplicate `new/*` routes are gone).

### 8.4 Job Detail — `/caster/jobs/[id]` *(Job detail)*
- **Data:** `useJob(id)` (own job, full) + `useBidsForJob(id)` summary.
- **UI:** full job summary, edit/close actions, bids preview with **count**, spots remaining, deadline.
- **Actions:** Edit (8.5), Close (`cancelJob`), View all bids (8.6).
- **States:** loading/empty/error.

### 8.5 Edit Job — `/caster/jobs/[id]/edit` *(Edit job)*
- **Data:** `useJob(id)`.
- **UI/Form:** `updateJobSchema` (non-critical fields freely; `paymentType`/`category` not editable). **Critical-field changes (shoot date / rate / location / deadline)** show a warning: "This notifies all existing bidders and lets them withdraw."
- **Actions:** `useUpdateJob` → `PATCH /jobs/:id` (server notifies pending+shortlisted bidders).
- **States:** saving/validation/error; only `active`/`draft` editable.
- **Rules:** §10.3.

### 8.6 Bids for a job — `/caster/jobs/[id]/bids` *(Bids for a job)* & Bid detail — `/caster/jobs/[id]/bids/[bidId]` *(Bid detail)*
- **Data:** `useBidsForJob(jobId)` (full artist preview); detail drills into one bid.
- **UI:** sortable/filterable list (by date, proposed rate, shortlist status); each bid: **artist photo, name, proposed rate, cover note, highlighted portfolio items**, link to full profile; spots-remaining counter for multi-artist jobs; counter-offer panel when one exists.
- **Actions per bid:** **Shortlist** (`/bids/:id/shortlist` — unlocks messaging, notifies); **Reject** (`/bids/:id/reject` + reason; **Undo within 24h** via `/bids/:id/undo-reject`); **Accept** (`/bids/:id/accept` → requires `shootLocation` → triggers Booking flow 8.10); accept/decline counter-offers.
- **States:** loading/empty "No bids yet"/error; multi-accept until headcount filled (then remaining auto-expire server-side).
- **Rules:** §7.5, §9.2 multi-artist, §10.5 24h undo.

### 8.7 Talent Search — `/caster/talent` *(Talent search)*
- **Data:** `useSearchTalent(filters)` → `GET /talent` (approved + available only; API supports `artistType`, `city`, `search`, cursor).
- **UI:** filter sidebar — category, gender, age range, city, height, skin tone, hair/eye colour, skills, experience level, min rating; sort — most reviewed / highest rated / most completed / newest. **API-backed facets:** artistType, city, search. **Client-applied facets/sorts** over the fetched set, clearly noted (see G-note below). Result grid: photo, **first name**, city, rating, artistType.
- **Actions:** open profile (8.9); add to **Shortlist** (G3); **Invite to apply** (pick one of caster's open jobs → `POST /invites/jobs/:jobId`).
- **States:** loading/empty/error.
- **Rules:** §7.4, §13.2 first-name-only. **Note:** richer filters/sorts beyond artistType/city/search are client-side over the current page; full server faceting is a backend follow-up (related to G-series). Flagged.

### 8.8 Shortlist — `/caster/talent/shortlisted` *(Shortlisted talent)*
- **Data:** `useTalentShortlist` (G3 localStorage) → hydrate via `GET /talent/:id`.
- **UI:** saved artists across all jobs; cards with Remove + View + Invite.
- **Actions:** remove; view profile; invite to a job.
- **States:** loading/empty "No shortlisted talent"/error.
- **Rules:** client-side persistence (G3).

### 8.9 Artist public profile — `/caster/talent/[id]` *(Artist public profile)*
- **Data:** `useTalentProfile(id)` → `GET /talent/:id` (caster-auth; sensitive fields excluded server-side).
- **UI:** full public profile (stats/skills/portfolio/reviews/rating); **first name + stats only before booking; full contact only after a booking exists**; reviews via `useArtistReviews`. Comp-card download.
- **Actions:** Shortlist (G3); Invite to apply; Message (only if a thread is already unlocked for a job).
- **States:** loading/404 (not approved)/error.
- **Rules:** §13.2 contact reveal; uses real data (no mock).

### 8.10 Booking flow (on Accept) — modal + `/caster/bookings/[id]/pay` *(Booking flow, Booking payment)*
- **Data:** triggered from 8.6 Accept; `useBooking(id)`.
- **UI:** (1) confirmation modal — artist, job, agreed rate, shoot date (Accept requires `shootLocation`); (2) **payment screen** — Stripe Elements; `createEscrowIntent` → confirm card → escrow held; commission note ("artist's payout is net of commission; you pay the agreed rate in full"); (3) confirmation screen → contract auto-generates.
- **Actions:** `useCreateEscrowIntent` → `POST /payments/bookings/:id/intent`; Stripe confirm; on webhook `payment_intent.succeeded` escrow→held, booking→confirmed.
- **States:** intent loading; card error; "payment processing"; success.
- **Rules:** §7.6, §11.1 escrow, §11.2 commission-on-artist-side.

### 8.11 Bookings — `/caster/bookings` *(My bookings)*
- **Data:** `useMyBookings()` (caster scope).
- **UI:** cards with status (awaiting contract / contract pending artist signature / confirmed / completed / disputed / cancelled — mapped from `BookingStatus` + `ContractStatus`), artist (**company-only equivalent: artist first name** until signed), shoot date, agreed rate, payment/escrow status.
- **Actions:** open detail.
- **States:** loading/empty/error.
- **Rules:** §13.2.

### 8.12 Booking Detail — `/caster/bookings/[id]` *(Booking detail, Confirm shoot completion)*
- **Data:** `useBooking(id)`, `useContract`, `useBookingReviews`, `useDispute`.
- **UI:** full shoot details (own data — caster set the location), contract status, **escrow status**, **artist contact shown post-contract-signature**; cancellation-policy panel (timing-aware, §10.6 caster tiers).
- **Actions:** **Confirm completion** (`confirm-completion`, **date-locked — disabled until after shoot date** with explanatory tooltip; on confirm → escrow releases); **Release escrow** (explicit `release` where applicable); **Cancel booking** (policy dialog); **Raise dispute** (8.14); Leave review (8.13) when completed + window open. Banner: "If you do nothing within 48h of the shoot date, payment auto-releases."
- **States:** loading/empty/error; date-lock & auto-release banners.
- **Rules:** §10.8 date-lock + 48h auto-release; §10.6 cancellation; §11.5 dispute freeze.

### 8.13 Contract review & sign — `/caster/bookings/[id]/contract` *(Contract review & sign)*
- Same structure as 7.11 (caster signature side). `useContract` + `useSignContract`. 72h deadline; both-signed → fully_signed. PDF download.

### 8.14 Leave a review — `/caster/bookings/[id]/review` *(Leave a review)*
- **Data:** `useBooking(id)`.
- **UI/Form:** 1–5 stars + optional ≤500 comment; **14-day** window prompt (PRD §7.9; API enforces the 14–28 window); cannot edit after submit.
- **Actions:** `useSubmitReview` → `POST /reviews/bookings/:id`.
- **States:** window/early messaging from API; submitting; done.
- **Rules:** §7.9/§10.9.

### 8.15 Messages — `/caster/messages`, `/caster/messages/[threadId]` *(Messages inbox, thread)*
- Same shared components as artist (8.x parity), `basePath="/caster/messages"`; per-job per-artist threads; only after shortlisting; `useThreadSocket` (§6); Report (G4).

### 8.16 Raise dispute + detail — `/caster/bookings/[id]/dispute`, `/caster/disputes/[id]` *(Raise dispute, Dispute detail)*
- Same structure as 7.19 (caster side). 72h window; escrow frozen banner; submissions + outcome.

### 8.17 Notifications — `/caster/notifications` *(Notifications)*
- §4 renderer (shared `NotificationList`, `basePath="/caster"`).

### 8.18 Account & Settings — `/caster/settings` + Billing — `/caster/settings/billing` + Notification settings — `/caster/settings/notifications` + Delete — `/caster/settings/delete` *(Account settings, Billing & subscription, Notification settings, Delete account)*
- **Data:** `useMyCaster`; `getCalendarFeedUrl`; `useMyBookings` (billing history).
- **UI:** edit company info & contact name (`PATCH /casters/me`), logo (upload + clear), change email/password (Better Auth); **Notification settings** (G6, disabled+note); **Billing** = real history derived from bookings+payments, with **invoice download disabled** (G11); calendar subscription card; **Delete account** = policy + disabled control (G5, blocked if active bookings or escrow held).
- **States:** per-control saving/error.
- **Rules:** §7.10 delete guards.

---

## 9. ADMIN dashboard — page specs

Layout: `app/(admin)/layout.tsx` (guard, 403 on non-admin) →
`DashboardShell role="admin" brand="CastFlow Admin" brandHref="/admin"`.
Every admin API call is `requireRole('admin')` server-side.

### 9.1 Dashboard home — `/admin` *(Dashboard)*
- **Data:** `useAdminAnalyticsSummary` → `GET /admin/analytics/summary`; `useAdminApplications({status:'pending'})` count; `useAdminDisputes({status:'open'})` count.
- **UI:** `StatCard` tiles — total users (artists+casters), pending applications, open disputes, revenue this month (grossVolume/commission), bookings this week; quick-action links → Applications, Disputes, Flagged.
- **States:** loading/error per tile.
- **Rules:** §6.1.

### 9.2 Applications queue + review — `/admin/applications`, `/admin/applications/[id]` *(Applications queue, Application review)*
- **Data:** `useAdminApplications({status})`; review pulls the artist profile + **ID document** via `GET /artists/me/id-document/url` pattern (admin-scoped presigned read).
- **UI (queue):** table of pending apps; filter by type (model/actor), date submitted, location (client over the page where API lacks the facet). **(review):** full **public-style profile preview** + **secure ID viewer (no download)**.
- **Actions:** **Approve** (`/applications/:id/approve` → notifies, profile live, sets `idVerified`); **Reject** (`/applications/:id/reject`) with **reason picker** (portfolio quality / ID unclear / info incomplete / suspected duplicate / Other+free-text required) → notifies with reason + reapply note.
- **States:** loading/empty "Queue clear"/error.
- **Rules:** §6.2; §13.1 ID handling.

### 9.3 Users + detail — `/admin/users`, `/admin/users/[id]` *(All users, User detail)*
- **Data:** `useAdminUsers({role,status,search,cursor})`; `useAdminUser(id)`.
- **UI (list):** table, search + filter by role/status/registration date/location (API supports role/status/search; date/location client-side). **(detail):** account + linked profile + **strike count** + approval status + status history. Sections for booking/bid history, threads, payment history, login history, admin-actions = present but **labelled "needs filter endpoint"** where unbacked (G12).
- **Actions:** **Suspend** / **Ban** / **Reactivate** via `POST /users/:id/status` (suspend/ban revoke sessions server-side); flag-for-review (maps to status note).
- **States:** loading/empty/error.
- **Rules:** §6.3; §13.4 strikes; G12 gaps flagged.

### 9.4 Jobs + detail — `/admin/jobs`, `/admin/jobs/[id]` *(All jobs, Job detail)*
- **Data:** `useAdminJobs({status,cursor})`; `useAdminJob(id)` (caster + bids+artists + bookings).
- **UI:** table (search by caster/category/status/date — status via API, rest client); detail shows full job incl. **all bids**.
- **Actions:** **Remove from platform** (`/admin/jobs/:id/remove` + reason → expires bids, refunds held escrows, logs); flag-for-review (G9 note).
- **States:** loading/empty/error.
- **Rules:** §6.4.

### 9.5 Bookings + detail — `/admin/bookings`, `/admin/bookings/[id]` *(All bookings, Booking detail)*
- **Data:** `useAdminBookings({status,cursor})`; `useAdminBooking(id)` (full relations incl. dispute + payment).
- **UI:** table with payment/escrow status; detail with job/artist/caster/payment/contract/dispute.
- **Actions:** deep links to payment actions (9.6) and dispute (9.8).
- **States:** loading/empty/error.
- **Rules:** §6.5.

### 9.6 Payments + detail — `/admin/payments`, `/admin/payments/[id]` *(Payments dashboard, Payment detail)*
- **Data:** `useAdminPayments({escrowStatus,cursor})`.
- **UI:** revenue summary (commission by period — derived from summary + the payments list); per-booking commission detail; escrow status (`StatusBadge`); Stripe payout log shown from payment fields (transfer id, releasedAt).
- **Actions:** **Force-release** (`/admin/payments/bookings/:id/release` + written reason) and **Refund** (`/admin/payments/bookings/:id/refund` + reason) — both **require a reason** and write `AdminLog`.
- **States:** loading/empty/error; confirm dialogs with mandatory reason.
- **Rules:** §6.5; exceptional-use copy.

### 9.7 Disputes queue + detail — `/admin/disputes`, `/admin/disputes/[id]` *(Disputes queue, Dispute detail)*
- **Data:** `useAdminDisputes({status})` (open first); detail via `useDispute(bookingId)` + `useAdminBooking`.
- **UI:** prioritised list (open/under_review first); detail = both parties' submissions, the booking record, **message history** (G10 — via `GET /messages/threads/:id` once threadId is resolvable; until then submissions + note).
- **Actions:** resolve via `POST /disputes/bookings/:id/resolve` — **Full release to artist / Full refund to caster / Split (percentage slider) / Escalate**; both parties notified; permanently logged.
- **States:** loading/empty "No open disputes"/error.
- **Rules:** §6.6; §11.5 frozen escrow; §13.5 frivolous-dispute counter (server-side).

### 9.8 Flagged content + review — `/admin/flagged`, `/admin/flagged/[id]` *(Flagged content, Flagged item review)*
- **Data:** `useAdminFlaggedMessages`, `useAdminFlaggedReviews`.
- **UI:** unified queue of flagged **messages** + **reviews** (real); each shows the content and context. (Jobs/profiles flagging + reporter identity = G9, not backed.)
- **Actions:** "Take action" maps to real endpoints — remove parent **job** (9.4), **suspend/ban** author (9.3). **Clear-flag / remove-review** = G9 [needs backend], disabled with note.
- **States:** loading/empty "Nothing flagged"/error.
- **Rules:** §6.7; §13.3.

### 9.9 Analytics — `/admin/analytics` *(Analytics)*
- **Data:** `useAdminAnalyticsSummary` (real totals).
- **UI:** real summary tiles; time-series charts (users/week, jobs/week, fill rate, revenue over time, dispute rate, avg time-to-booking) shown as **clearly-labelled "requires reporting endpoint"** placeholders — **no fabricated charts** (G8 [needs backend]).
- **States:** loading/error.
- **Rules:** §6.8; honest degradation.

### 9.10 Audit log — `/admin/logs` *(Admin log)*
- **Data:** `useAdminLogs({adminId,entityType,cursor})`.
- **UI:** immutable table — who/action/entityType/entityId/notes/when; filter by admin user, action/entity type, date range (admin/entityType via API; date client).
- **Actions:** none (read-only, permanent).
- **States:** loading/empty/error.
- **Rules:** §6.9.

---

## 10. Shared / utility screens (PRD §15 "Shared / Utility")

| Screen | Plan |
| --- | --- |
| **403 Forbidden** | `components/dashboard/forbidden-403.tsx` rendered by role layouts on role mismatch (§1.2). Also `app/403` not needed — layouts render it inline to preserve URL. |
| **404** | `app/not-found.tsx` (branded, public nav). |
| **500** | `app/error.tsx` (global error boundary, branded, retry). |
| **Maintenance mode** | `app/maintenance/page.tsx` (static, env-flagged via middleware short-circuit — optional, flagged). |
| **Account suspended** | `app/suspended/page.tsx` — **already exists** (kept), shown to suspended/banned via layout redirect. |
| **Pending approval** | `app/onboarding/pending/page.tsx` — **already exists** (kept). |

---

## 11. Build sequence (Step 4)

**Phase 0 — backend additions** (confirmed in scope; TDD where services have
tests; `prisma db push` for additive columns/tables — note the managed-Postgres
`migrate dev` caveat in CONTEXT.md, so use `db push` + record in CONTEXT):

- **Schema/migration:** `SavedJob` (artistId, jobId, unique) [G2]; `TalentShortlist`
  (casterId, artistId, unique) [G3]; `User.notificationPrefs Json?` [G6]; report
  storage — extend flagging with `reportedById` + a `ContentReport` model spanning
  job/profile/message/review with reason + status [G9]; (re-use existing
  `isFlagged`/`isRemoved` where present).
- **Routes/services:** `PATCH /artists/me/availability` (schema exists) [G1];
  saved-jobs CRUD (`/artists/me/saved-jobs` GET/POST/DELETE) [G2]; talent-shortlist
  CRUD (`/talent/shortlist`) [G3]; `POST /messages/threads/:id/report` [G4];
  `DELETE /artists/me` + `DELETE /casters/me` with PRD guards [G5];
  `PATCH /{artists,casters}/me/notification-prefs` [G6]; `GET /artists/public/:id`
  (sanitised, approved-only) [G7]; `GET /admin/analytics/timeseries` [G8];
  flagged: `POST .../flagged/:id/clear`, remove-review, flag jobs/profiles, include
  reporter [G9]; admin thread lookup `GET /admin/bookings/:id/thread` (or expose
  `threadId`) [G10]; caster invoices `GET /casters/me/invoices` + per-booking PDF
  via `@react-pdf/renderer` [G11]; admin filters `GET /admin/bookings?userId=`,
  `GET /admin/logs?entityId=`, expose `Session` rows for login history [G12].
- **WebSocket (§6):** authenticate upgrade, participant + `unlocked` gate, per-thread
  socket registry, broadcast persisted messages from `MessageService.sendMessage`.
- Extend `lib/api/*` + `lib/hooks/*` + `lib/query-keys.ts` for each new endpoint
  (the only additions to the otherwise-untouched data layer).
- Gate: `bun run typecheck && bun run lint` green across workspaces.

1. **Shell & primitives** — `middleware.ts`, three role `layout.tsx` guards,
   `Forbidden403`, rebuild `components/dashboard/*` (shell, nav, states,
   page-header, stat-card, status-badge, locked-field, money), shared
   `NotificationList`, `MessageInbox`/`MessageThreadView`, `CalendarFeedCard`,
   `job-wizard`. Verify typecheck/lint/build green with empty pages.
2. **Artist** pages 7.1→7.20 (feed/bids/bookings/contracts/earnings/profile/
   messages/reviews/notifications/disputes/settings).
3. **Caster** pages 8.1→8.18 (jobs/wizard/bids/talent/booking-flow/bookings/
   contracts/reviews/messages/disputes/settings).
4. **Admin** pages 9.1→9.10.
5. **WebSocket** real-time (§6) — backend broadcast + `useThreadSocket` (if
   approved).
6. **Gap endpoints** (G1/G4/G5/G10/G12 small ones) if approved.
7. Utility screens (§10). Final typecheck/lint/format/build; update `CONTEXT.md`.

Each page ships with all three states and real data before moving on. No
placeholders, no lorem, no TODOs left in place. Atomic commits per coherent
slice.

---

## 12. Decisions — RESOLVED

All five open decisions were confirmed (maximal scope):

1. **Backend gaps (§5):** **Build everything** — full implementations for
   G1–G12, no disabled stubs.
2. **WebSocket (§6):** **Wire the backend broadcast** for true real-time +
   `useThreadSocket` client with poll fallback.
3. **Saved jobs (G2) / talent shortlist (G3):** **Add backend tables**
   (`SavedJob`, `TalentShortlist`) for cross-device persistence.
4. **Public artist profile (G7):** **Add a sanitised public read endpoint**;
   the public `/artists/[id]` renders real data and `lib/mock/*` is removed.
5. **Analytics (G8) / invoices (G11):** **Build the time-series reporting
   endpoint + real charts, and PDF invoice generation** — no placeholders.

Phase 0 in §11 enumerates the backend work this entails. Build proceeds on
go-ahead.
