# CastFlow — Session Handoff

> Hand this doc to a new Claude Code session. It captures **where we are, what to
> read first, the current strategy, and the prioritised punch list**. The session
> that produced this audit was running out of context — everything you need to
> continue is in this file.

---

## 1. Read these first (in order)

1. `CONTEXT.md` — phase + feature completion table, caveats, env-var status
2. `CLAUDE.md` (repo root) — non-negotiable business rules, role model, two
   payment types
3. `apps/api/CLAUDE.md` — backend architecture rules (route→service, transaction
   discipline, error envelope, R2 upload pattern, Stripe webhook verification)
4. `apps/api/prisma/CLAUDE.md` — annotated Prisma schema + payment type business
   logic
5. `apps/web/CLAUDE.md` — frontend architecture (Component → hook → service →
   fetcher), query-key conventions, sensitive-data display rules
6. `packages/CLAUDE.md` — shared types/validators conventions
7. `docs/PRD.md` — the canonical product spec (940 lines, MVP scope)
8. `docs/features/01-auth.md` — example feature-spec template

Then read **§3 Current state** of this file before doing anything.

---

## 2. Goal

Ship the CastFlow MVP — a UK-based casting marketplace where casters post
shoots, artists bid, and the platform handles booking, escrow, contracts, and
reviews end to end. Tech stack: Next.js 16 web + Bun/Hono API + Postgres/Prisma
+ Stripe + Cloudflare R2 + Better Auth + Resend.

---

## 3. Current state

### Strategy in flight

The user changed direction mid-session. **Current strategy is BACKEND-FIRST**:

> "from now on dont build the frontend pages we need to do the backend first
> completely after we have done backend well verify with tests then start
> building and connecting with frontend"

And on testing:

> "skip detailed testing for now just have really basic tests from now on, well
> add tests after everythings done and refine"

So the order is:

1. ✅ Foundation + Phases 1–6 done
2. ✅ Feature 01 (Auth) done end-to-end with baseline tests
3. ✅ Backend slice of features 02–15 done (typecheck/lint/format green, 11 tests
   pass) — see §4 for exact coverage
4. **YOU ARE HERE** — close the highest-impact backend gaps from the audit (§6),
   then add tests, then return to frontend
5. Resume frontend page-by-page once backend is sturdier

### What ships green right now

- `bun run typecheck` — all 4 packages pass
- `bun run lint` — all 4 packages pass
- `bun run format:check` — clean
- `bun run test` — 11/11 pass (13 validator + 11 API integration + 16 web unit
  spread across packages; only `register-*` API tests + redirect-helper + auth
  service tests are wired)

### Feature completion (backend)

| #   | Feature                          | Backend status |
| --- | -------------------------------- | -------------- |
| 01  | Auth (register/login/verify/reset/Google) | ✅ complete (frontend also done) |
| 02  | Artist onboarding                | ✅ service + routes; gating partial (see audit) |
| 03  | Admin: application queue         | ✅ approve/reject + list |
| 04  | Caster: post a job               | ✅ create/update/cancel/list-mine |
| 05  | Artist: job feed                 | ✅ folded into JobService.listPublic/getPublicDetail |
| 06  | Submit a bid                     | ✅ submit/withdraw/list-mine |
| 07  | Caster bid management            | ✅ shortlist/reject/accept (creates booking + unlocks thread) |
| 08  | Booking + Stripe escrow          | ⚠️ caster-side intent + held escrow OK; **no Stripe Connect payout** |
| 09  | Contracts                        | ⚠️ generate + dual-sign OK; **PDF render missing, 72h window not enforced** |
| 10  | Completion + escrow release      | ✅ confirmCompletion + lazy auto-release at shoot+48h |
| 11  | Reviews                          | ✅ submit + rating cache refresh; 14–28 day window not enforced |
| 12  | Disputes                         | ⚠️ raise/evidence/admin-resolve works; **resolution does not move money** |
| 13  | Messaging                        | ✅ REST only — WS broker still placeholder |
| 14  | Notifications                    | ⚠️ primitives done; **event triggers not wired into flows** |
| 15  | Admin dashboard                  | ⚠️ lists + user-status flips; **no force-release, no refund, no remove-job** |
| —   | Uploads (R2)                     | ✅ presigned URL + confirm; see §6 high-priority for security gap |
| —   | Talent search                    | ✅ public-ish list + caster-auth detail (public artist-detail endpoint missing) |
| —   | Caster profile                   | ✅ GET/PATCH /me |

