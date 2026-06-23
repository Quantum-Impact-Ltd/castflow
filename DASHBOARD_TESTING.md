# CastFlow — Dashboard Testing Guide

> Manual verification guide for the three role dashboards (artist / caster /
> admin), backed by the seed data in `apps/api/prisma/seed.ts`.
> Every account password is **`Password123!`**.

This guide assumes the seed has been run (see **Setup**). Each section maps a
route to the account you log in as, the data you should see, what to do, and the
expected result — including the non-negotiable business rules from the root
`CLAUDE.md`.

---

## 1. Setup

### 1.1 One-time: make sure the DB schema is current

The schema has columns added since the last `db push` (`caster_profiles.logo_url`,
`jobs.cover_image_url`). Push the schema and regenerate the client before seeding:

```bash
cd apps/api
bunx prisma db push        # apply schema (additive, no data loss)
bunx prisma generate       # regenerate the Prisma client
```

### 1.2 Run the seed

```bash
cd apps/api
bun run db:seed            # idempotent — safe to re-run; upserts everything

# To wipe all CastFlow domain data first (keeps Better Auth users/passwords):
FRESH=1 bun run db:seed
```

On success the seed prints the full credential list and the key scenarios.

> **Note on FRESH:** `FRESH=1` clears domain tables (jobs, bids, bookings, …)
> but intentionally **does not** delete `user`/`account` rows, because those are
> created through Better Auth's `signUpEmail` (which hashes the password). Reruns
> re-link profiles to the existing users. If you want a truly empty database,
> drop it and re-run `prisma db push` + seed.

### 1.3 Required env (`apps/api/.env`)

| Var | Value for testing |
| --- | --- |
| `DATABASE_URL` | your Postgres URL |
| `BETTER_AUTH_SECRET` | any ≥32-char string |
| `DEV_AUTO_VERIFY_EMAIL` | `true` (already set) — lets seeded accounts log in without a verification email |

Stripe / R2 / Resend keys are **not** required to exercise the dashboards. Where
they are missing, the relevant action (live Stripe payment, real file upload,
outbound email) will fail or no-op — those points are flagged per-page below.

### 1.4 Start both apps

```bash
# from repo root — turbo runs api (:3001) and web (:3000) together
bun run dev
```

Open `http://localhost:3000/login`.

---

## 2. Accounts

| # | Email | Password | Role | State |
| - | ----- | -------- | ---- | ----- |
| Admin | `admin@castflow.test` | `Password123!` | admin | active |
| Caster 1 | `caster1@castflow.test` | `Password123!` | caster | Acme Studios London (brand) |
| Caster 2 | `caster2@castflow.test` | `Password123!` | caster | Goldsmith Casting Agency (agency) |
| Artist 1 | `artist1@castflow.test` | `Password123!` | artist | Sophie Carter — model, **approved**, payouts on |
| Artist 2 | `artist2@castflow.test` | `Password123!` | artist | James O'Hara — actor, **approved**, payouts on |
| Artist 3 | `artist3@castflow.test` | `Password123!` | artist | Priya Patel — model, **approved**, payouts off |
| Artist 4 | `artist4@castflow.test` | `Password123!` | artist | Marcus Thompson — actor/VO, **approved**, payouts on |
| Artist 5 | `artist5@castflow.test` | `Password123!` | artist | Emma Wilson — model, **approved**, payouts off |
| Pending 1 | `pending1@castflow.test` | `Password123!` | artist | Charlie Reed — **pending** approval |
| Pending 2 | `pending2@castflow.test` | `Password123!` | artist | Olivia Bennett — **pending** approval |
| Rejected | `rejected1@castflow.test` | `Password123!` | artist | Liam Foster — **rejected** (resubmit notes) |
| Suspended | `suspended1@castflow.test` | `Password123!` | artist | Daniel Price — approved profile, **suspended** |
| Banned | `banned1@castflow.test` | `Password123!` | artist | Grace Hunt — **banned** (cannot log in) |

---

## 3. Seed data map

### Jobs — Acme (caster1)

