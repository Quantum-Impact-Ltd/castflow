# CastFlow — Session Handoff (Backend Test Pass)

> Hand this doc to a new Claude Code session. The previous session closed the
> backend to PRD-MVP scope plus two Phase 2 add-ons (counter-offers, comp-cards,
> calendar ICS). Everything implemented; **almost nothing tested**. This handoff
> drives the test-writing pass.

---

## 1. Read these first (in order)

1. `CONTEXT.md` — feature/security/optimization state. Long. Skim the
   "Backend security hardening" → "Phase 2: Calendar ICS export" sections; they
   summarise everything shipped since the original audit.
2. `CLAUDE.md` (repo root) — non-negotiable business rules, role model, two
   payment types.
3. `apps/api/CLAUDE.md` — backend architecture (route→service, error envelope,
   transaction discipline).
4. `apps/api/prisma/CLAUDE.md` — annotated Prisma schema.
5. `packages/CLAUDE.md` — shared types/validators conventions.
6. `docs/PRD.md` — canonical product spec.
7. `docs/features/01-auth.md` — example feature-spec template.

Then read **§3 Current state** below.

---

## 2. Goal

Write integration tests for the backend surface shipped since the original
HANDOFF audit. The 11 existing tests only cover validator schemas + 4
register-* endpoints + auth-redirect helper. Everything else — Connect,
payouts, notifications, PDFs, disputes, invites, admin power tools, etc. —
runs in production-shaped code but has zero automated verification.

Goal of this session: bring the new backend to a "minimally trustworthy"
testing baseline. Not 80% coverage; the right tests on the right flows so a
future change can't silently regress money movement or sensitive-field
gating.

---

## 3. Current state

### What ships green right now

- `bun run typecheck` — 4/4 pass
- `bun run lint` — 4/4 pass
- `bun run format:check` — clean (HANDOFF.md drift is OK to leave)
- `bun run test` — 11/11 pass (only auth/register + validators + redirect)

### Backend feature surface (all implemented, none tested beyond smoke)

Closed since the original audit:

- **Security gaps** (§4.1 high/medium/low — all closed)
  - Rate limiting on auth, register, uploads, bid-submit, message-send
  - Session revocation on admin suspend/ban
  - Upload key-ownership check
  - Stripe idempotency keys
  - Webhook coverage (`payment_intent.canceled` / `charge.refunded` /
    `charge.dispute.created` / `account.updated` /
    `account.application.deauthorized`)
  - Headcount-filled defence in depth
  - Case-insensitive ban check
  - Profile-completeness gating (ID doc + ≥3 photos)
  - `idVerified` flip on approve
  - `talent/:id` explicit `select:` instead of `undefined`-stripping
  - `AuthService` rollback logging
  - 72h contract signing window
  - 14–28d review window
  - Cancellation tier table

- **§4.2 optimizations** (all closed)
  - Missing indexes (Booking, Review, Payment, AdminLog, Dispute)
  - N+1 fixes in BookingService.getById, BidService.listBidsForJob,
    MessageService.listMessages
  - Cursor pagination across all heavy lists
  - `listApplications` `_count` instead of full join
  - Incremental rating cache

- **Stripe Connect + payouts**
  - `ArtistProfile.stripeAccountId` + `payoutsEnabled` columns
  - `PaymentService.createConnectOnboardingLink` / `getConnectStatus`
  - `releaseEscrow` gated on Connect-ready; transfers on release
  - `PAYOUT_NOT_READY` error code

- **Notification + email event wiring** (13 call sites + `notifyAdmins`
  fan-out with 1h dedup)

- **PDF contracts** — `@react-pdf/renderer` v4, fire-and-forget render on
  fully_signed, upload to R2 contracts bucket.

- **Money flows**
  - `PaymentService.partialRelease(bookingId, pct, opts)` — partial capture
    + Connect transfer with `PAYOUT_NOT_READY` fallback
  - `BookingService.cancel` `under_48h` → `partialRelease(50, …)` with
    refund fallback + strike increment
  - `DisputeService.adminResolve` dispatches to release / refund /
    partialRelease per resolution
  - 3-strike admin alert; frivolous-dispute (3rd lost) admin alert

- **Job invites** — `JobInviteService` + `/api/v1/invites/*` routes +
  `invite_only` visibility gate in `BidService.submitBid`.

- **Admin power tools**
  - `POST /api/v1/admin/payments/bookings/:id/release` (force-release)
  - `POST /api/v1/admin/payments/bookings/:id/refund` (force-refund)
  - `POST /api/v1/admin/jobs/:id/remove` (force-remove + cascade refunds)
  - All require admin notes; write `AdminLog` rows.

- **Polish** — bid edit while pending, reject-undo within 24h,
  critical-field-change notifications, artist_approved/rejected
  notifications + welcome email via Better Auth's
  `afterEmailVerification` hook, contact-detail redaction flagging in
  messages.

- **Phase 2** — counter-offers (artist→caster on shortlisted bids),
  comp-cards (`GET /artists/:id/comp-card`), calendar ICS feed
  (`GET /calendar/feed/:token.ics`).