### Frontend completion

- ✅ Feature 01 (Auth) — full pages: register chooser, register/artist,
  register/caster, login w/ Google, verify-email + [token], forgot-password,
  reset-password/[token], onboarding/pending
- ⚠️ Feature 02 (Onboarding) partial: layout stepper + `/onboarding/personal`
  page work end-to-end; stats/experience/portfolio/verification/review pages
  are still TODO stubs. The `lib/api/artists.ts` service + `lib/hooks/use-artist.ts`
  layer is built and ready.
- ❌ Features 03–15 frontend — not started

### Tech caveats not in CONTEXT.md

- **Better Auth + `requireEmailVerification: true` triggers account-enumeration
  protection** — `auth.api.signUpEmail` returns a fake "success" for duplicate
  emails. `AuthService.assertEmailAvailable` pre-checks in Postgres, and
  `signUp` post-checks the user row actually exists. Don't remove either.
- **ArtistProfile fields `dob/gender/city/experienceLevel/idDocumentUrl` are
  nullable** so a "shell" profile is created at registration with only
  firstName/lastName/artistType. Onboarding fills the rest. Talent search must
  filter on `approvalStatus = 'approved'` to avoid surfacing un-onboarded
  artists (already in place).
- **Hono context typing** — every route module declares
  `type AppEnv = { Variables: { user: { id: string; role: string } } }` and
  passes it to `new Hono<AppEnv>()`. Without this, `c.get('user')` errors.
- **Zod + RHF + `exactOptionalPropertyTypes: true`** — common pain point.
  `parseBody` helper in route files uses
  `// eslint-disable-next-line @typescript-eslint/no-unsafe-return` on the
  return statement; leave it. Frontend forms work around the inferred-input
  type drift in actor stats — keep the workaround pattern simple, hardcode the
  generics or split into two narrowly-typed forms.
- **Prisma `physicalRequirements` JSON field** needs cast to
  `Prisma.InputJsonValue` to satisfy `exactOptionalPropertyTypes`.
- **`packages/validators` has `*.test.ts` excluded from tsconfig + lint** via a
  `--ignore-pattern '*.test.ts'` flag — bun test files run via the runtime, not
  through `tsc`.

### Environment status

`apps/api/.env` has placeholder values for all the secret-bearing vars
(BETTER_AUTH_SECRET, STRIPE_*, R2_*, RESEND_API_KEY). Real values are needed
before exercising those features. Database is on alwaysdata managed Postgres
via `prisma db push` (no migrations folder yet — see CONTEXT.md caveats).

---

## 4. Full backend audit (the reason this handoff exists)

The audit below was produced fresh against `docs/PRD.md` and the live code.
Treat it as the source of truth for the gaps and prioritisation.

### 4.1 Security gaps

#### High priority

**No rate limiting anywhere.** `/auth/sign-in/email`, `/auth/register-*`,
`/auth/forget-password`, `/uploads/presigned-url`, `/bids/jobs/:id`,
`/messages/threads/:id` are all unprotected. Brute-force on login, email
enumeration via timing on the register pre-check, and presigned-URL spam are
all open. Add a `hono` rate-limit middleware — keyed on IP for unauthenticated
routes and on `user.id` for authenticated ones.

**Suspended/banned users keep their session.**
`adminUserRoutes.post('/:id/status', ...)` flips `user.status` to
`suspended`/`banned` in Postgres but doesn't invalidate Better Auth sessions.
The user keeps full access until the cookie expires (7 days). `authenticate`
middleware already blocks `status === 'suspended'`, so suspended *requests*
fail, but the session token is still valid for read endpoints that bypass
middleware (none right now, but easy regression). Call
`auth.api.revokeUserSessions({ userId })` inside the same transaction.