| Job | Status | Pay | Notes / bids |
| --- | ------ | --- | ------------ |
| Spring/Summer 2026 Campaign | active | fixed £2,400 | Sophie **shortlisted**, Priya pending, Emma **rejected**. Unlocked message thread with Sophie. |
| Audiobook narration | active | hourly £85 | Marcus pending, James pending. Invite to James **declined**. Locked thread with Marcus. |
| Autumn lookbook (editorial) | filled | fixed £950 | Booking → Sophie **confirmed**, contract fully-signed, escrow **held** (shoot in +10d → completion locked). |
| Catalogue (last month) | expired | fixed £600 | No bids. |
| Winter campaign | draft | fixed £1,800 | Not visible to artists. |
| Summer 2025 lookbook | closed | fixed £800 | Booking → Sophie **completed**, escrow **released**, both 5★ reviews. |
| Beauty campaign (ready-to-sign) | filled | fixed £1,100 | Booking → Sophie **confirmed**, contract **pending_signatures**, escrow held. |
| Completed shoot (needs-review) | filled | fixed £750 | Booking → Priya **completed**, escrow released, **no reviews yet**, dispute window open. |

### Jobs — Goldsmith (caster2)

| Job | Status | Pay | Notes / bids |
| --- | ------ | --- | ------------ |
| National TV commercial | active | hourly £100 | NDA. James pending, Marcus **withdrawn**. |
| Brand ambassador | active, **invite_only** | fixed £12,000 | NDA + exclusivity. Sophie invited (**accepted**) + bid pending; Priya invited (pending). |
| Lookbook (open rate) | active | fixed **open** | Sophie £1,200, Priya £950, Emma £700 — all pending. |
| Catalogue half-day | filled | fixed £450 | Booking → Emma **pending_payment** (caster must pay escrow). |
| Cancelled shoot | cancelled | fixed £700 | Booking → Priya **cancelled**, payment **partially_refunded**, £350 cancellation fee. |
| Disputed shoot | closed | fixed £1,200 | Booking → James **disputed**, dispute **under_review** (both submissions in). |
| Confirmable shoot | filled | fixed £900 | Booking → James **confirmed**, shoot **yesterday**, escrow held → completion now confirmable. |
| Auto-release overdue | filled | fixed £600 | Booking → Emma **confirmed**, shoot −3d, escrow held, `autoReleaseAt` **in the past**. |
| Flagged content | closed | fixed £500 | Booking → Marcus **completed**. **Flagged 2★ review** + **flagged message** for admin queue. |

---

## 4. Artist dashboard

Log in as **Sophie (`artist1`)** unless a row says otherwise — she has the richest data.