- **Re-audit pass** — invite-detail location leak fixed,
  calendar-feed rate-limited, Connect deauth handled,
  `Dispute(resolution)` index, `notifyAdmins` dedup,
  `job_critical_change` notification type.

### Frontend state

Frontend is on pause. Feature 01 (Auth) is the only complete slice.
Resume after this test pass.

### Environment

`apps/api/.env` is still placeholders for `BETTER_AUTH_SECRET`,
`STRIPE_*`, `R2_*`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`,
`APPLE_CLIENT_ID/SECRET`. Tests must run against placeholders — they
use Bun's mocking story and the `NODE_ENV=test` bypass paths already
embedded in `EmailService` (test inbox), `rateLimit` (no-op), and
notification email dispatch.

### Test infrastructure that already exists

- `apps/api/tests/` — Bun test runner. Existing files:
  `tests/health.test.ts`, `tests/auth/register-artist.test.ts`,
  `tests/auth/register-caster.test.ts`. They import `app` from
  `src/index.ts`, hit it via `app.fetch(new Request(...))`, and assert
  on the response shape.
- `EmailService.__lastEmail(to)` / `__clearTestInbox()` — test inbox for
  email assertions; only active when `NODE_ENV === 'test'`.
- `NODE_ENV=test` is in `env.ts`'s allowed set.
- Tests don't typecheck (run via Bun's transpiler), but lint/format
  apply. Trade-off documented in `CONTEXT.md` test-infrastructure
  caveats.

### Stripe in tests

Stripe is NOT mocked yet. The auth-only test slice avoided it. The
notification side-effects of Stripe-driven flows mean Stripe calls
happen at module load, but they're wrapped behind functions. The first
test that exercises Stripe needs a decision: either

1. Mock the `stripe` import (Bun supports `mock.module`)
2. Run against Stripe test mode with a placeholder secret
3. Inject a fake via a service-level dependency-injection swap

Recommendation: **option 1** for unit/integration tests. The test
inbox + module mock pattern is established in `EmailService`. Stub
`stripe.paymentIntents.create / capture / cancel`,
`stripe.accounts.create / retrieve`, `stripe.accountLinks.create`,
`stripe.transfers.create`, `stripe.webhooks.constructEvent`. Each
returns the minimum shape PaymentService reads.

### R2 / Resend in tests

Same pattern. `EmailService` already test-inboxes. R2 isn't currently
touched by service tests since uploads go through presigned URLs; for
the comp-card / contract PDF flows, mock `r2.send(PutObjectCommand …)`
to no-op.

---

## 4. Test plan — coverage gaps in priority order

### Tier A — money + sensitive-field flows (do first)

These are the flows where a silent regression would be worst.

1. **`PaymentService.releaseEscrow`** —
   - Gating: artist with no Connect / `payoutsEnabled: false` → throws
     `PAYOUT_NOT_READY`, escrow stays `held`.
   - Happy path: artist Connect-ready → capture + transfer, status →
     `released`, `stripeTransferId` set.
   - Idempotency: second call after `released` returns the same row, no
     duplicate Stripe calls.

2. **`PaymentService.partialRelease`** —
   - Bad pct (0, 100, 101) throws `INVALID_STATE`.
   - Gating same as releaseEscrow.
   - Captures `capturePct%` of gross, transfers commission-adjusted net,
     records `cancellationFeeAmount` when `resolution === 'cancellation_fee'`.

3. **`BookingService.cancel`** —
   - Tier resolution: `>7d`, `3–7d`, `<48h` artist cancel; `>48h`,
     `<48h` caster cancel.
   - `under_48h` calls `partialRelease(50)` when Connect-ready.
   - `under_48h` falls back to `refundEscrow` + `cancellationFeeAmount`
     on `PAYOUT_NOT_READY`.
   - Artist `under_48h` increments `strikeCount`.
   - 3rd artist strike fires `notifyAdmins`.

4. **`DisputeService.adminResolve`** dispatch matrix:
   - `full_release_to_artist` → `releaseEscrow`.
   - `full_refund_to_caster` → `refundEscrow`.
   - `split` → `partialRelease(splitArtistPct)`.
   - `escalated` → no money movement.
   - 3rd lifetime loss → admin alert.

5. **Sensitive-field gating**
   - `JobInviteService.getForArtist` → `shootLocationDetail` and
     `callTime` are `null` in the response.
   - `JobService.getPublicDetail` → same fields stripped.
   - `BookingService.getById` → strips `shootLocation` / `callTime`
     unless `contract.status === 'fully_signed'`.
   - `talent/:id` → no `lastName / dob / idDocumentUrl / userId /
     approvalNotes / strikeCount`.

### Tier B — flow correctness

6. **Bid flow** — submit, edit while pending, withdraw, shortlist,
   reject, undo-reject (within 24h, then >24h), accept (creates booking,
   flips status, expires other pending bids on headcount-full).
7. **Counter-offer flow** — propose (shortlisted only, one pending per
   bid), accept (overwrites bid.proposedRate), decline.
8. **Job invite flow** — invite (caster), accept/decline (artist),
   `invite_only` job bid is rejected without an accepted invite.
9. **Contract flow** — generate, sign (artist and caster), 72h window
   rejection after expiry, fully_signed triggers PDF render.
10. **Review flow** — submit accepts inside 14–28d window only,
    one-per-(booking, reviewer) DB unique, ratings cache increments
    incrementally.
11. **Admin power tools** — force-release / force-refund / remove-job +
    AdminLog row written, refunds cascade on remove-job.
12. **Calendar feed** — token gen idempotent, regenerate rotates,
    `/feed/<token>.ics` returns valid ICS, locations hidden pre-signing.
13. **Notification dispatch** — `notifyEvent` writes both in-app row +
    test-inbox email; `notifyAdmins` dedup blocks repeat fires within 1h.

### Tier C — security guards

14. **Rate limits** — already bypassed in tests (`NODE_ENV === 'test'`).
    Verify by directly calling the middleware with a fake context (or
    flip the bypass off in a scoped test). Not high-value; skip unless
    time allows.
15. **Upload key-ownership** — `confirmUpload` rejects when
    `input.key` doesn't start with `${type}/${userId}/`.

### Tier D — webhook reconciliation

16. **Webhook handlers** — feed a signed mock event to
    `/webhooks/stripe`; verify the right service method fires and the
    DB transitions to the expected `escrowStatus` / `Booking.status` /
    `payoutsEnabled`. Cover: `payment_intent.succeeded`,
    `payment_intent.canceled`, `charge.refunded`,
    `charge.dispute.created`, `account.updated`,
    `account.application.deauthorized`.

### Coverage to leave for later

- Property-based / fuzz tests
- Load / perf tests
- Frontend E2E (Playwright is at repo root but unused beyond smoke)

---

## 5. Suggested execution order

1. Stripe mocking helper — `apps/api/tests/helpers/stripe-mock.ts`
   exports a `stubStripe()` that mocks all the methods PaymentService
   touches. Use `bun:test`'s `mock.module('../src/lib/stripe', …)` or
   the equivalent.
2. R2 mocking helper — `apps/api/tests/helpers/r2-mock.ts` no-ops
   `r2.send`.
3. DB cleanup helper — `apps/api/tests/helpers/cleanup.ts` deletes test
   users / artists / casters / bookings / etc. by an `@castflow.test`
   email convention (the existing register-* tests do this; codify it).
4. Tier A tests — 5 service-level test files
   (`payment-release.test.ts`, `payment-partial-release.test.ts`,
   `booking-cancel.test.ts`, `dispute-resolve.test.ts`,
   `sensitive-fields.test.ts`).
5. Tier B tests — 7 more service-level test files.
6. Tier D webhook tests — one file with a signed-event helper.
7. Tier C upload-key test — one file.

---

## 6. House rules for the new session

- **Commit style**: conventional commits. Don't override `git -c
  user.email` — use the local git config (Txbish <kjohny030@gmail.com>).
- **Don't pre-emptively run `bun run dev`** — the user runs the dev
  server themselves.
- **Don't create new markdown docs unless asked.** Update
  `CONTEXT.md` at the end of every session.
- **Read-before-edit hook is strict** — read every file before
  writing or editing it.
- **Test discipline now matters** — this session IS the test pass. New
  tests must be deterministic (no real Stripe / R2 / Resend calls), use
  the test inbox + mocks, and live under `apps/api/tests/`.
- **`bun test` doesn't typecheck** — `bun run typecheck` ignores
  `tests/`. Trade-off is documented; don't try to "fix" it without
  asking.
- **Stripe mocking pattern** — establish it once in `tests/helpers/`
  and import everywhere. Don't sprinkle ad-hoc mocks per file.
- **The Hono context typing pattern** `type AppEnv = { Variables: {
  user: ... } }` is required on every route module that uses
  `c.get('user')`.
- **Update CONTEXT.md at session end** — current state, caveats,
  next-up. Non-negotiable per the root CLAUDE.md.

---

## 7. Quick reference — recent commits

```
3779fbb feat(auth): implement authentication hooks and API integration
64d852c refactor(web): replace axios with native-fetch + TanStack Query architecture
206583a chore: phase 6 verification complete — full stack confirmed working
b7b3f01 docs: mark phase 5 complete in CONTEXT.md
0e18a63 feat: web scaffold — next.js 16, all route stubs, auth guard layouts, providers
21c7af2 feat: prisma schema — all models, enums, indexes, first migration
```

Everything since `3779fbb` is **uncommitted** at the time of writing.
That's a massive diff (the entire post-audit backend pass). The user
hasn't asked for a commit yet — wait for "commit this" before running
`git commit`. If asked to commit, group by logical slice rather than
one giant commit (security sweep, optimizations, Connect, notifications,
PDFs, money flows, invites, admin tools, polish, Phase 2 add-ons,
re-audit) — there's enough natural grouping in `CONTEXT.md` to mirror.

---

_End of handoff. The backbone is built and audited; the tests are
where the next session earns its keep._