**`UploadService.confirmUpload` trusts the client URL.** It accepts any `url`
+ `key` and writes them into `ArtistProfile.idDocumentUrl` or creates a
`PortfolioItem`. A malicious client can substitute another artist's URL or any
external URL into their portfolio. **Fix**: validate `input.key` starts with
`${input.type}/${userId}/` before persisting; reject otherwise.

**Portfolio items default `isApproved: true`** in `UploadService.confirmUpload`.
Any image goes live without admin review. Default to `false` for new artists
pre-approval, or gate by admin moderation.

**`createEscrowIntent` lacks Stripe idempotency keys.** A client retry creates
a duplicate PaymentIntent and overwrites the previous `stripePaymentIntentId`
on the `Payment` row — orphan auth holds in Stripe. Pass
`{ idempotencyKey: \`booking-${bookingId}\` }` as the second arg to
`stripe.paymentIntents.create`.

**Webhook handler only listens for `payment_intent.succeeded`,
`amount_capturable_updated`, `payment_failed`.** Missing: `charge.refunded`,
`payment_intent.canceled`, `charge.dispute.created`. If Stripe processes a
refund or dispute through their dashboard, our DB never reconciles.

**Public job listing exposes filled jobs.** `JobService.listPublic` filters on
`status: 'active'` and `applicationDeadline > now` but **not** on
`headcountFilled < headcountRequired`. Multi-headcount jobs that are partially
filled stay visible (probably desired) but single-headcount jobs rely on the
status flip in `acceptBid`. Add the explicit headcount filter for safety.

**Banned-email re-register check uses
`prisma.user.findFirst({ where: { email, status: 'banned' } })`.** Case
sensitivity: Better Auth normalizes to lowercase, but if anyone seeds a User
row directly with mixed-case email, the check misses. Use
`email: { equals: email, mode: 'insensitive' }`.

#### Medium priority

**Profile-completeness check before submit is permissive.**
`ArtistService.submitForReview` requires
`dob/gender/city/experienceLevel/{model|actor}Stats` but **not**
`idDocumentUrl` (PRD §8.1 step 5: ID required) and **not** portfolio items
(PRD §8.1 step 4: minimum 3 photos with specific shot types). Artists can
submit a half-empty profile.

**Admin `approveApplication` doesn't set `idVerified: true`** even though
that's the whole point of the verification step. The "Verified" badge feature
(PRD §13.1) is dead.

**`talent/:id` strips fields via `undefined`** which works for JSON.stringify
but is fragile — switch to explicit `select:` clauses on the Prisma query so
sensitive fields never leave the DB.

**Service errors from `prisma.user.findFirst` are silently caught** in
`AuthService.signUp` rollback — `.catch(() => undefined)` on the user delete.
Failed rollback orphans the Better-Auth user. Log + alert instead of
swallowing.

**MessageService doesn't enforce contact-detail redaction** (PRD §10.10).
Users can paste phone numbers or emails freely. Out of MVP scope per PRD's
"repeat offenders are suspended" workflow, but worth a future regex flag.

**Dispute resolution does not move money.** `DisputeService.adminResolve`
writes the resolution + admin log but never calls
`PaymentService.releaseEscrow`/`refundEscrow`/split. The code has a
self-acknowledging comment. As soon as the first dispute lands, admin has to
settle off-Stripe manually.

**No CSRF protection visible.** Better Auth's default cookies are
`SameSite: Lax` which protects most flows, but state-changing custom endpoints
(`/api/v1/...`) rely solely on the cookie. Acceptable today; revisit when
adding payment-state endpoints accessible from a third-party iframe.

#### Low priority

**`AppError` re-throws inside `prisma.$transaction`** rollback flows — fine,
but the error message can leak Prisma internals via `INTERNAL_ERROR` fallback
in `index.ts`. Already returns a generic message — good.

**Booking cancellation logic only honours the 48h cutoff.** PRD §10.6 has a
finer table: artist 7+/3–7/under-48 days, caster 48h+/under-48. Currently any
cancel >48h → full refund, any <48h → 50% fee (recorded only, not captured).
Strike system + warning tiers absent.