| Route | Account | Do / Expect |
| ----- | ------- | ----------- |
| `/artist/dashboard` | Sophie | Stat tiles populate (active bids, bookings, unread). "Shortlisted" + upcoming editorial booking surface. Availability toggle present. |
| `/artist/jobs` | Sophie | Public job feed: Spring campaign, commercial, open-rate, audiobook visible. **Draft and expired jobs are NOT listed.** Invite-only ambassador not in the public feed. |
| `/artist/jobs/[id]` | Sophie | Open Spring campaign → full detail. **Shoot location detail is hidden/locked** (no contract). Rate shows "£2,400 flat fee". |
| `/artist/jobs/[id]/bid` | **Marcus** (`artist4`) | Open the **audiobook** job (hourly) → bid form shows hourly rate + estimated hours; total estimate computes. Submit a new bid. On a job Marcus already bid → blocked (**one bid per job**). |
| `/artist/jobs/[id]/bid` | Emma (`artist5`) | Open **open-rate** job → "propose your fee" (no caster rate). |
| `/artist/bids` | Sophie | Bid list: Spring **shortlisted**, ambassador pending, open-rate pending, editorial accepted, history accepted. Emma shows a **rejected** bid with reason. |
| `/artist/bids/[id]` | Sophie | Open the shortlisted Spring bid → status badge + cover note + linked job. |
| `/artist/saved` | Sophie | Save a job from the feed → appears here. **Note:** saved-jobs are localStorage only (no backend table yet) — clears on storage reset. |
| `/artist/invites` | Sophie | Ambassador invite shown as **accepted**. | 
| `/artist/invites` | **Priya** (`artist3`) | Ambassador invite **pending** → Accept / Decline actions work. |
| `/artist/bookings` | Sophie | Lists editorial (confirmed), history (completed), ready-to-sign (confirmed). |
| `/artist/bookings/[id]` | Sophie | Editorial booking → confirmed; once contract fully-signed, **shoot location is visible**. Total £950. |
| `/artist/bookings/[id]/contract` | Sophie | **ready-to-sign** booking → contract is **pending_signatures**; artist can **sign**. After signing it becomes partially_signed and **location stays locked until caster also signs**. |
| `/artist/bookings/[id]/review` | **Priya** (`artist3`) | **needs-review** booking (completed) → write a review of the caster. Re-visiting after submit shows the existing review (one review per booking per reviewer). |
| `/artist/bookings/[id]/dispute` | **Priya** (`artist3`) | **needs-review** booking (shoot 2d ago) → raise dispute allowed (**within 72h**). On the history booking (45d ago) → **dispute blocked** (window closed). |
| `/artist/disputes/[id]` | **James** (`artist2`) | Disputed booking → dispute detail, both submissions, status **under_review**. |
| `/artist/earnings` | Sophie | Released escrow from history booking shows as paid out (£680 net of 15%). Held escrow (editorial) shows pending. |
| `/artist/earnings` | **Emma** (`artist5`) | Open after loading the **auto-release-due** booking → escrow should lazily **auto-release** (was overdue). |
| `/artist/earnings/payout` | Sophie | Payout setup (Stripe Connect). **Without Stripe keys the Connect onboarding link will not generate** — verify the UI state, not a live redirect. |
| `/artist/profile` | Sophie | Profile view: bio, model stats, skills, portfolio (5 items via picsum), rating 4.8 (12). |
| `/artist/profile/preview` | Sophie | Public-facing preview (what casters see). |
| `/artist/profile/edit` | Sophie | Edit bio/skills/portfolio. Portfolio upload uses R2 — **without R2 keys the presigned PUT fails**; field validation/UI still testable. |
| `/artist/messages` | Sophie | Inbox: unlocked Spring thread with Acme; last message + unread indicator. |
| `/artist/messages/[threadId]` | Sophie | Open Spring thread → 3 messages, the last unread. **Send a message** → appears instantly (WebSocket push; REST fallback if WS down). Open a second browser as `caster1` on the same thread to see live delivery. |
| `/artist/reviews` | Sophie | Reviews received: 5★ from Acme. |
| `/artist/notifications` | Sophie | Shortlist, booking-confirmed (read), invite notifications. Mark-as-read works; Topbar bell count updates. |
| `/artist/settings` | Sophie | Account settings render with current values. |
| `/artist/settings/delete` | **Emma** (`artist5`) | Delete account → **blocked (409)** because Emma has an active/pending-payment booking + (for others) held escrow. Verify the guard message. |

### Artist gating checks

- Log in as **Pending 1 (`pending1`)** → should be routed to `/onboarding/pending`, **not** the dashboard (artist approval required).
- Log in as **Rejected (`rejected1`)** → pending/rejection screen with the **approvalNotes** ("ID blurred…") and a resubmit CTA.
- Log in as **Suspended (`suspended1`)** → routed to `/suspended`; dashboard blocked.
- Log in as **Banned (`banned1`)** → login is refused / routed to `/suspended`.

---

## 5. Caster dashboard

Log in as **Acme (`caster1`)** unless noted. Use **Goldsmith (`caster2`)** for the booking-lifecycle scenarios.

