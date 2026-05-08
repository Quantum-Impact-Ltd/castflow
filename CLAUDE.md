# CastFlow — Claude Code Instructions (Root)

## Step 1 — Read these files before doing anything

Every Claude Code session must start by reading files in this order:

### 1. CONTEXT.md (this directory)

```
CONTEXT.md
```

Tells you what phase the project is in, what has been completed, what is next,
and any caveats from prior sessions. If it does not exist, this is a fresh repo.

### 2. The CLAUDE.md for the area you are working in

If you are working on the **API** (`apps/api/`), read:

```
apps/api/CLAUDE.md
```

Covers: Hono app structure, route→service pattern, middleware usage, R2 upload
patterns, Stripe webhook verification, transaction rules, error handling, and
the full endpoint list.

If you are working on the **frontend** (`apps/web/`), read:

```
apps/web/CLAUDE.md
```

Covers: App Router conventions, server vs client component rules, auth guard
layouts, data fetching patterns, form patterns, file upload flow, real-time
messaging, query key conventions, and sensitive data display rules.

If you are working on **shared packages** (`packages/`), read:

```
packages/CLAUDE.md
```

Covers: what lives in `@castflow/types` vs `@castflow/validators`, all enum
definitions, the key entity interfaces, and the Zod schema conventions including
the fixed/hourly payment type logic.

If you are touching the **database schema or writing service logic**, also read:

```
apps/api/prisma/CLAUDE.md
```

Contains the full annotated Prisma schema with every model, field, index, and
constraint. Also documents the payment type business logic (fixed vs hourly)
and how it flows through Job → Bid → Booking → Contract → Payment.

### 3. Continue with your task

Do not start writing code until you have read the relevant files above.
If you are unsure which files apply, read all of them. It takes 30 seconds
and prevents hours of architectural drift.

---

## What this project is

CastFlow is a UK-based casting marketplace. Casters (brands/agencies) post shoot
jobs. Artists (models/actors) bid on them. The platform handles booking, contracts,
escrow payments, and reviews end to end.

## Monorepo structure

```
castflow/
├── CLAUDE.md                  ← You are here. Root rules + file map.
├── CONTEXT.md                 ← Current implementation state. Read first.
├── apps/
│   ├── api/
│   │   ├── CLAUDE.md          ← Backend rules. Read when working on API.
│   │   ├── prisma/
│   │   │   └── CLAUDE.md      ← Full Prisma schema. Read when touching DB or services.
│   │   └── src/
│   └── web/
│       ├── CLAUDE.md          ← Frontend rules. Read when working on UI.
│       └── app/
├── packages/
│   ├── CLAUDE.md              ← Shared packages guide. Read when touching types/validators.
│   ├── types/                 ← @castflow/types
│   └── validators/            ← @castflow/validators
└── docs/
    └── PRD.md                 ← Full product requirements. Read when unsure about features.
```

---

## Three user roles

- **admin** — internal operator. Full access. Approves artists, resolves disputes.
- **caster** — posts jobs, searches talent, books artists. Instant access after email verify.
- **artist** — model or actor. Must be 18+. Must be approved by admin before platform access.

---

## Non-negotiable business rules

These apply everywhere. If any code you write would violate one of these, stop and re-read.

- Artists must be 18+ — hard block on DOB check. No exceptions. Ever.
- Artist approval required — artists cannot use any feature until admin approves their profile.
- One bid per artist per job — enforced with a unique constraint at DB level.
- Messaging only unlocks when shortlisted — `MessageThread.unlocked` must be `true` before messages can be sent.
- Contact details hidden until booking confirmed — caster sees only company name, artist sees only first name until a booking exists.
- Shoot location hidden until contract fully signed — `shootLocationDetail` is never returned until `contract.status === 'fully_signed'`.
- Completion confirm is date-locked — caster cannot confirm shoot completion before `booking.shootDate` has passed. Hard lock.
- Dispute window is 72 hours — disputes can only be raised within 72 hours of `booking.shootDate`.
- Escrow auto-release at shootDate + 48hrs — if caster has not confirmed, release automatically (lazy evaluation).
- No off-platform payments — ToS violation. Both accounts reviewed if reported.
- Cancellation fees under 48hrs — cancelling party pays 50% of agreed rate to the other party.

---

## Two job payment types

This is a core concept. Get it right.

```
fixed  → flat fee for the whole shoot
         rateAmount = total flat fee (e.g. £500)
         totalAmount on Booking = agreedRate (the flat fee)
         Contract shows: "Fee: £500 flat rate"

hourly → per-hour rate, billed by hours worked
         rateAmount = hourly rate (e.g. £85/hr)
         estimatedHours on Bid = hours artist estimates
         agreedHours on Booking = locked agreed hours
         totalAmount on Booking = agreedRate × agreedHours
         Contract shows: "Rate: £85/hr × 8 hours = £680"
```

In both types, `rateSetBy` controls whether the caster sets the rate or leaves
it open for artists to propose in their bid.

See `packages/CLAUDE.md` for the full type definitions.
See `apps/api/prisma/CLAUDE.md` for the DB field annotations.

---

## Tech stack

- **Frontend:** Next.js 16 (App Router), deployed on Vercel
- **Backend:** Bun + Hono, deployed on Railway
- **Auth:** Better Auth (email/password + Google + Apple)
- **Database:** PostgreSQL + Prisma
- **Storage:** Cloudflare R2
- **Payments:** Stripe + Stripe Connect
- **Email:** Resend (inline for MVP, no queue)
- **Real-time:** Hono native WebSockets (`createBunWebSocket`)
- **Monorepo:** Turborepo + Bun workspaces

---

## Universal architecture rules

These apply regardless of which file you are working in.

- Route handlers do HTTP only. All business logic lives in services.
- Every operation touching more than one table uses a `prisma.$transaction()`.
- Every endpoint validates input with a Zod schema from `@castflow/validators` before any service call.
- All types imported from `@castflow/types`. All schemas from `@castflow/validators`. Never duplicated in app code.
- No background jobs for MVP — use lazy evaluation (check conditions at query time).
- All API responses use the consistent shape: `{ success: true, data: T }` or `{ success: false, error: { code, message } }`.

---

## After completing any task

Always update `CONTEXT.md`:

- Mark completed items
- Note any deviations from the plan and why
- Note any bugs found and how they were resolved
- Note any decisions made (e.g. "deferred X", "used Y instead of Z")
- Update the "Next up" section
- If you installed a package, note the version under "Package versions pinned"

This is not optional. The next session depends on it.