**`/contracts/bookings/:bookingId` doesn't enforce the 72h signing window**
(PRD §10.7). Contracts can stay unsigned indefinitely.

**Review submission has no 14–28 day window** (PRD §10.9). Currently any time
after `status === 'completed'`.

### 4.2 Optimization opportunities

**Missing DB indexes** that several queries scan today:

- `Booking(artistId)` and `Booking(casterId)` — `getMyBookings`, admin filters,
  dispute joins. Add `@@index([artistId])`, `@@index([casterId])`.
- `Booking(status)` — admin filters by it. Add `@@index([status])`.
- `Review(revieweeId)` — `refreshRatingCache` aggregates by this on every
  review submission. Add `@@index([revieweeId])`.
- `Payment(escrowStatus)` — admin filter. Add `@@index([escrowStatus])`.
- `AdminLog(adminId)`, `AdminLog(entityType, entityId)` — log lookups.

**N+1 / double-fetch**:

- `BookingService.getById` calls `loadBookingForUser` twice (once before
  `maybeAutoRelease`, once after). Refactor: only re-fetch if
  `maybeAutoRelease` actually mutated. Or have it return the updated booking.
- `BidService.listBidsForJob` does `findUnique(job)` to authz + a second
  `findMany(bids)`. Combine via
  `prisma.job.findFirst({ where: { id, casterId }, include: { bids: ... } })`
  — one round-trip and the where-clause is the authz.
- `MessageService.listMessages` calls `loadThreadForUser` (1 query) then
  `findMany` (2nd). Same pattern — combine.

**No pagination on heavy list endpoints**:

- `BidService.listMyBids`, `BookingService.getMyBookings`,
  `JobService.listMyJobs`, all admin lists, `MessageService.listMessages` —
  all return up to `take: 100` or unbounded. A power caster with thousands of
  bids will OOM the response. Apply cursor pagination uniformly (the
  `listApplications`/`listPublic`/`talent/list` pattern is already correct —
  port it).

**Stripe idempotency** (already mentioned above): not optimization per se, but
it cuts the Stripe round-trip in half on retries.

**Public job search uses `ILIKE`** (`contains: ..., mode: 'insensitive'`).
Fine for <10K rows, scans after that. For production add `pg_trgm` GIN index
on `Job.title`, `Job.description`. Out of MVP scope.

**Profile `findUnique({ where: { userId } })` happens in nearly every
authenticated route.** It's already indexed (unique). But you could attach
`profileId` to the session via Better Auth's `additionalFields` (the field
exists already — just isn't populated post-registration). One less round-trip
per request.

**`ArtistService.listApplications` includes `portfolioItems` for every row in
a paginated list** — page of 25 → 25× extra joins. Project to a count instead
and load on detail open.

**`MessageService.listInbox` joins `messages: { take: 1, orderBy: 'desc' }`
per thread**, which is a correlated subquery per row. OK for small inboxes;
for big ones cache `lastMessagePreview` on the thread row (column already
exists for `lastMessageAt`, add `lastMessageContent`).

**`refreshRatingCache` re-aggregates the entire reviews list on every new
review.** Acceptable for low-volume; for high-volume use an incremental
update: `ratingAvg = (oldAvg × oldCount + newRating) / (oldCount + 1)`.

### 4.3 MVP coverage vs PRD

Backend completeness against PRD §5 "must have":

