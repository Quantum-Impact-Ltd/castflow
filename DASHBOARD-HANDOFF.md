# CastFlow Dashboard Rebuild — Session Handoff

> Pick-up doc for the next session. Read this, then `CONTEXT.md` (top section)
> and `DASHBOARD_PLAN.md` (§5 gaps, §9 admin, §11 build order). Both are current.

## TL;DR — where things stand

All three role dashboards are **built end-to-end and green**:

| Area | State |
| --- | --- |
| Artist dashboard | 25 pages ✅ |
| Caster dashboard | 24 pages ✅ |
| Admin dashboard | 17 pages ✅ |
| Shared primitives | `components/dashboard/*` (shell, nav, states, status-badge, money, locked-field, stars, remote-image, job-card, talent-card, invite-to-job-dialog, message-inbox/thread, notification-list, calendar-feed-card, job-wizard, forbidden-403, availability-toggle) ✅ |
| RBAC | `apps/web/middleware.ts` (cookie gate) + 3 server layouts (role check → real 403) ✅ |
| Phase 0 backend | WebSocket broadcast + 6 REST endpoints ✅ (no schema change, no `db push`) |
| G7 public artist profile | `/artists/[id]` + `/artists` preview on REAL data ✅ |
| G7 public marketing pages | `/talent`, `/shoots`, `/shoots/[id]` on REAL data w/ **mock fallback** ✅ |
| Job cover images | `Job.coverImageUrl` end-to-end + wizard upload ✅ (needs `prisma db push`) |

**Everything typechecks + lints clean** (web, api, validators). The data layer
(`lib/api/*`, `lib/hooks/*`) is comprehensive — extend it, don't replace it.

## How to verify (run after any change)

```bash
cd apps/web && bunx tsc --noEmit          # web typecheck
cd apps/api && bunx tsc --noEmit          # api typecheck
cd apps/web && bunx eslint "app/**/*.tsx" "components/**/*.tsx"
cd /…/castflow && bunx prettier --write <changed files>
```

⚠ There is **no live DB / running API in this environment.** You can `bunx prisma
generate` (offline, from schema) but **cannot `prisma db push` or runtime-verify**.
A full `next build` was not run (it needs the API up). Verification = typecheck +
lint + prettier.

## Remaining work — priority order

### 1. ✅ DONE (2026-05-27) — G7 public marketing pages on real data
`/talent`, `/shoots`, `/shoots/[id]` now consume the live API
(`useTalentSearch` / `usePublicJobs` / `useJob`). **`lib/mock` is KEPT as a
fallback** (per user direction — reverses the original "delete mock" plan): the
pages fetch live first and fall back to mock only when the backend returns
empty. `lib/mock/shoots.ts` reshaped → `MOCK_SHOOTS` is real `Job[]`. Detail
enrichment (caster stats / wardrobe / perks / cancellation / similar) is
mock-only; real jobs hide those. Job cover images added end-to-end
(`Job.coverImageUrl` + `job_cover` upload + wizard control); ⚠ run
`bunx prisma db push` on deploy. Do NOT delete `lib/mock`. See CONTEXT.md
"G7 — public marketing pages" for the full diff.

### 2. Schema-backed persistence (needs `prisma generate` + later `db push`)
Frontend uses localStorage hooks today (swap-ready). Add backend tables + repoint:
- `SavedJob (artistId, jobId @@unique)` → `use-saved-jobs.ts`
- `TalentShortlist (casterId, artistId @@unique)` → `use-talent-shortlist.ts`
- `User.notificationPrefs Json?` → `use-notification-prefs.ts`
- `ContentReport` (entityType/entityId/reportedById/reason/detail/status) → makes
  thread reports queryable (currently just an admin notification).
- Edit `apps/api/prisma/schema.prisma`, run `bunx prisma generate` (so `prisma.X`
  typechecks), add routes/services, repoint the hooks from localStorage → API.
  Document that `bunx prisma db push` is needed on deploy.

### 3. Admin endpoints the UI degrades on (G8/G9/G12)
- **G8** analytics time-series: `/admin/analytics/summary` returns totals only;
  the weekly-series charts in `app/(admin)/admin/analytics/page.tsx` render only
  if populated. Add the series to `routes/admin/analytics.ts`.
- **G9** flagged content: add clear-flag / remove-review / reporter identity /
  flagged jobs+profiles. UI buttons are disabled with notes in
  `app/(admin)/admin/flagged/*`.
- **G12** admin user detail: `GET /admin/users/:id` returns user + slim profile
  only. Add booking/bid history, `strikeCount`, payment + login history (e.g.
  `?userId=` on `/admin/bookings`, expose `strikeCount`). UI shows honest
  "requires endpoint" notes in `user-detail-client.tsx`.

### 4. Hardening
- **Account deletion** (`ArtistService.deleteAccount` + caster inline) hard-delete
  will FK-fail for users with *historical* bookings — implement soft-delete/
  anonymise. Guards for active bookings/escrow already block the common case.
- **WebSocket prod**: cross-domain cookies on the WS handshake need
  `SameSite=None; Secure`. Registry is in-memory (single instance) — needs Redis
  pub/sub for >1 replica.
- Then a full `next build` + Playwright E2E with the API + DB running.

## Conventions the next agent MUST follow (don't relearn the hard way)

- **Patterns:** dynamic `[id]` routes = thin server `page.tsx` (`await params`) →
  `*-client.tsx` (`'use client'`). Static routes = single `'use client'`
  `page.tsx`. Every page: loading + empty + error states via
  `components/dashboard/states`.
- **Data:** Component → `lib/hooks/use-*` → `lib/api/*` → `lib/fetcher`. Query
  keys only from `lib/query-keys.ts`. Never call `fetcher` from a component.
- **Zod + RHF:** schemas with `.default()`+`.refine()` (e.g. `createJobSchema`,
  `actorStatsSchema`) need `resolver: zodResolver(s) as Resolver<T>`.
- **Business rules (enforced server-side, mirrored in UI):** no bid counts to
  artists; shoot location `LockedField` until `contract.status==='fully_signed'`;
  contact = company/first name until booking; commission breakdown shown
  everywhere; date-locked completion; 72h contract/dispute windows; review
  14–28d window; cancellation tiers + strikes. Full list in `DASHBOARD_PLAN.md`.
- **Backend:** routes do HTTP only; logic in `services/*`; multi-table writes in
  `prisma.$transaction`; AppError(code, msg, status); response envelope
  `{success,data}` / `{success,error}`.
- **Git:** native git config (Txbish). Don't commit/push unless asked.
- **Harness quirk:** the Edit tool sometimes demands a fresh `Read` of a file
  even if read earlier — just re-read the small region and retry.

## Key files to anchor on
- Plan: `DASHBOARD_PLAN.md` · State: `CONTEXT.md` (top "Dashboard rebuild" section)
- Reference dashboard pages: `app/(artist)/artist/dashboard/page.tsx`,
  `app/(artist)/artist/jobs/[id]/job-detail-client.tsx`,
  `components/dashboard/job-wizard.tsx`
- Reference real-data public swap: `app/artists/talent-preview.tsx`
- WebSocket: `apps/api/src/ws/registry.ts` + `apps/api/src/index.ts` (WS block)