| Route | Account | Do / Expect |
| ----- | ------- | ----------- |
| `/caster/dashboard` | Acme | Stat tiles: live jobs, total bids, active bookings. Action cards surface jobs with new bids. |
| `/caster/jobs` | Acme | Status tabs: active (Spring, audiobook), filled (editorial, ready-to-sign, needs-review), draft (Winter), expired (last-month), closed (history). Counts per tab correct. |
| `/caster/jobs/new` | Acme | 6-step post-job wizard. Walk all steps incl. **fixed vs hourly** + caster-set vs open rate. Cover image upload (R2). Submit → new active job appears in `/caster/jobs`. |
| `/caster/jobs/[id]` | Acme | Spring job detail + bid count. |
| `/caster/jobs/[id]/edit` | Acme | Edit the Spring job; save persists. |
| `/caster/jobs/[id]/bids` | Acme | Spring bids list. **Fixed job → sorted by proposed rate.** Open the audiobook (hourly) job → bids show **hourly rate AND total estimate**, sorted by total. |
| `/caster/jobs/[id]/bids/[bidId]` | Acme | Open Priya's pending Spring bid → **Shortlist** (unlocks messaging) and **Reject** (with reason; 24h undo). Open Sophie's shortlisted bid → **Accept → pay** path. |
| `/caster/talent` | Acme | Talent search: only **approved** artists (Sophie, James, Priya, Marcus, Emma). Suspended/banned/pending/rejected **never appear**. Filters + client sorts work. |
| `/caster/talent/[id]` | Acme | Artist public profile. **Only first name / limited contact** until a booking exists. |
| `/caster/talent/shortlisted` | Acme | Shortlist an artist → appears here. **localStorage only** (no backend table yet). |
| `/caster/bookings` | Goldsmith | Lists: pending-payment (Emma), cancelled (Priya), disputed (James), confirmable (James), auto-release (Emma), flagged (Marcus). |
| `/caster/bookings/[id]` | Goldsmith | **Confirmable** booking (shoot yesterday) → **Confirm completion is UNLOCKED** → confirm, then **Release escrow**. **Editorial** booking via Acme (shoot +10d) → confirm-completion **date-locked / disabled**. |
| `/caster/bookings/[id]/pay` | Goldsmith | **pending-payment** booking (Emma) → Stripe escrow Elements (manual-capture hold). **Without Stripe keys the PaymentIntent will not create** — verify the form renders + error path. Use Stripe test keys + card `4242…` for the full flow. |
| `/caster/bookings/[id]/contract` | Acme | **ready-to-sign** booking → caster can **sign**. After both sign → fully_signed, location revealed to both. |
| `/caster/bookings/[id]/review` | Acme | **needs-review** booking (Priya, completed) → write a review of the artist. |
| `/caster/bookings/[id]/dispute` | Goldsmith | A completed/recent booking within 72h → raise dispute; outside window → blocked. |
| `/caster/disputes/[id]` | Goldsmith | Disputed booking → caster's view of the dispute + their submission. |
| `/caster/bookings/[id]` (cancel) | Goldsmith | On a confirmed upcoming booking → cancel tiers: **<48h before shoot charges 50%** of agreed rate to the cancelling party. Verify the fee preview. |
| `/caster/messages` + `/[threadId]` | Acme | Unlocked Spring thread with Sophie → send/receive, live WS (mirror of the artist test). |
| `/caster/notifications` | Acme | New-bid notification (Priya on Spring). |
| `/caster/settings` | Acme | Company details + logo upload (R2), security, render correct. |
| `/caster/settings/billing` | Acme | Billing/payment history. Invoices are **client-side/degraded** (no downloadable PDF yet). |
| `/caster/settings/notifications` | Acme | Notification prefs — **localStorage only**. |
| `/caster/settings/delete` | Goldsmith | Delete → **blocked (409)** due to active bookings / held escrow. |

---

## 6. Admin dashboard

Log in as **Admin (`admin@castflow.test`)**.

| Route | Do / Expect |
| ----- | ----------- |
| `/admin` | Overview tiles + action-queue cards: pending applications (2), open dispute (1), flagged content. |
| `/admin/applications` | Queue with tabs. **Pending:** Charlie, Olivia. **Rejected:** Liam (with notes). Approved artists not in pending. |
| `/admin/applications/[id]` | Open Charlie → public-style profile preview. **View ID document** → presigned secure read (**requires R2 keys**; without them the URL call errors — verify the gated state). **Approve** → artist becomes approved + can log in to dashboard. **Reject** with notes → folds free-text into the reason. |
| `/admin/users` | All users incl. casters + artists. Filter/find **Daniel (suspended)** and **Grace (banned)**. |
| `/admin/users/[id]` | Open Daniel → **Reactivate** (suspended → active). Open an active artist → **Suspend / Ban**. Strike count shows for Daniel (2) / Grace (3). **Note:** booking/bid/payment history aggregation is degraded (G12) — slim profile only. |
| `/admin/jobs` | All jobs across both casters, all statuses (incl. draft/expired). |
| `/admin/jobs/[id]` | Job detail → **Remove** action (with reason → admin log entry). |
| `/admin/bookings` | All bookings, all statuses. |
| `/admin/bookings/[id]` | Booking detail incl. contract + payment + escrow status. |
| `/admin/payments` | All payments: held (editorial, confirmable, auto-release), released (history, needs-review, flagged), partially_refunded (cancelled), disputed (disputed-job). |
| `/admin/payments/[id]` | Open a **held** payment → **Force-release** and **Refund** (mandatory reason → admin log). Idempotent: releasing an already-released payment returns silently. |
| `/admin/disputes` | Queue: the disputed-job dispute (**under_review**). |
| `/admin/disputes/[id]` | Open it → both submissions visible. **Resolve**: full release to artist / full refund to caster / **split %** / escalate. Resolving updates the payment escrow accordingly + writes an admin log. |
| `/admin/flagged` | **Reviews tab:** Marcus's flagged 2★ review (off-platform contact). **Messages tab:** the flagged message in the Goldsmith↔Marcus thread. |
| `/admin/flagged/[id]` | Flagged item detail. **Note (G9):** clear-flag / remove-review / reporter-identity controls are disabled with notes — moderation is via manual user suspension for now. |
| `/admin/analytics` | Summary tiles render from real totals. **Weekly time-series charts degrade gracefully** if the API doesn't populate the series (G8). |
| `/admin/logs` | Audit log: seeded approval entries (Sophie, James) + any new entries you generated (removals, releases, resolutions, suspensions). |