| PRD area | Status | Notes |
|---|---|---|
| Artist onboarding (model + actor) | ✅ backend | Submit gating partial — missing portfolio-min-3 + ID-doc-required checks |
| Admin approval | ✅ | Missing `idVerified` flip on approve (PRD §13.1) |
| Caster registration (instant) | ✅ | |
| Job posting (6-step wizard) | ✅ backend | Wizard is a frontend concern |
| Public job feed + filters | ✅ | |
| Artist bidding | ✅ | Bid-edit-while-pending missing; reject-undo-within-24h missing |
| Bid management | ✅ | |
| Talent search | ✅ | Public artist-detail endpoint (`/artists/[id]` page-facing) not yet exposed by API — only caster-auth'd `/talent/:id` |
| Direct invite | ⚠️ partial | `JobInvite` model exists, schema-wired, **no service/route** |
| Messaging unlocked on shortlist | ✅ | REST only — WS broker is placeholder |
| Booking confirmation | ✅ | |
| Contract gen + e-sign | ⚠️ partial | Generate + dual-sign works; **PDF render missing** (`Contract.pdfUrl` never set), 72h signing window not enforced |
| Escrow via Stripe | ⚠️ partial | Caster-side payment held works. **Artist payout via Stripe Connect missing entirely** — no connected accounts, no `Transfer` creation, no payout. Money sits in platform Stripe forever. |
| Completion + payout | ⚠️ partial | Confirm-completion captures the PaymentIntent. The artist-payout step is the gap above. |
| Cancellation + penalty | ⚠️ partial | Only the under-48h cutoff is coded; PRD §10.6's finer tiers and strike system absent. Cancellation fee is **recorded as DB field, not actually captured/transferred via Stripe** (PRD §11.4). |
| Dispute resolution | ⚠️ partial | Raise/evidence/admin-resolve flow works. **Resolution doesn't move money** — admin marks outcome but escrow stays frozen until manual intervention. |
| Reviews (both directions) | ✅ | Window (14–28 day) not enforced; flagging endpoint missing |
| Email notifications | ⚠️ partial | `EmailService` methods exist but **only Better Auth callbacks call them**. Event triggers (bid-shortlisted-email, booking-confirmed-email, etc.) not wired. |
| Artist profile + portfolio | ✅ | Public artist detail endpoint missing (caster-side only) |
| Caster profile | ✅ | |
| Admin dashboard | ⚠️ partial | Lists + queue actions work. **Missing**: admin force-release escrow, admin issue refund, admin remove job (PRD §6.4–6.5). |

### 4.4 Features deferred / not yet built

Things the backend has no code for, in PRD-listed-as-MVP scope:

1. **Stripe Connect artist payouts** — biggest functional gap. Without this,
   money goes into platform Stripe but never reaches the artist's bank. Need:
   artist onboarding to Stripe Connect (Express accounts), `stripeAccountId`
   on `ArtistProfile`, `stripe.transfers.create` after capture, payout-history
   endpoints, "connect bank" UI flow.
2. **PDF contract generation** — `@react-pdf/renderer` is installed, never
   invoked. Need: render React PDF template after `fully_signed`, upload to R2
   contracts bucket, set `Contract.pdfUrl`.
3. **Notification event wiring** — `NotificationService.create` exists but no
   caller. Needs ~15 call sites (bid received, shortlisted, accepted, contract
   ready, contract signed, payment held, payment released, message received,
   dispute opened/resolved, review received, booking cancelled).
4. **Email notification triggers** — same shape: 7+ email types defined in PRD
   §14 not yet fired.
5. **Daily-digest matching-job notifications** (PRD §14 artist): needs a cron
   and a matching-criteria query. Probably keep lazy/manual for MVP.
6. **Job invites** — `JobInvite` model + `InviteStatus` enum sit unused.
   Caster-search → invite-artist flow has no API.
7. **Cancellation fee Stripe split** — currently a DB field. Needs partial
   capture or refund-with-application-fee at Stripe.
8. **Dispute payout movement** — admin resolution doesn't release/refund/split.
   The whole point of escrow is to move under admin instruction.
9. **Strike system + 3-strikes-admin-review** (PRD §10.6, §13.4) —
   `strikeCount` field exists, never incremented.
10. **Bid edit while pending** + **reject-undo within 24h** (PRD §10.5).
11. **Critical-field-change bidder notifications** (PRD §10.3) — caster edits
    shoot date → all bidders should be told.
12. **Job auto-expiry reminders** (PRD §10.4) — 14-day no-activity email.
    Auto-close on deadline works lazily on read.
13. **Frivolous-dispute auto-alert** (PRD §13.5) — 3 lost disputes → admin
    pinged. Not tracked.
14. **Admin force-release/refund + remove-job** (PRD §6.4–6.5).
15. **Session revocation on admin suspend/ban** — explained above in security.
16. **Contact-detail redaction in messages** (PRD §10.10) — phone/email
    pattern detection.
17. **72-hour contract signing window** (PRD §10.7).
18. **Review 14–28 day window** (PRD §10.9).
19. **Cancellation strike-on-late-cancel** + **3-strike review** (PRD §10.6,
    §13.4).
20. **`idVerified` flip on admin approve** — for the "Verified" badge (PRD
    §13.1).

PRD-explicit Phase-2 (do **not** build these): calendar sync, mobile app,
comp-card auto-generator, multi-seat caster teams, background-check
integration, portfolio watermarking, subscription tiers, AI matching,
counter-offer on bids, DocuSign integration, Onfido ID verification.

---

## 5. Recommended order of work (start here)

This was the priority list agreed at the end of last session:

1. **Rate limiting + suspend-invalidates-session + upload key-ownership
   check** — three small fixes, big security wins. Do all three in one
   sitting.
2. **Stripe Connect + artist payout** — biggest functional gap; without it
   the platform can't actually pay artists.
3. **Notification event wiring** — pure plumbing, no design decisions, but
   unlocks the UX. Touch every flow that should fire a notification and call
   `NotificationService.create` + the appropriate `EmailService` method.
4. **PDF contract generation** — required for the legal flow. Render React
   PDF on `fully_signed`, upload to R2 contracts bucket, save `pdfUrl`.
5. **Dispute payout movement** + **cancellation fee Stripe split** —
   finishes the money story.
6. **Profile-completion gating** (portfolio min 3 + ID required) +
   **idVerified flip on approve** — closes the artist-onboarding trust loop.
7. Everything else (job invites, strikes, edit-while-pending, redaction,
   windows) is polish on top of a working pipeline.

After this list — or any natural breakpoint inside it — **add basic
integration tests** for the routes/services you touched. Then return to
frontend pages (the user wants backend solid before resuming UI).

---

## 6. House rules for the new session

- **Commit style**: conventional commits (feat / fix / refactor / docs /
  chore). The user's local git config is the source of truth — never override
  with `-c user.email`. (See `~/.claude-arqam/projects/-home-tabish-Desktop-castflow/memory/feedback_git_author.md`.)
- **Don't pre-emptively run `bun run dev`** — the user runs the dev server
  themselves.
- **Don't create new markdown docs unless asked.** The user already had to
  ask for this handoff.
- **Read-before-edit hook is strict** — read every file before writing or
  editing it, even after a `Write`. Bun-runtime tests sometimes modify files
  via prettier; re-read after `bun run format` etc.
- **Test discipline relaxed for now** — only smoke tests per feature until the
  backend is closed out. Detailed test suites come after frontend resumes.
- **Frontend on pause** — finish the backend punch list before resuming
  `/onboarding/*` pages and beyond.
- **Update CONTEXT.md at session end** — current state, caveats, next-up. This
  is non-negotiable per the root `CLAUDE.md`.
- When a `bun run typecheck` / `lint` / `format` fails, fix it before moving on
  — don't accumulate failures.
- The Hono context typing pattern `type AppEnv = { Variables: { user: ... } }`
  is required on every route module that uses `c.get('user')`.

---

## 7. Quick reference — recent commits

```
64d852c refactor(web): replace axios with native-fetch + TanStack Query architecture
206583a chore: phase 6 verification complete — full stack confirmed working
b7b3f01 docs: mark phase 5 complete in CONTEXT.md
0e18a63 feat: web scaffold — next.js 16, all route stubs, auth guard layouts, providers
21c7af2 feat: prisma schema — all models, enums, indexes, first migration
```

Everything done in this handoff session is **uncommitted** at the time of
writing. The user has not asked for commits — wait for an explicit "commit
this" before running `git commit`.

---

_End of handoff. Good luck — the backbone is solid; the gaps above are the
finish line._