---

## 7. Cross-cutting business-rule checks

Verify these explicitly — they are the non-negotiable rules from the root `CLAUDE.md`:

1. **Artists must be 18+** — registration blocks under-18 DOB (test on `/register/artist`; Olivia is seeded at exactly 18).
2. **Artist approval required** — pending/rejected/suspended/banned artists cannot reach the artist dashboard (see §4 gating).
3. **One bid per artist per job** — re-bidding the same job is blocked (DB unique constraint).
4. **Messaging only after shortlist** — the audiobook thread with Marcus is **locked** (`unlocked=false`); the Spring thread with Sophie is unlocked. Sending into a locked thread is blocked.
5. **Contact hidden until booking** — caster sees only company name / artist first name in talent search until a booking exists.
6. **Shoot location hidden until contract fully signed** — the **ready-to-sign** booking keeps location locked until both signatures; the **editorial** booking (fully signed) reveals it.
7. **Completion confirm is date-locked** — **confirmable** booking (shoot yesterday) allows confirm; **editorial** (shoot +10d) blocks it.
8. **Dispute window 72h** — **needs-review** (2d ago) allows a dispute; **history** (45d ago) blocks it.
9. **Escrow auto-release at shoot +48h** — the **auto-release-due** booking is overdue; reading its payment should lazily release escrow to the artist.
10. **Cancellation fee <48h** — cancelling within 48h of shoot charges 50% of agreed rate (preview in caster booking cancel).
11. **No off-platform payments** — the flagged review + message both reference off-platform contact; they surface in the admin flagged queue.

---

## 8. Known limitations (won't fully work in this build)

These are documented in `CONTEXT.md` — not bugs in the test:

- **Stripe-dependent**: caster escrow payment (`/caster/bookings/[id]/pay`), artist payout onboarding (`/artist/earnings/payout`). Need real Stripe (Connect) test keys.
- **R2-dependent**: portfolio/ID/logo/cover uploads and the admin ID-document viewer. Need R2 credentials.
- **localStorage only (no backend table yet)**: artist saved jobs, caster talent shortlist, notification prefs. They work in-session but don't persist server-side.
- **Degraded admin surfaces**: user detail aggregation (G12), flagged-content actions (G9), analytics time-series (G8).
- **Email**: verification/notification emails need a Resend key; `DEV_AUTO_VERIFY_EMAIL=true` bypasses verification for login.

---

## 9. Quick smoke test (5 minutes)

1. Seed → start apps → `/login`.
2. **Admin**: `/admin/applications` → approve Charlie.
3. **Caster1 (Acme)**: `/caster/jobs/.../bids` → shortlist Priya on Spring → message her.
4. **Artist1 (Sophie)**: `/artist/bookings/<ready-to-sign>/contract` → sign → confirm location stays locked.
5. **Caster2 (Goldsmith)**: `/caster/bookings/<confirmable>` → confirm completion → release escrow.
6. **Artist3 (Priya)**: `/artist/bookings/<needs-review>/review` → leave a review.
7. **Admin**: `/admin/disputes/<id>` → resolve the open dispute with a split.

If all seven complete without errors, the dashboards + Phase 0 backend are wired end-to-end.
