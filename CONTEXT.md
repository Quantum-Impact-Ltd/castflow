# CastFlow — Implementation Context

> This file is updated at the end of every Claude Code session.
> Always read this before starting any work on this repo.

---

## Current phase

**Feature development**

---

## Phase completion status

| Phase | Description                                                              | Status      |
| ----- | ------------------------------------------------------------------------ | ----------- |
| 1     | Monorepo foundation — folder structure, Turborepo, configs, linting      | ✅ Complete |
| 2     | Shared packages — @castflow/types and @castflow/validators               | ✅ Complete |
| 3     | API scaffold — folder structure, env, lib singletons, errors, middleware | ✅ Complete |
| 4     | Prisma schema — full DB schema, first migration                          | ✅ Complete |
| 5     | Frontend scaffold — Next.js, folder structure, providers, lib            | ✅ Complete |
| 6     | Verification — both apps run, typecheck passes, health check responds    | ✅ Complete |

## Feature completion status

| #   | Feature                                                            | Status         |
| --- | ------------------------------------------------------------------ | -------------- |
| 01  | Auth (register/login/verify/reset, Google OAuth, redirect-by-role) | ✅ Complete    |
| 02  | Artist onboarding                                                  | ⬜ Not started |
| 03  | Admin: application queue                                           | ⬜ Not started |

---

## What has been built

- Folder structure and CLAUDE.md files (done manually before Phase 1)
- Git repository initialised (`main` branch)
- Turborepo pipeline configured (`turbo.json` with build/dev/lint/typecheck/clean tasks)
- TypeScript root config (strict mode, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`)
- ESLint with TypeScript rules + Prettier integration (`recommended-requiring-type-checking`, no-floating-promises, consistent-type-imports)
- Prettier config (no semis, single quotes, 100 print width, LF endings)
- VS Code settings (format on save, ESLint auto-fix, TypeScript workspace SDK)
- `bun install` run successfully (132 packages, refreshed to 562 in Phase 3)
- `@castflow/types` — all TypeScript interfaces, enums, and API response types (`enums.ts`, `entities.ts`, `api.ts`)
- `@castflow/validators` — all Zod schemas: auth, artist, job, bid, booking, review, upload
- API app scaffolded (Bun + Hono) — `apps/api/package.json`, `tsconfig.json`, `.env.example`, `.env`
- Env validation in `src/lib/env.ts` — app refuses to start with missing vars
- All lib singletons: `prisma`, `stripe`, `r2` (+ `Buckets`), `resend`, `auth`
- AppError class + ErrorCodes enum + `errors/index.ts` re-export
- Three middleware functions: `authenticate`, `requireRole`, `requireApproved`
- All 15 v1 route stubs mounted on `/api/v1/*` (auth, artists, casters, jobs, bids, bookings, contracts, payments, messages, reviews, disputes, notifications, uploads, talent, admin)
- All 9 admin route stubs mounted under `/api/v1/admin/*` via `routes/admin/index.ts`
- Webhook router mounted on `/webhooks`
- All 11 service stubs ready to implement (Artist, Caster, Job, Bid, Booking, Contract, Payment, Dispute, Notification, Email, Upload)
- Health check at `/health` — verified returning `{success:true,data:{status:"ok",env:"development"}}`
- WebSocket stub at `/ws/messages/:threadId` using `createBunWebSocket`
- `app` exported as named export for future test use; default export wires `port`, `fetch`, `websocket` for `Bun.serve`
- Global error handler catches `AppError`, Prisma `P2002`/`P2025`, and falls back to `INTERNAL_ERROR`
- Placeholder `prisma/schema.prisma` (single `ScaffoldPlaceholder` model) so `prisma generate` succeeds and the app can boot before Phase 4 — to be replaced wholesale in Phase 4
- Full Prisma schema (18 domain models, all enums) + Better Auth tables (`user`, `session`, `account`, `verification`)
- Database synced via `prisma db push` (schema applied to alwaysdata Postgres) and Prisma Client generated
- `prisma/seed.ts` stub created (no seed data yet)
- Next.js 16 app scaffolded (`apps/web`) with App Router, Tailwind v4, Turbopack — `bun run dev` boots in <1s on port 3000
- All 92 page stubs in correct route groups: 12 public, 9 onboarding, 25 artist, 28 caster, 17 admin, 1 shared (`/artists/[id]`)
- 5 layouts: root (Inter font + Providers), `onboarding/` (centered shell), and three auth guards under `(artist)`, `(caster)`, `(admin)`
- Auth guard redirects verified live: `/artist/dashboard`, `/caster/dashboard`, `/admin` all return 307 → `/login` when unauthenticated
- Core lib files: `lib/api.ts` (axios with cookie credentials + 401 redirect interceptor), `lib/auth-client.ts` (better-auth client), `lib/auth-server.ts` (server helper that proxies `auth.api.getSession({headers})` to the API's `/api/auth/get-session` over HTTP), `lib/query-client.ts` (TanStack Query defaults), `lib/utils.ts` (`cn` + `formatCurrency` + `formatDate`)
- `providers/index.tsx` wires QueryClientProvider + Sonner Toaster (top-right, richColors, closeButton)
- shadcn/ui initialised (radix base, neutral colour, CSS variables) — installed: button, input, label, textarea, select, form, dialog, sheet, tabs, badge, avatar, card, table, skeleton, dropdown-menu, separator, sonner
- `tsconfig.json` extends root, sets `noEmit`, `declaration: false`, `declarationMap: false`, `exactOptionalPropertyTypes: false` (see caveats)
- `.env.local.example` and `.env.local` created with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `bun run typecheck` passes with zero errors
- **Phase 6: full-stack verification complete** — `bun run typecheck`, `bun run lint`, and `bun run format:check` all green across the four workspaces. Both apps boot end-to-end on their target ports (api 3001, web 3000). API health check (`/health`) returns the canonical envelope. Unknown API routes (`/api/v1/*`) now return the structured `{success:false,error:{code:"NOT_FOUND",message:"Route not found"}}` envelope. Frontend routing matrix confirmed: `/`, `/login`, `/artists/test-id` return 200; `/artist/dashboard`, `/caster/dashboard`, `/admin` return 307 → `/login` when unauthenticated. Better Auth's `/api/auth/get-session` round-trips end-to-end through the `auth-server.ts` proxy (returns `null` for unauthenticated requests, which is what makes the auth-guard layouts redirect).
- **TanStack Query foundation** — `axios` removed; the data-fetching stack is now `Component → useQuery/useMutation → service (lib/api/*) → fetcher (lib/fetcher.ts)`. Native-fetch wrapper with typed `ApiError` (`code`, `status`, `fields`), envelope unwrap, `AbortSignal` support, and a browser-only 401-redirect (preserves prior interceptor behavior; SSR callers handle their own redirect strategy). `lib/query-client.ts` rewritten to the App-Router-recommended per-request pattern (`getQueryClient()` returns a fresh client on the server, a singleton in the browser); defaults are `staleTime: 30s`, `gcTime: 5m`, retry skipped for 4xx (only network/5xx retried up to twice), mutations never retry. `providers/index.tsx` mounts `ReactQueryDevtools` in development only. `lib/query-keys.ts` is the single source-of-truth key factory (jobs / caster.jobs / bids / artist.bids / artist.earnings / bookings / threads / messages / notifications / talent). Service and hook layers are scaffolded as a documented pattern in `apps/web/CLAUDE.md` but **not pre-populated** — added per feature, not preemptively.

### Feature 01 — Authentication (✅ complete)

**Backend**

- `apps/api/src/errors/ErrorCodes.ts` extended with `EMAIL_TAKEN`, `WEAK_PASSWORD`, `INVALID_TOKEN`, `BANNED`, `SUSPENDED`.
- `apps/api/src/lib/auth.ts` Better Auth instance wired with Resend-backed `emailVerification.sendVerificationEmail`, `sendResetPassword`, and a `databaseHooks.user.create.before` that blocks any banned email from re-registering. `emailVerification.sendOnSignUp: true`. Verification + reset URLs are rewritten to point at the frontend (`${FRONTEND_URL}/verify-email/[token]` and `/reset-password/[token]`).
- `apps/api/src/services/EmailService.ts` implements `sendVerificationEmail`, `sendPasswordReset`, `sendWelcomeEmail` via Resend. Includes a `NODE_ENV === 'test'` in-memory inbox with `__lastEmail(to)` / `__clearTestInbox()` helpers so tests don't need to mock the SDK.
- `apps/api/src/services/AuthService.ts` exposes `registerArtist` / `registerCaster`. Each: (1) pre-checks email uniqueness via Prisma (Better Auth's `requireEmailVerification: true` enables account-enumeration protection, which makes its `signUpEmail` return a fake-success on duplicates — so we must pre-check ourselves), (2) calls `auth.api.signUpEmail({ body: { email, password, name, role } })`, (3) verifies the user row actually persisted (defence in depth), (4) runs `prisma.$transaction` to create the matching profile row + set `user.role` / `profileId` / `approvalStatus` / `status='active'`. On any post-signup failure, rolls back by deleting the user (cascade clears account/session/profile rows).
- `apps/api/src/routes/auth.ts` mounts `POST /api/v1/auth/register-artist` and `POST /api/v1/auth/register-caster`. Both validate input with the Zod schemas from `@castflow/validators` (returning `VALIDATION_ERROR` with `fields`) before invoking the service.
- Login / logout / forgot-password / reset-password / verify-email / social Google are all handled by Better Auth's auto-mounted `/api/auth/**` handler — no app code beyond the callbacks above.

**Prisma**

- `ArtistProfile.user` and `CasterProfile.user` relations now have `onDelete: Cascade` so the rollback path is clean.
- `ArtistProfile.dob`, `gender`, `city`, `experienceLevel`, `idDocumentUrl` are now nullable. Registration only collects `firstName`/`lastName`/`artistType`; full onboarding (feature #2) fills in the rest. Talent search must filter on `approvalStatus === 'approved'` to avoid surfacing un-onboarded artists.

**Frontend**

- `apps/web/lib/api/auth.ts` — service layer: `registerArtist`, `registerCaster`, `login`, `logout`, `forgotPassword`, `resetPassword`, `resendVerification`, `getSession`. The two register endpoints hit `/api/v1/auth/*` via the standard `fetcher`; the rest hit Better Auth's `/api/auth/*` via a local `betterAuthRequest` helper (outside the `/api/v1` base path the fetcher prefixes).
- `apps/web/lib/hooks/use-auth.ts` — TanStack Query mutation hooks: `useRegisterArtist`, `useRegisterCaster`, `useLogin`, `useLogout`, `useForgotPassword`, `useResetPassword`, `useResendVerification`. `useLogin`/`useLogout` invalidate `['session']`. All wrap their mutationFn so RHF passes only the input (TanStack v5 also passes a context arg that would otherwise leak into `init`).
- `apps/web/lib/auth-redirect.ts` — pure `postLoginPath(user)` helper. Admin → `/admin`, caster → `/caster/dashboard`, artist+approved → `/artist/dashboard`, artist otherwise → `/onboarding/pending`.
- Pages: `/register` (role chooser), `/register/artist`, `/register/caster`, `/login` (email/password + Google button), `/verify-email` (resend + "check your inbox" state), `/verify-email/[token]` (server-side calls Better Auth verify endpoint and renders success/failure), `/forgot-password` (always renders success — never leaks whether an email exists), `/reset-password/[token]`, `/reset-password` (fallback for missing token), `/onboarding/pending` (artist post-register landing).
- Register forms use `react-hook-form` + `zodResolver` and extend the shared schemas locally with a `confirmPassword` mirror. Server-side field errors from the API are mapped onto RHF fields via `form.setError(field, { type: 'server' })`; non-field errors render inline.

**Validators**

- `packages/validators/src/auth.ts` now exports `ForgotPasswordInput` and `ResetPasswordInput` types (previously only the schemas were exported).

**Tests**

- `packages/validators/src/auth.test.ts` — 13 validator tests (V1–V13), all passing under `bun test`.
- `apps/web/lib/auth-redirect.test.ts` — 6 redirect-helper tests (W1–W5 plus a missing-status fallback), all passing under Vitest.
- `apps/web/lib/api/auth.test.ts` — 4 service tests (path/method/body, AbortSignal forwarding, `getSession` null on non-OK), passing under Vitest.
- `apps/api/tests/auth/register-artist.test.ts` — 4 API integration tests (A1 valid registration, A2 duplicate email → 409, A3 weak password → VALIDATION_ERROR, A6 verification email dispatched). Tests use the in-memory test inbox and unique `@castflow.test` emails; `afterEach` purges any test-domain users.
- `apps/api/tests/auth/register-caster.test.ts` — 1 valid signup (A7) + parameterised companyType test (A8). All four companyTypes pass.
- The detailed test plan in `docs/features/01-auth.md` (21 API + 17 frontend + 7 E2E) is intentionally **not exhausted** — the baseline above covers core paths; the full plan is revisited after the broader feature work.

---

## Known caveats and decisions

- **`turbo.json`: `pipeline` → `tasks`** — Turbo 2.x renamed the field; the Phase 1 spec used the old name. Updated in Phase 2 when typecheck failed.
- **`packageManager`: pinned to `bun@1.3.11`** — Turbo 2.x rejects `bun@latest`; requires a strict semver pin. The Phase 1 spec used `bun@latest`.
- **`zod` pinned to `^3.23.0`** per spec — note that zod v4 exists but our schemas target v3 API (`.refine` with object-shape options, etc.).
- **`updateBidSchema` exports**: only `submitBidSchema`/`updateBidSchema` named values exported; `UpdateBidInput` type is not yet used and not exported. Add the inferred type when the bid edit endpoint is built.
- **`ageMin/ageMax` validation in `createJobSchema`**: the spec sets `min(18)` for both, but the existing `Job` interface allows age ranges starting from 18 — the validator's lower bound (18) is the canonical one for casting purposes (no minors).
- **Phase 3: `tsconfig.json` `types`** — spec said `["bun-types"]`, but Bun now ships types under `@types/bun` (which exposes the package name `bun`). Changed to `["bun"]` so tsc resolves them.
- **Phase 3: `auth.ts` additionalFields** — added a `status` field (UserStatus) that the spec omitted. The `authenticate` middleware checks `session.user.status === 'suspended' | 'banned'`, which would not typecheck without it. Defaulted to `'pending'`, `input: false`. Phase 4 should ensure this aligns with the canonical `User.status: UserStatus` in `@castflow/types`.
- **Phase 3: service stubs** — each service stub assigns `protected static readonly db = prisma` so the `prisma` import is referenced (avoids ESLint `no-unused-vars` complaints once linting is run; harmless under tsc).
- **Phase 3: placeholder Prisma schema** — added a one-model placeholder schema so `prisma generate` succeeds and `lib/prisma.ts`'s `new PrismaClient()` doesn't throw at import time. The model name is `ScaffoldPlaceholder` (Prisma rejects identifiers starting with `_`). Phase 4 replaces the entire schema.
- **Phase 4: `prisma migrate dev` blocked by managed Postgres** — alwaysdata's role lacks `CREATE DATABASE`, so Prisma can't spin up the shadow DB it needs for `migrate dev` (`Error: P3014`). Used `prisma db push` instead — schema is live on the DB but no `migrations/` folder exists yet. To switch to migrations later, provision a second empty DB on alwaysdata, set `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")` in the datasource block, then run `prisma migrate dev --name init`.
- **Phase 4: Better Auth conventions for auth tables** — Better Auth's Prisma adapter expects singular table names (`user`, `session`, `account`, `verification`), camelCase columns (no `@map`), and `User.role`/`User.status` as `String` (not enum). The merged schema follows that exactly for those four models, while every domain model keeps snake_case `@@map`/`@map` and Prisma enums. The `UserRole` and `UserStatus` enums remain in the schema as canonical type definitions even though `User` stores them as strings — this matches `auth.ts`'s `additionalFields` configuration.
- **Phase 4: `Review` reviewee FK collision** — `Review.revieweeId` is the FK for both `artistReviewee` and `casterReviewee` relations (one record points to either an artist or caster). Prisma generates the same default constraint name for both, so each relation needs an explicit `map:` argument (`reviews_reviewee_artist_fkey` / `reviews_reviewee_caster_fkey`). Document well — if anyone changes these relations, both `map:` names must remain unique.
- **Phase 5: Next.js 16 + Tailwind v4** — `create-next-app@latest` ships Next 16.2.6 + Tailwind 4 + React 19 + Turbopack by default. The Phase 5 spec was written around Tailwind v3 / shadcn's old `--style/--base-colour` prompts, neither of which exist in current shadcn. Used `shadcn init -d --no-monorepo -b radix --no-rtl --no-pointer` (the `-d` defaults preset bakes in `--template=next` + `--preset=base-nova`), and confirmed `globals.css` was rewritten to the v4 `@import "tailwindcss"` style.
- **Phase 5: `shadcn add toast` is gone** — toast was deprecated in favour of Sonner; `shadcn add sonner` installs `components/ui/sonner.tsx`, and `Toaster` is wired in `providers/index.tsx`. The spec's `add ... toast` line should be read as `add ... sonner`.
- **Phase 5: `shadcn add form` skipped on first pass** — the registry call returned without writing the file (no error, just no-op). Worked around by hitting the registry URL directly (`shadcn add https://ui.shadcn.com/r/styles/new-york-v4/form.json`), which created `components/ui/form.tsx`.
- **Phase 5: zod pinned to `^3.23.0` in `apps/web/package.json`** — `bun add zod` initially resolved to v4, which would break the workspace `@castflow/validators` (Phase 2 schemas use the v3 API). Re-pinned to `^3.23.0` matching the rest of the monorepo. If we ever upgrade zod, do it across all workspaces in one PR.
- **Phase 5: `tsconfig.json` overrides** — root has `exactOptionalPropertyTypes: true`, `declaration: true`, `declarationMap: true`. Re-enabling these against the generated shadcn components surfaces `TS2375` errors in `dropdown-menu.tsx`/`sonner.tsx` (CheckedState | undefined vs CheckedState; theme prop optionality), and a `TS2742` portability error on `better-auth/client`'s deeply-inferred return type. Apps/web overrides all three to `false` because shadcn is auto-generated and the web app does not emit `.d.ts`. The api app does not need this override.
- **Phase 5: `auth.api.getSession({ headers })` is a thin proxy, not the real Better Auth server SDK** — the spec's example only typechecks against the server-only `betterAuth()` factory (which needs the DB + secret and lives in apps/api). Since the web app talks to a separate auth server over HTTP, `apps/web/lib/auth-server.ts` exposes a hand-rolled `auth.api.getSession({ headers })` that forwards the incoming `cookie` header to `${NEXT_PUBLIC_API_URL}/api/auth/get-session` and returns the parsed JSON. The call signature in the layouts (`await auth.api.getSession({ headers: await headers() })`) is preserved — the only difference is the implementation. Confirm the API actually exposes that route in the auth phase; otherwise update both ends together.
- **Phase 5: page count** — spec says "97 stubs" but the exact counts are 92 `page.tsx` files + 5 `layout.tsx` files (root, onboarding, artist, caster, admin) = 97 route files total. No discrepancy; just clarifying for future readers.
- **Phase 5: removed default `app/page.tsx`** — `create-next-app` generates a starter homepage; deleted it before writing the public homepage stub so the stub is the authoritative file.
- **Phase 5: empty `(artist)`, `(caster)`, `(admin)` route groups before adding routes** — Next.js complains if a route group exists with no routes inside. The auth-guard layouts plus the panel pages (added in Step 11) populate them.
- **Phase 6: `apps/api/tsconfig.json` `include`** — was `["src", "prisma"]` so `tsc` could see `prisma/seed.ts`, but with `rootDir: "src"` that file triggered `TS6059: not under 'rootDir'`. Dropped `prisma` from `include` — the seed is run independently with `bun prisma/seed.ts` and does not need to be part of the typecheck graph. If we ever wire seeding into a build/CI pipeline that requires it to compile, give the seed its own `tsconfig.seed.json` with a separate `rootDir`.
- **Phase 6: `app.notFound()` handler added** — without it, Hono served plain text `404 Not Found` for unknown routes, breaking the universal-envelope contract. Now every unknown route returns `{success:false,error:{code:"NOT_FOUND",message:"Route not found"}}` with HTTP 404.
- **Phase 6: `apps/web/lib/api.ts` lint/typecheck conflict** — axios's typed response interceptor expects an `AxiosResponse<T>` return shape, but we unwrap the envelope to `res.data` so callers receive `data` directly. After typing `res` as `AxiosResponse<unknown>`, the unwrap was flagged by both `@typescript-eslint/no-unsafe-return` and `TS2345`. Resolved with an `as never` cast at the unwrap, plus a typed `ApiErrorEnvelope` for the error path. **Superseded immediately afterwards** — `lib/api.ts` and the `axios` dependency were removed in favour of the `lib/fetcher.ts` native-fetch wrapper (see TanStack Query architecture caveat below). Kept the entry for context; the workaround is no longer load-bearing.
- **TanStack Query architecture caveats** —
  - `lib/fetcher.ts`'s 401-redirect fires only when `typeof window !== 'undefined'`. Server components / route handlers receive the thrown `ApiError` and decide their own redirect (currently `auth-server.ts` returns `null` on non-OK, so the auth-guard layouts still 307 cleanly). If a server component ever needs to call the API directly, do not assume the fetcher will handle 401 — wrap the call and check `error.status`.
  - `lib/query-client.ts` uses the per-request pattern (`getQueryClient()`). Anything that imports `queryClient` directly (the old singleton export) will break — there is no longer a module-scope export. Always go through `useQueryClient()` in components or call `getQueryClient()` for a server-side cache.
  - `lib/query-keys.ts` mirrors the resource list documented in `apps/web/CLAUDE.md`. When adding a new resource, update both the factory and the docs; otherwise contributors will inline strings.
  - `lib/api/*` and `lib/hooks/*` directories are documented in `apps/web/CLAUDE.md` but are **intentionally empty** until the first feature lands. The pattern is the contract; the files are not.
- **Phase 6: `apps/web/lib/auth-server.ts` redundant unions** — `'artist' | 'caster' | 'admin' | string` and `'pending' | 'approved' | 'rejected' | string` collapsed to `string` per `@typescript-eslint/no-redundant-type-constituents`. Dropped the `| string` fallbacks — the literal unions are now load-bearing. If the API ever returns a value outside the literal set, the JSON cast will silently widen at runtime; tighten the parse with a runtime guard if that becomes a problem.
- **Phase 6: `.prettierignore` additions** — `next-env.d.ts` is regenerated by Next.js on every `dev`/`build` with formatting that does not match our prettier config, and `.claude/settings.local.json` is rewritten by the Claude harness. Both are now ignored so `bun run format:check` stays green between local sessions.
- **Test infrastructure caveats** —
  - `NODE_ENV=test` is now accepted by `apps/api/src/lib/env.ts` (the Zod enum was widened from `['development','staging','production']` to include `'test'`). `bun test` sets this implicitly. If you ever read `env.NODE_ENV` for branching logic, treat `'test'` like `'development'`.
  - API tests live in `apps/api/tests/` (outside `rootDir: "src"`). They are run by `bun test`, which transpiles each file individually and does not consult `tsconfig.json` — so the `rootDir` constraint is not violated at runtime. Trade-off: `bun run typecheck` (which is `tsc --noEmit`) **does not typecheck the test files**. If we want test typechecking, add `apps/api/tsconfig.test.json` with `rootDir: "."` and `include: ["src","tests"]`, plus a `typecheck:tests` script.
  - Web tests are co-located (`*.test.ts(x)` beside the file under test). Vitest config at `apps/web/vitest.config.ts`, setup file `apps/web/vitest.setup.ts`. `'@/'` path alias is mirrored from `tsconfig` paths into Vitest's `resolve.alias`.
  - Playwright is **at the repo root**, not inside `apps/web`, because E2E exercises both apps. `playwright.config.ts` does NOT have a `webServer` block — you must `bun run dev` first, then `bun run test:e2e` in a second terminal. Before first run on a new machine: `bun run test:e2e:install` to fetch the Chromium binary.
  - `turbo.json` `test` task `dependsOn: ["^build"]` and `outputs: ["coverage/**"]`. The "no output files found" warning at the end of `bun run test` is benign (no coverage emitted yet).
  - `.prettierignore` now also ignores `test-results` and `playwright-report` (Playwright run artefacts).
- **Feature 01 caveats** —
  - **Better Auth's enumeration protection breaks the naïve duplicate-email path.** With `requireEmailVerification: true` (which we want), `auth.api.signUpEmail` no longer throws on a duplicate email — it returns a fake "success" payload with a generated user id that never persists, so any downstream profile-create fails with a foreign-key error and you get a 500 instead of a 409. `AuthService.assertEmailAvailable` pre-checks the email against `prisma.user` before calling Better Auth. There is still a tiny TOCTOU window between the pre-check and the BA call; the DB unique constraint catches concurrent dupes, and the `signUp` helper does a post-hoc `findUnique({ id })` as belt-and-braces.
  - **ArtistProfile required fields relaxed.** `dob`, `gender`, `city`, `experienceLevel`, `idDocumentUrl` are now nullable on the schema so registration can create a "shell" profile with just `firstName`/`lastName`/`artistType`. Onboarding (feature #2) **must** fill these before submission and `talent` search must filter on `approvalStatus === 'approved'` (which already requires onboarding to be complete).
  - **Cascade onDelete on profile→user relations.** `ArtistProfile.user` and `CasterProfile.user` now have `onDelete: Cascade`. This is what makes the `AuthService` rollback path safe: deleting the user wipes the partially-created profile, sessions, accounts.
  - **First/Last name strategy.** Spec open question #1 resolved as: Better Auth's `user.name` stores `"firstName lastName"` (or `contactName` for casters); the split form lives on `ArtistProfile.firstName/lastName`. Display name is a profile concern, identity is a user concern.
  - **Verification + reset link URLs.** Better Auth defaults to a callback on the API host. We rewrite both to point at the frontend: `${FRONTEND_URL}/verify-email/[token]` and `${FRONTEND_URL}/reset-password/[token]`. The `[token]` page is a server component that calls the API back to do the actual mutation.
  - **`EmailService` test inbox.** In `NODE_ENV === 'test'` the service writes to an in-memory array instead of calling Resend, exposed via `EmailService.__lastEmail(to)` / `__clearTestInbox()`. Tests should `beforeEach(() => EmailService.__clearTestInbox())` and not rely on order across files. Importing those helpers in non-test code is a smell.
  - **Apple OAuth web button intentionally hidden.** Credentials are stubbed in `auth.ts` (so the social provider object stays optional via the env-driven guard), but the login page only renders a Google button. Wire Apple in when we ship the iOS app or when product asks.
  - **Forgot-password endpoint always returns 200.** This matches the spec's A16 rule (don't leak account existence). The frontend's `ForgotPasswordForm` renders the same "if an account exists…" success state regardless of mutation success/failure (uses `onSettled`).
  - **`docs/features/01-auth.md` test plan partially covered.** We implemented only the high-value baseline (~24 tests vs the spec's full ~58). The remaining test work — RTL form tests, BA-flow integration (login/logout/reset/verify), and the 7 E2E paths — is deferred until the feature stack is broader. Spec is the source of truth; CONTEXT just reflects current state.
  - **`packages/validators` test wiring.** Added `"test": "bun test"` script plus a `--ignore-pattern '*.test.ts'` flag on the lint script. The package's `tsconfig.json` excludes `*.test.ts` so the test file doesn't need to satisfy `rootDir`/strict types from the workspace root. Trade-off: validator test files are not typechecked by `bun run typecheck`; they're checked at `bun test` runtime by Bun's transpiler. Same trade-off as `apps/api/tests/`.

---

## Environment variables outstanding

These need to be filled in manually before certain phases will work:

| Variable                | Needed for                                              | Set?                                             |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| `DATABASE_URL`          | Phase 4 (Prisma migration)                              | ✅ Set (alwaysdata Postgres)                     |
| `SHADOW_DATABASE_URL`   | `prisma migrate dev` (Phase 4 workaround — see caveats) | ⬜ (not set; `db push` used instead)             |
| `BETTER_AUTH_SECRET`    | Feature 01 (auth) — must be ≥32 chars                   | ⚠ Required for real auth (placeholder in `.env`) |
| `STRIPE_SECRET_KEY`     | Payment features                                        | ⬜ (placeholder in `.env`)                       |
| `STRIPE_WEBHOOK_SECRET` | Webhook handler                                         | ⬜ (placeholder in `.env`)                       |
| `R2_ACCOUNT_ID`         | File uploads                                            | ⬜ (placeholder in `.env`)                       |
| `R2_ACCESS_KEY_ID`      | File uploads                                            | ⬜ (placeholder in `.env`)                       |
| `R2_SECRET_ACCESS_KEY`  | File uploads                                            | ⬜ (placeholder in `.env`)                       |
| `RESEND_API_KEY`        | Emails                                                  | ⬜ (placeholder in `.env`)                       |
| `GOOGLE_CLIENT_ID`      | Social login                                            | ⬜                                               |
| `APPLE_CLIENT_ID`       | Social login                                            | ⬜                                               |

`apps/api/.env` was created from `.env.example` with the placeholder values to allow the app to boot. Replace placeholders with real values before exercising the features that depend on them.

---

## Package versions pinned

Installed during Phase 1 (`bun install`):

- `typescript@5.9.3`
- `turbo@2.9.10`
- `eslint@8.57.1` (held at v8 — `@typescript-eslint` v7 plugin/parser require ESLint v8 host)
- `prettier@3.8.3`
- `@typescript-eslint/eslint-plugin@7.18.0`
- `@typescript-eslint/parser@7.18.0`
- `eslint-config-prettier@9.1.2`
- `@types/node@20.19.40`

Added during Phase 2:

- `zod@3.25.76` (resolved from `^3.23.0`) — pinned to v3 API; v4 will require schema rewrites

Added during Phase 3 (workspace `apps/api`):

- `@aws-sdk/client-s3@^3.600.0`
- `@aws-sdk/s3-request-presigner@^3.600.0`
- `@prisma/client@5.22.0` (resolved from `^5.15.0`)
- `prisma@5.22.0` (resolved from `^5.15.0`)
- `@react-pdf/renderer@^3.4.0`
- `better-auth@latest`
- `hono@^4.4.0`
- `resend@^3.3.0`
- `stripe@^16.0.0`
- `@types/bun@latest`

`bun install` after Phase 3 dependency additions: 562 packages installed.

Phase 4 used:

- `prisma@5.22.0` / `@prisma/client@5.22.0` (already installed in Phase 3)
- `@better-auth/cli` (run via `bunx` for `generate`; not added as a dependency)

Added during Phase 5 (workspace `apps/web`):

- `next@16.2.6`
- `react@19.2.4` / `react-dom@19.2.4`
- `tailwindcss@^4` + `@tailwindcss/postcss@^4` (Tailwind v4, not v3)
- `babel-plugin-react-compiler@1.0.0`
- `@castflow/types@workspace:*` / `@castflow/validators@workspace:*`
- `better-auth@1.6.9`
- `@tanstack/react-query@5.100.9`
- ~~`axios@1.16.0`~~ removed in TanStack Query foundation step (replaced by native-fetch wrapper in `lib/fetcher.ts`)
- `react-hook-form@7.75.0` / `@hookform/resolvers@5.2.2`
- `zod@3.25.76` (pinned to `^3.23.0`)
- `@stripe/stripe-js@9.4.0` / `@stripe/react-stripe-js@6.3.0`
- `react-dropzone@15.0.0`
- `react-pdf@10.4.1`
- `date-fns@4.1.0`
- `sonner@2.0.7`
- `@tiptap/react@3.23.1` / `@tiptap/pm@3.23.1` / `@tiptap/starter-kit@3.23.1`
- `class-variance-authority@^0.7.1`, `clsx@^2.1.1`, `tailwind-merge@^3.5.0`, `lucide-react@^1.14.0`, `radix-ui@^1.4.3`, `tw-animate-css@^1.4.0`, `next-themes@^0.4.6`, `shadcn@^4.7.0` (pulled in by shadcn init / `add` runs)

`bun install` after Phase 5 dependency additions: 877 installs across 939 packages.

Added during the TanStack Query foundation step (post-Phase 6, workspace `apps/web`):

- `@tanstack/react-query-devtools@5.100.9` (devDependency)

Removed:

- `axios@1.16.0` and its deps

Added during test-infrastructure step (post-Phase 6):

- Root: `@playwright/test@1.60.0` (devDependency)
- `apps/web` devDependencies: `vitest@4.1.6`, `@vitejs/plugin-react@6.0.1`, `jsdom@29.1.1`, `@testing-library/react@16.3.2`, `@testing-library/jest-dom@6.9.1`, `@testing-library/user-event@14.6.1`, `@types/react@19.2.14`, `@types/react-dom@19.2.3` (the last two replaced unpinned `^19` placeholders)
- `apps/api` adds no new deps — uses `bun test` (built into the runtime; `@types/bun` already pinned)

---

## Backend security hardening (post-Feature-01, pre-Feature-02)

Full sweep of `HANDOFF.md` §4.1 security gaps (high + medium + low). Typecheck,
lint, prettier, and the 11 baseline tests still green after every checkpoint.

### High priority (all done)

- **Rate limiting** — `apps/api/src/middleware/rateLimit.ts` exposes a
  `rateLimit({ scope, windowMs, max, key?, message? })` factory plus a
  `rateLimitByUser` variant that keys on `c.get('user').id` (falls back to IP if
  the user is not on context). Backed by an in-memory `Map<string, Bucket>` with
  lazy sweep every 60s. **Bypassed when `env.NODE_ENV === 'test'`** so the suite
  stays deterministic. Applied at:
  - `app.use('/api/auth/sign-in/*', …)` — 10 / 15 min / IP
  - `app.use('/api/auth/forget-password', …)` — 5 / hour / IP
  - `authRoutes.post('/register-{artist,caster}', registerLimit, …)` —
    10 / hour / IP
  - `uploadRoutes.post('/presigned-url', presignLimit, …)` —
    30 / 10 min / user
  - `bidRoutes.post('/jobs/:jobId', …, submitBidLimit, …)` —
    60 / hour / user
  - `messageRoutes.post('/threads/:id', sendMessageLimit, …)` —
    30 / minute / user
  - The 429 response carries `Retry-After` and uses the new `RATE_LIMITED`
    error code in `ErrorCodes.ts`.
  - **Caveat:** in-memory state is per-instance. Once we run >1 API replica we
    need Redis (or Upstash) as the shared store. For MVP single-instance Railway
    this is good enough.
- **Session revocation on admin suspend/ban** — `adminUserRoutes.post('/:id/status', …)`
  in `apps/api/src/routes/admin/users.ts` now appends
  `prisma.session.deleteMany({ where: { userId: id } })` to the same
  `$transaction` when the new status is `suspended` or `banned`. The
  `authenticate` middleware already blocked these statuses, but the session
  token itself stayed valid for up to 7 days — now it's evicted atomically with
  the status flip. Direct Prisma delete is used instead of Better Auth's
  admin-plugin `revokeUserSessions` (we don't ship that plugin); the singular
  `session` model is the same table BA writes to.
- **Upload key-ownership check** — `UploadService.confirmUpload` now rejects any
  payload whose `input.key` does not start with `${input.type}/${userId}/`
  (the server-generated prefix from `getPresignedUrl`). Throws
  `AppError('FORBIDDEN', …, 403)`. New portfolio items default to
  `isApproved: false` (schema default is `true`, overridden explicitly) so
  admin review is required before they go public — closes the "any image goes
  live" gap from the audit.
- **Stripe idempotency on escrow intent** — `PaymentService.createEscrowIntent`
  now passes `{ idempotencyKey }` as the second arg to
  `stripe.paymentIntents.create`. The key is `booking-${id}-intent` on first
  attempt and `booking-${id}-retry-${prevIntentId}` if a previous intent
  exists, so a flaky client retry returns the same PaymentIntent instead of
  authorising twice and orphaning the previous hold.
- **Webhook event expansion** — `routes/webhooks.ts` now also handles
  `payment_intent.canceled`, `charge.refunded`, and `charge.dispute.created`.
  Backed by three new idempotent reconcilers on `PaymentService`:
  `markCanceledByIntent`, `markRefundedByCharge`, and `markDisputedByCharge`.
  Refunds processed in the Stripe dashboard now flip
  `Payment.escrowStatus → refunded|partially_refunded` (booking → `cancelled`
  on full refund), cancelled intents same path, and chargeback disputes flip
  both `Payment.escrowStatus → disputed` and `Booking.status → disputed`.
- **Public job feed defence-in-depth** — `JobService.listPublic` and
  `getPublicDetail` now also filter `headcountFilled < headcountRequired`.
  The authoritative state machine (`acceptBid` flipping `Job.status → 'filled'`)
  still does the heavy lifting; this is a belt-and-braces filter so a stuck
  status flag can't surface a fully-booked job.
- **Case-insensitive ban check** — `lib/auth.ts` `databaseHooks.user.create.before`
  switched to `email: { equals, mode: 'insensitive' }` so direct DB seeds with
  mixed-case emails can't slip a ban.

### Medium priority (all done)

- **Profile-completeness gating** — `ArtistService.submitForReview` now also
  requires `idDocumentUrl` (PRD §8.1 step 5) and ≥3 portfolio photos
  (PRD §8.1 step 4). Missing-ID falls under the existing
  `VALIDATION_ERROR / missing[]` envelope; the portfolio gap uses the
  pre-existing `MIN_PORTFOLIO_REQUIRED` error code.
- **`idVerified` flip on approve** — `ArtistService.approveApplication` now
  sets `idVerified: true` inside the same transaction so the "Verified" badge
  (PRD §13.1) is no longer dead.
- **Explicit select on talent detail** — `talentRoutes.get('/:id', …)` replaced
  the post-fetch `undefined`-stripping with an explicit Prisma `select:` clause.
  Sensitive fields (`lastName`, `dob`, `idDocumentUrl`, `userId`,
  `approvalNotes`, `approvedById`, `strikeCount`, `updatedAt`) never leave the
  DB. Anything not listed is excluded by definition.
- **Logged AuthService rollback failures** — `AuthService.signUp` rollback now
  logs the original error + the secondary delete error to `console.error`
  instead of swallowing them via `.catch(() => undefined)`. Orphan Better Auth
  user rows surface in logs for ops to clean up.

### Low priority (all done)

- **72-hour contract signing window** — `ContractService.sign` rejects with
  `INVALID_STATE` once `now > contract.createdAt + 72h` (PRD §10.7).
- **14–28 day review window** — `ReviewService.submit` rejects with
  `INVALID_STATE` if `now < shootDate + 14d` or `now > shootDate + 28d`
  (PRD §10.9).
- **Cancellation tier table** — `BookingService.cancel` now derives a tier
  (`more_than_7d` / `3_to_7d` / `under_48h` for artist cancels;
  `more_than_48h` / `under_48h` for caster cancels) from `shootDate`. Only the
  `under_48h` tier records a cancellation fee (50% of `totalAmount`). The
  strike-increment/warning side-effect at each tier remains deferred — the
  strike system itself is on the §4.4 deferred list, and the actual Stripe
  split (capturing the fee rather than refunding the full escrow) is on the
  same list. The structure is in place for those to drop in.

## Backend optimizations (§4.2)

Full sweep of `HANDOFF.md` §4.2. Typecheck, lint, prettier, and the 11
baseline tests still green.

- **Missing DB indexes** — added `@@index` on `Booking(artistId)`,
  `Booking(casterId)`, `Booking(status)`, `Review(revieweeId)`,
  `Payment(escrowStatus)`, `AdminLog(adminId)`, `AdminLog(entityType, entityId)`.
  Applied via `prisma db push` (no shadow DB yet — see Phase 4 caveat). Run
  `bunx prisma generate` if cloning fresh.
- **Double-fetch / N+1 fixes**
  - `BookingService.getById` only re-fetches if `maybeAutoRelease` actually
    mutated the escrow status. Saves one query on the hot path.
  - `BidService.listBidsForJob` collapsed to a single `prisma.job.findFirst`
    where the `where` clause IS the authz check, and `bids` are included
    inline. One round-trip instead of two.
  - `MessageService.listMessages` collapsed similarly — one
    `messageThread.findUnique({ include: { messages } })` plus an inline
    participant check.
- **Cursor pagination on heavy lists** — `apps/api/src/lib/pagination.ts`
  exposes `parsePagination(c, default=25, max=100)` and `paginate(rows, limit)`.
  The cursor spread (`...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})`)
  is inlined at each call site rather than extracted into a helper because
  `exactOptionalPropertyTypes: true` makes a unioned helper return type
  incompatible with Prisma's generated `FindManyArgs`. Wired into:
  - `BidService.listMyBids` + `GET /api/v1/bids/me/list`
  - `BookingService.getMyBookings` + `GET /api/v1/bookings/me/list`
  - `JobService.listMyJobs` + `GET /api/v1/jobs/me/list`
  - All admin lists: `users`, `bookings`, `jobs`, `payments`, `disputes`,
    `flagged/messages`, `flagged/reviews`, `logs`
  - Routes now return `{ success, data, meta: { nextCursor } }` so clients
    can keep paging until `nextCursor === null`.
- **`listApplications` portfolio over-include** — replaced
  `include: { portfolioItems: true }` (25 rows × N items) with
  `include: { _count: { select: { portfolioItems: true } } }`. Admin detail
  open still loads the full portfolio per the existing detail endpoint.
- **Incremental `refreshRatingCache`** — `ReviewService` now applies a
  per-review increment (`newAvg = (oldAvg × oldCount + newRating) / newCount`)
  instead of re-aggregating the entire reviews table on every submit. The
  full-aggregate helper was removed for now — when admin remove-review lands,
  add it back for authoritative recovery (noted inline in the
  `applyRatingIncrement` doc comment).

### Optimization carry-forwards

- `MessageThread.lastMessageContent` cache for `listInbox` correlated subquery
  — needs a schema column, deferred.
- Session `additionalFields.profileId` populated post-registration to skip a
  per-request profile lookup — small follow-up; touches `AuthService.signUp`.
- `pg_trgm` GIN index for `Job.title/description` full-text — out of MVP scope.

## Stripe Connect (artist payouts)

End-to-end wiring of payouts to artists via Stripe Connect Express accounts.
Typecheck, lint, prettier, and 11/11 tests still green.

### Model

We use the **separate charges and transfers** pattern:

1. Caster confirms a booking → `createEscrowIntent` creates a manual-capture
   PaymentIntent against the platform Stripe account. Money sits as an auth
   hold on the caster's card.
2. Webhook `payment_intent.amount_capturable_updated|succeeded` flips
   `Payment.escrowStatus → held`.
3. Caster confirms completion (or 48h auto-release fires) →
   `releaseEscrow`:
   - **Gate**: artist must have `stripeAccountId` + `payoutsEnabled: true`.
     If not, throws `PAYOUT_NOT_READY` (HTTP 409) and the escrow stays
     `held`. No orphan capture, no money stuck on platform.
   - Captures the PaymentIntent (idempotency key `capture-${paymentId}`).
   - Creates a `stripe.transfers.create` to the artist's Connect account
     (idempotency key `transfer-${paymentId}`; `source_transaction` set to
     the original charge so Stripe Connect reports tie out).
   - Marks `escrowStatus → released`, persists `stripeTransferId`.
4. `maybeAutoRelease` swallows `PAYOUT_NOT_READY` so an un-onboarded artist
   doesn't 4xx every booking detail read; it logs `auto-release deferred`
   and leaves the escrow `held` for the next opportunity.

### Schema

- New `ArtistProfile.stripeAccountId` (`String?  @unique @map`) and
  `ArtistProfile.payoutsEnabled` (`Boolean @default(false) @map`). Pushed
  via `prisma db push --accept-data-loss` (only adds a nullable unique
  column to an empty table; no risk in practice). Client regenerated.

### Service surface (`PaymentService`)

- `createConnectOnboardingLink(userId)` — idempotently creates a Connect
  Express account (`type: 'express'`, `country: 'GB'`,
  `capabilities: { transfers: { requested: true } }`,
  `business_type: 'individual'`), persists `stripeAccountId`, then returns
  `{ url, expiresAt }` from `stripe.accountLinks.create({ type: 'account_onboarding' })`.
- `getConnectStatus(userId)` — calls `stripe.accounts.retrieve` and returns
  `{ connected, accountId, payoutsEnabled, detailsSubmitted, requirementsDue }`.
  Reconciles the cached `payoutsEnabled` if it has drifted from Stripe.
- `syncConnectAccountStatus({ id, payouts_enabled })` — webhook reconciler;
  mirrors Stripe's `payouts_enabled` onto the cached column.
- `releaseEscrow` — gated + transferring (see "Model" above).

### Routes

- `POST /api/v1/payments/connect/onboard` (artist only) → onboarding link.
- `GET  /api/v1/payments/connect/status`  (artist only) → live status.
- Onboarding link redirects: `${FRONTEND_URL}/artist/payouts/setup?refresh=1`
  and `?completed=1` (frontend page not built yet — backend ready).

### Webhook

`account.updated` now syncs `payoutsEnabled`. (The existing four
`payment_intent.*` / `charge.*` events from the security sweep remain.)

### New error code

- `PAYOUT_NOT_READY` — thrown by `releaseEscrow` when the artist hasn't
  finished Connect onboarding. Caster-initiated release returns 409 so the
  UI can prompt them to chase the artist; auto-release swallows it.

### Assumptions / open items

- **`country: 'GB'`** is hard-coded on account creation. We're UK-only for
  MVP per the brief; revisit when expanding.
- **`business_type: 'individual'`** is hard-coded. Stripe's Express flow
  lets the artist correct this during onboarding if they're operating as a
  company, but defaulting to individual matches the typical model/actor
  freelancer profile.
- **No retry queue.** If `releaseEscrow` succeeds at capture but `transfer`
  fails (rare — Stripe transfers from the platform balance are very
  reliable), the escrow stays in a half-completed state: captured on
  Stripe but `escrowStatus` still `held` in DB. Webhook `transfer.failed`
  reconciliation is not wired — admin will see this in the Stripe
  dashboard and can manually retry. Bookmark for a hardening pass.
- **No "set up payouts" frontend page yet.** Backend is plug-and-play; the
  page lives under `/artist/payouts/setup` per the redirect URLs.
- **`source_transaction` in `transfers.create`** requires the platform
  charge to have settled — for instant transfers we'd want a separate
  balance. For MVP this is fine because we capture immediately before
  transferring; if Stripe ever requires the charge to be more "settled"
  before allowing the linked transfer, the transfer will retry on the
  next release attempt.

## Notification + email event wiring

End-to-end wiring of in-app notifications + emails at every relevant business
event. Typecheck, lint, prettier, and 11/11 tests still green.

### Helper

- `NotificationService.notifyEvent({ userId, type, title, body, email?, relatedEntityType?, relatedEntityId? })`
  — single fire-and-forget call that creates the in-app row AND fires the
  email. Wrapped in `try/catch` per channel so a Resend hiccup never poisons
  the originating business operation. Pass `email: false` for in-app only.
- `EmailService.sendEvent({ to, subject, html })` — generic event template.
  Body composes `<h1>title</h1><p>body</p>` plus an optional CTA link
  derived from `email.ctaUrl` / `email.ctaLabel`.

### Call sites wired

- **BidService** — `bid_received` (caster on submit), `bid_shortlisted`
  (artist on shortlist), `bid_rejected` (artist on reject),
  `bid_accepted` (artist on accept).
- **ContractService** — `contract_ready` (both on generate),
  `contract_signed_by_other` (the non-signer on partial sign),
  `contract_fully_signed` (both on full sign).
- **PaymentService** — `payment_held` (both on webhook
  `payment_intent.succeeded`), `payout_sent` (artist on release — combines
  payment_released + payout_sent semantics into one user-facing event since
  with Connect they're indistinguishable to the artist).
- **BookingService** — `booking_cancelled_by_caster` /
  `booking_cancelled_by_artist` (the OTHER party on cancel).
- **DisputeService** — `dispute_opened` (opposing party on raise),
  `dispute_resolved` (both on admin resolve).
- **ReviewService** — `review_received` (reviewee on submit).
- **MessageService** — `message_received` (recipient on send).
  Sender→recipient resolution uses a new `resolveRecipientUserId(thread, senderUserId)`
  helper (joins thread participants to user rows).

### Not wired (deferred to follow-ups)

- `artist_approved` / `artist_rejected` — admin approval flow uses
  `AdminLog`; add to `ArtistService.approveApplication` / `rejectApplication`
  in a follow-up alongside the artist-approved welcome email.
- `bid_expired` — bid expiry happens in bulk during `acceptBid` /
  `JobService.cancelJob`; notifying every expired-bid author would be a big
  send. Probably handled by a digest in the future.
- `job_matching_posted` / `job_expiring_soon` / `job_expired` — these need a
  matching engine + cron, out of MVP.
- `payment_failed` — webhook `payment_intent.payment_failed` currently
  console.errors only; needs a caster-facing follow-up.

## PDF contract generation

`apps/api/src/templates/contract-pdf.ts` renders the binding contract using
`@react-pdf/renderer` (no JSX — `React.createElement` directly so apps/api
doesn't need a JSX runtime).

- Layout: header → parties → job → payment terms → signatures (caster +
  artist signature strings, dates) → footer.
- Server-side render via `pdf(doc).toBuffer()` drained into a Node `Buffer`.
- `ContractService.persistPdf(contractId)` is the new entry point: renders,
  uploads to the `contracts` R2 bucket with key
  `contracts/${bookingId}/${contractId}.pdf`, stores `pdfUrl = s3://<bucket>/<key>`
  on the Contract row. Idempotent: returns existing `pdfUrl` if already set.
- Triggered fire-and-forget inside `ContractService.sign` when both parties
  signed; errors are logged so a slow/failed render doesn't block the
  signing response. **Caveat:** if the render fails after fully_signed,
  there's no automatic retry — admin (or a future cron) re-invokes
  `persistPdf`. Bookmark for hardening.

### Deps added

- `react@^18` and `@types/react@^18` as `apps/api` devDeps so `@react-pdf/renderer`'s
  peer is resolvable and `createElement` typechecks.

### Open follow-ups

- **Private contracts bucket needs a presigned-read endpoint** — `pdfUrl` is
  stored as `s3://<bucket>/<key>` to make it obvious the bucket is private.
  Add `GET /api/v1/contracts/:bookingId/pdf` that generates a short-lived
  signed URL and 302s to it. (Backend is plug-and-play; frontend page not
  built yet either.)
- **`react@18` vs `react@19`** — the rest of the workspace is on React 19
  (web app). We pinned the api template to 18 because `@react-pdf/renderer`
  only declares peer compatibility through 18. When react-pdf supports 19,
  align.

## Money flows: split, cancellation fee, dispute payouts, strikes

Closes the money story so dispute resolutions and late cancellations actually
move Stripe funds. Typecheck, lint, prettier, and 11/11 tests still green.

### `PaymentService.partialRelease(bookingId, capturePct, opts)`

- `capturePct ∈ (0, 100)` — captures that fraction of the gross authorization
  from Stripe (remainder auto-releases back to the caster's card), then
  creates a Transfer of the commission-adjusted net to the artist's Connect
  account. Idempotency key `partial-transfer-${paymentId}-${capturePct}`.
- `escrowStatus → 'partially_refunded'`, `Booking.status → 'cancelled'`,
  `stripeTransferId` persisted. When `opts.resolution === 'cancellation_fee'`,
  also records `Payment.cancellationFeeAmount`.
- Same Connect gate as `releaseEscrow` — throws `PAYOUT_NOT_READY` if the
  artist hasn't completed onboarding.

### `BookingService.cancel` — late-cancel fee + strikes

- `under_48h` tier now calls `partialRelease(50, { resolution: 'cancellation_fee' })`
  instead of full refund. Both artist-cancels and caster-cancels late get
  the 50/50 split per PRD §10.6.
- **Fallback** if the artist isn't Connect-ready: catches `PAYOUT_NOT_READY`,
  falls back to `refundEscrow` (full refund) + persists
  `Payment.cancellationFeeAmount` so admin can settle the fee manually.
  Logged as `late-cancel fee fallback: artist not Connect-ready`.
- **Strike system**: artist-initiated `under_48h` cancels now increment
  `ArtistProfile.strikeCount` (`{ increment: 1 }`). 3-strike admin review
  alert is still a future cron — counter is accurate, surface is not.

### `DisputeService.adminResolve` — money actually moves

Dispatch table after the resolution + admin-log transaction commits:

| Resolution                  | PaymentService call               |
|-----------------------------|------------------------------------|
| `full_release_to_artist`    | `releaseEscrow({ actor: 'auto' })` |
| `full_refund_to_caster`     | `refundEscrow(reason)`             |
| `split`                     | `partialRelease(splitArtistPct, { resolution: 'split' })` |
| `escalated`                 | (no money movement — frozen)       |

Money movement runs **outside** the resolution transaction (Stripe calls are
slow and shouldn't hold a DB transaction open). The payment helpers are all
idempotent on `escrowStatus`, so admin can safely re-invoke `adminResolve`
if a mid-flight Stripe call fails (the dispute row stays `resolved` but the
payment helper picks up where it left off). Failures are logged + rethrown.

If the booking never had escrow held (`payment` row absent), money movement
is skipped entirely.

### Open items still on the list

- 3-strike auto admin-review alert (notify admin + auto-suspend per PRD §13.4)
- Frivolous-dispute auto-alert (3 lost disputes → admin pinged, PRD §13.5)
- Critical-field-change bidder notifications (caster edits shoot date →
  notify all bidders, PRD §10.3)
- Job auto-expiry reminders (14-day no-activity email, PRD §10.4)
- Job invites flow (`JobInvite` model exists, no service/routes)
- Bid edit while pending + reject-undo within 24h (PRD §10.5)
- Contact-detail redaction in messages (PRD §10.10)
- Admin force-release / refund / remove-job endpoints (PRD §6.4–6.5)
- Daily-digest matching-job notifications (PRD §14 artist)

## Job invites (direct invite flow)

End-to-end caster→artist invite + invite-only visibility gating. Typecheck,
lint, prettier, and 11/11 tests still green.

### Schema

No schema change — `JobInvite` model + `InviteStatus` enum + `JobVisibility`
enum were already wired (just unused). The flow uses them as-is.

### Validators

- `packages/validators/src/invite.ts` exports `inviteArtistSchema`
  (`artistId: uuid, message?: string`).

### Service — `JobInviteService`

- `invite(userId, jobId, input)` — caster creates an invite. Checks job is
  active + not expired + not full + caster owns it. Artist must be
  `approved`. Idempotent guard: rejects duplicate
  `(jobId, artistId)` invites regardless of status. Fires
  `invite_received` notification to the artist.
- `listForArtist(userId, { status?, cursor?, limit? })` — paginated; same
  cursor pattern as the rest of the codebase.
- `getForArtist(userId, inviteId)` — bundled invite + full job detail.
  This is how an artist views an `invite_only` job (those don't appear in
  `JobService.listPublic`).
- `accept(userId, inviteId)` / `decline(userId, inviteId)` → notifies caster
  with `invite_accepted` / `invite_declined`.

### Routes — new `inviteRoutes` mounted at `/api/v1/invites`

- `POST /jobs/:jobId` (caster) — create invite.
- `GET  /me/list` (artist) — list own invites; supports
  `?status=pending|accepted|declined&cursor&limit`.
- `GET  /:id` (artist) — invite + full job detail.
- `POST /:id/accept` (artist) — accept.
- `POST /:id/decline` (artist) — decline.

### Invite-only visibility enforcement

`BidService.submitBid` now also checks `job.visibility`. If `invite_only`,
the artist must have a `status: 'accepted'` JobInvite for that job. Throws
`FORBIDDEN` otherwise. Combined with the existing `JobService.getPublicDetail`
filter (`visibility: 'public'`), invite-only jobs are now fully gated.

### NotificationService additions

`CastflowNotificationType` extended with `invite_received`,
`invite_accepted`, `invite_declined`.

### Workspace dependency churn (during this slice)

To make PDF contracts work alongside the rest of the workspace:

- Upgraded `@react-pdf/renderer` from `3.4.x` to `^4.5.1` — v4 supports
  `react@19` peer, v3 capped at react@18.
- Switched `apps/api` to react@19 + @types/react@19 (was 18) to match the
  rest of the workspace (`apps/web` is on 19). Otherwise `bun test` pulled
  in `react-dom@18.3.1` transitively and crashed with
  `ReactSharedInternals.ReactCurrentDispatcher` undefined (renamed in 19).
- Added `react-dom@^19` + `@types/react-dom@^19` as `apps/api` devDeps to
  pin the resolver onto 19 explicitly (the radix/react-pdf peer ranges
  otherwise let 18.x bleed back into the bun resolution cache).

### Not in this slice (still open)

- Reject-undo-within-24h on bids (PRD §10.5)
- Bid edit while pending (PRD §10.5)
- Critical-field-change bidder notifications (PRD §10.3)
- 3-strike auto admin-review + frivolous-dispute auto-alert
- Contact-detail redaction in messages
- Job auto-expiry reminders + daily-digest matching emails
- Welcome / artist_approved / artist_rejected emails

## Admin power tools (PRD §6.4–6.5)

Admin can now force-move money and force-remove jobs from the admin panel.
Typecheck, lint, prettier, and 11/11 tests still green.

### Force-release / force-refund escrow

- `PaymentService.releaseEscrow` accepts a new `actor: 'admin'` (alongside
  `'caster' | 'auto'`). All existing gating (held → released; Connect-ready
  artist) still applies — admin can't conjure money, just bypass the caster's
  confirmation step.
- `POST /api/v1/admin/payments/bookings/:bookingId/release` calls
  `releaseEscrow({ actor: 'admin' })` + writes an
  `AdminLog(action: 'force_release_escrow')` with the admin's notes.
- `POST /api/v1/admin/payments/bookings/:bookingId/refund` calls
  `refundEscrow(notes)` + writes `AdminLog(action: 'force_refund_escrow')`.
- Both routes require an `actionBodySchema` payload with `notes`
  (3–1000 chars). Admin must explain the action so the log is auditable.

### Force-remove job

- New `JobService.adminRemove(jobId, reason)` — flips `job.status → 'cancelled'`,
  expires pending/shortlisted bids inside a single transaction, then refunds
  any in-flight `escrowStatus: 'held'` payments on bookings spawned by this
  job (best-effort outside the transaction so a Stripe hiccup doesn't undo
  the cancellation). Refund errors are logged but don't stop the loop.
- `POST /api/v1/admin/jobs/:id/remove` (admin-only) with body
  `{ reason: string min(5) max(1000) }`. Writes
  `AdminLog(action: 'remove_job')`.

### Implementation notes

- All three power-tools require notes/reason from the admin so every action
  is auditable via `AdminLog`. The reason is also passed downstream as the
  `cancellationReason` / refund reason where applicable.
- `releaseEscrow({ actor: 'admin' })` still throws `PAYOUT_NOT_READY` if the
  artist hasn't completed Connect onboarding — admin can't ship a transfer
  to nowhere. UI should surface this and prompt admin to chase the artist.

## Backend polish batch (final pre-frontend pass)

Closes the remaining PRD-MVP backend gaps. Typecheck, lint, prettier, and
11/11 tests still green.

### Bid edit while pending (PRD §10.5)

- `BidService.updateBid(userId, bidId, input)` — partial update of
  `proposedRate / estimatedHours / coverNote / highlightedPortfolioItems`.
  Only callable by the bid owner; only while `status === 'pending'`.
  Re-enforces the hourly-job estimatedHours requirement.
- New validator export `UpdateBidInput` (already had the schema).
- Route: `PATCH /api/v1/bids/:id` (artist).

### Bid reject-undo within 24h (PRD §10.5)

- `BidService.undoReject(userId, bidId)` — caster restores a rejected bid to
  `pending` if `now - updatedAt < 24h` and the job is still active. Notifies
  the artist (reuses `bid_received` type).
- Route: `POST /api/v1/bids/:id/undo-reject` (caster).

### Critical-field-change bidder notifications (PRD §10.3)

- `JobService.updateJob` now diffs `shootDate / rateAmount / locationCity /
  applicationDeadline` against the pre-edit values. If any changed, fans a
  notification out to all bidders whose status is `pending` or `shortlisted`
  ("A job you bid on was updated — caster changed `<fields>`"). Uses
  `job_matching_posted` as the closest existing event type.

### Approve / reject + welcome notifications

- `ArtistService.approveApplication` now also fires `artist_approved` to the
  artist's user (CTA: dashboard).
- `ArtistService.rejectApplication` fires `artist_rejected` with the reason.
- New `ArtistService.sendWelcomeAfterVerification({ userId, email, role })`
  helper composes the right first-name lookup and calls
  `EmailService.sendWelcomeEmail`. Wired into Better Auth's
  `emailVerification.afterEmailVerification` hook in `lib/auth.ts` (lazily
  imports `ArtistService` to avoid a circular import at module load).
  Failures inside the hook are caught + logged so a Resend hiccup doesn't
  break Better Auth's verify response.

### 3-strike auto admin alert + frivolous-dispute alert (PRD §13.4–13.5)

- New `NotificationService.notifyAdmins({ type, title, body, … })` —
  fan-out helper that finds every `role: 'admin', status: 'active'` user and
  calls `notifyEvent` for each (with `/admin` as the default CTA).
- `BookingService.cancel`: on artist `under_48h` cancel, after incrementing
  `strikeCount`, if the new value is `>= 3` fires a `3-strike review`
  admin alert.
- `DisputeService.adminResolve`: after the resolution + money movement, if
  the outcome is `full_release_to_artist` (caster loses) or
  `full_refund_to_caster` (artist loses), counts the loser's lifetime losses
  with the same resolution. If `>= 3`, fires a
  `Frivolous-dispute pattern` admin alert. Splits and escalations don't
  count toward the streak.

### Contact-detail redaction (PRD §10.10)

- `MessageService.sendMessage` runs the body through `EMAIL_RE` + `PHONE_RE`
  before insert. Matches set `Message.isFlagged: true` for the admin
  moderation queue (`/api/v1/admin/flagged/messages` already paginates these).
  We **don't block** — false positives on prop/scene descriptions would be
  worse than the redaction itself. Repeat offenders get handled manually
  via the existing admin status flip.

### Auto-expiry reminders + matching-job digest (deferred)

These need a cron / scheduler that we don't yet have in MVP. Documented
here so it's not forgotten:

- 14-day-no-activity job reminder email → caster.
- Daily-digest of matching jobs → artist.
- 7-day pre-shoot reminder, 24h-pre-shoot reminder, etc.

Plumbing: each of these needs (a) a scheduler — Cloudflare Cron Triggers or
Railway-side bun script invoked on a cron, (b) a "last reminded at" column
on the relevant row so we don't double-fire. The notification helpers and
email templates are already in place; only the scheduler is missing.

## Next up

Backend hardening (HANDOFF.md §5) is now complete + polished:

1. ✅ Rate limiting + suspend-invalidates-session + upload key-ownership check
2. ✅ Remaining §4.1 security gaps (high + medium + low)
3. ✅ §4.2 optimizations
4. ✅ Stripe Connect + artist payouts
5. ✅ Notification + email event wiring
6. ✅ PDF contract generation
7. ✅ Dispute payout movement + cancellation-fee Stripe split + strike system
8. ✅ Job invites + invite-only visibility
9. ✅ Admin power tools (force-release / refund / remove-job)
10. ✅ Final polish (bid edit, reject-undo, critical-change notifications,
    approve/reject + welcome emails, 3-strike + frivolous-dispute alerts,
    message redaction)

**Backend is now feature-complete to PRD-MVP scope.** Only the cron-bound
items (auto-expiry reminders, matching-job digest) and the open Phase 2
items remain. Frontend work resumes from `/onboarding/*` per the original
feature list — see "Feature build order" near the top of this file.

## Phase 2 add-ons (vendor-free, backend-only)

Two PRD Phase 2 items shipped without needing a vendor account or frontend
work. Typecheck, lint, prettier, and 11/11 tests still green.

### Comp-card auto-generator

- `apps/api/src/templates/comp-card-pdf.ts` — print-friendly A4 comp-card
  template (header + stats column + bio/skills column + 6-photo portfolio
  grid + footer). Same `createElement` pattern as the contract PDF; no JSX
  runtime needed in apps/api.
- `ArtistService.generateCompCard(profileId): Promise<Buffer>` —
  approved-only gate; pulls model/actor stats + skills + first 6 approved
  photos (`isApproved: true, type: 'photo'`, ordered by `displayOrder`).
  Returns the raw PDF buffer rendered on demand (no R2 caching for MVP —
  stats change whenever the artist edits, and rendering is cheap).
- `GET /api/v1/artists/:id/comp-card` (public, no auth) — streams the PDF.
  `?download=1` flips `Content-Disposition` to `attachment`; default is
  inline so a browser preview "just works".

### Counter-offers on bids

- New `CounterOffer` Prisma model + `CounterOfferStatus` enum
  (`pending | accepted | declined | withdrawn`). `Bid.counterOffers` back
  relation. Pushed to alwaysdata.
- Validator `counterOfferSchema` (`proposedRate, estimatedHours?, message?`)
  exported from `@castflow/validators`.
- `BidService.proposeCounterOffer(userId, bidId, input)` — artist only,
  shortlisted bids only, single pending offer per bid. Notifies caster
  (`bid_received` reused).
- `BidService.acceptCounterOffer / declineCounterOffer(userId, counterOfferId)`
  — caster only. Accept overwrites `Bid.proposedRate` /
  `Bid.estimatedHours` with the counter's values inside a transaction;
  decline leaves the original bid intact. Notifies artist.
- Routes:
  - `POST /api/v1/bids/:id/counter` (artist)
  - `POST /api/v1/bids/counter/:counterId/accept` (caster)
  - `POST /api/v1/bids/counter/:counterId/decline` (caster)

### Scope / non-goals

- No multi-round negotiation chain — one pending counter per bid; if
  declined, artist can submit another (the previous one stays `declined`).
- Counter-offers don't bypass the `under_48h` shoot-window or any other
  bid timing gates; once a bid is accepted the booking is created from
  the (counter-)adjusted `proposedRate`.
- Comp-cards are public: anyone with the profile id can download. PRD
  treats them as marketing artefacts. If we later want to restrict to
  logged-in casters, gate the route — but that breaks the typical
  "share this comp-card" flow.

### Remaining Phase 2 items (still open)

- Portfolio watermarking (deferred — "CastFlow" isn't the final brand name,
  so hardcoding it into the watermark text would create rework)
- Multi-seat caster teams (needs design)
- Subscription tiers (needs Stripe Subscriptions wiring + product design)
- AI matching (needs design — rule-based vs embedding-based)
- Mobile app, background-check, DocuSign, Onfido (all blocked on vendor
  accounts or a different stack)

## Phase 2: Calendar ICS export

Per-user one-way calendar subscription. User pastes a URL into Apple /
Google / Outlook and their CastFlow shoots auto-sync.

### Schema

- `User.calendarToken String? @unique` — URL-safe random secret. Null
  until the first feed-URL fetch. Pushed via `prisma db push`.

### Service — `CalendarService`

- `ensureToken(userId)` — idempotent; lazily generates on first call so the
  feed URL stays stable across reloads.
- `regenerateToken(userId)` — rotates the token; old URL stops resolving
  immediately. Returns the new URL.
- `feedUrl(token)` — composes the public `/api/v1/calendar/feed/<token>.ics`.
- `buildFeed(token)` — finds the user by token, queries their `confirmed +
  completed` bookings, emits a spec-compliant ICS payload (CRLF, line
  folding, escape of `\ , ;` and newlines, UTC `DTSTAMP/DTSTART/DTEND`).
  Locations only appear on events with `contract.status === 'fully_signed'`
  — pre-signature events show "Location: revealed once both parties sign
  the contract" in the description so the shoot is visible in the
  calendar but the address stays hidden.
- Admin tokens fall through to an empty calendar (no 403 — calendar apps
  would unsubscribe on errors, and admins don't have personal shoots).

### Routes — `/api/v1/calendar`

- `GET /me` (auth) — returns `{ url }` with the active feed URL.
- `POST /me/regenerate` (auth) — rotates the token; returns the new URL.
- `GET /feed/:tokenFile` (public) — `:tokenFile` is `<token>.ics`. Strips
  the suffix, builds the feed, returns `text/calendar; charset=utf-8` with
  a `Cache-Control: private, max-age=600` so calendar apps refresh ~hourly.

### Implementation notes

- ICS standard requires CRLF (`\r\n`) line endings and folding of lines
  >75 octets with `CRLF + space`. The hand-rolled `foldLine` does that;
  no third-party dependency.
- Token is 40-char URL-safe base64 (`crypto.getRandomValues(40 bytes)`).
  At 40 random URL-safe chars (~6 bits each) the brute-force search space
  is ~10^72 — fine for a non-rotating secret in a public URL.
- The feed URL uses `env.BETTER_AUTH_URL` as the host (that's the API
  origin). When backend and frontend differ, this is correct — calendar
  apps need to hit the API, not the SPA.
- Events derive duration from `Job.shootDurationHours` (defaults to 4h if
  somehow missing). Start time prefers `Booking.callTime` over
  `Booking.shootDate` when set.
- Cancelled/disputed bookings are intentionally NOT in the feed — the
  calendar should reflect the user's actual commitments. They can still
  see the cancellation in the dashboard.

## Re-audit pass (post-new-features)

Targeted security + optimization scan over everything shipped since the
original HANDOFF.md §4 audit. Typecheck, lint, prettier, 11/11 tests still
green.

### Security fixes

- **Shoot-location leak in invite detail** — `JobInviteService.getForArtist`
  was returning `Job.shootLocationDetail` + `Job.callTime` to invited
  artists pre-booking. Both are now stripped to `null` unconditionally per
  the non-negotiable in the root CLAUDE.md ("shoot location hidden until
  contract fully_signed").
- **Calendar feed rate limit** — `GET /api/v1/calendar/feed/:tokenFile` was
  un-throttled. Added IP-based `rateLimit({ scope: 'calendar:feed',
  windowMs: 60_000, max: 60 })`. The 40-char URL-safe token is intractable
  to brute-force on its own, but this is defence-in-depth in case a token
  leaks through proxy/access logs.
- **Connect deauthorize webhook** — handled `account.application.deauthorized`
  via `PaymentService.clearConnectAccount(stripeAccountId)`. Clears
  `stripeAccountId` + `payoutsEnabled` so future
  `releaseEscrow` / `partialRelease` calls throw `PAYOUT_NOT_READY`
  instead of attempting a 401-bound transfer.

### Optimizations

- **`Dispute(resolution)` index** — `DisputeService.adminResolve` runs a
  lifetime-loss aggregate on every resolve to drive the frivolous-dispute
  alert. Added `@@index([resolution])` so that count short-circuits.
- **`notifyAdmins` dedup** — identical `(type, entityId)` admin alerts
  within a 1h window now fire once. In-process `Map` with lazy hourly
  sweep; single-instance MVP only — note to swap for Redis when we scale
  past one replica.

### Polish

- **`job_critical_change` notification type** — `JobService.updateJob` was
  using `job_matching_posted` as a workaround for the critical-field
  change fan-out. Added a proper `job_critical_change` type to
  `CastflowNotificationType` and switched the call site to it.

### Re-audit follow-ups (still open)

- **Comp-card route is fully public** — anyone with a profile ID can pull
  the PDF. Intentional ("marketing artefact" per PRD), but acknowledged
  as a conscious decision rather than an oversight. If we later want
  caster-only, gate the route.
- **JobService.updateJob fan-out for critical changes** — serial-ish
  notification dispatch per bidder. Fine at MVP scale; needs batching if a
  job ever has hundreds of bidders.
- **Comp-card / calendar caching** — neither caches its rendered output.
  Comp-card by `(profileId, updatedAt)` and calendar by `(token,
  bookings_max_updated_at)` would be cheap wins later.

## Next up

Backend hardening (HANDOFF.md §5) continues:

1. ✅ Rate limiting + suspend-invalidates-session + upload key-ownership check
2. ✅ Remaining §4.1 security gaps (high + medium + low)
3. ✅ §4.2 optimizations
4. ✅ Stripe Connect + artist payouts
5. ✅ Notification + email event wiring
6. ✅ PDF contract generation
7. ✅ Dispute payout movement + cancellation-fee Stripe split + strike system
8. ✅ Job invites + invite-only visibility

Remaining open items above. The biggest user-visible gaps are admin tools
(force-release, force-refund, remove-job) and the bid edit / reject-undo
flow. After that, frontend resumes.

Then return to frontend.

Feature 01 (Auth) complete. **Feature #2 (Artist Onboarding)** is the next
frontend slice once the backend punch list lands — spec at
`docs/features/02-artist-onboarding.md` (to be written first using
`docs/features/README.md` as the template; copy `01-auth.md` as scaffold).

### Feature build order

See `docs/features/README.md` for the full table with status. Suggested order, each a complete vertical slice:

1. ✅ **Auth flows** — register (artist + caster), login, email verify, social login. **Spec: `docs/features/01-auth.md`**
2. **Artist onboarding** — personal info, stats, portfolio upload, ID doc, submit for review (← next)
3. Admin: artist application queue — approve and reject with reason
4. Caster: post a job — full 6-step wizard, both payment types
5. Artist: job feed — browse, filter, view job detail
6. Artist: submit a bid — propose rate, cover note, highlight portfolio
7. Caster: bid management — view bids, shortlist, reject, accept
8. Booking flow — booking created, escrow payment via Stripe
9. Contract — generate, display, e-sign both parties
10. Post-shoot — confirm completion, escrow release to artist
11. Reviews — both directions
12. Disputes — raise, submit sides, admin resolves
13. Messaging — in-platform chat, WebSocket real-time
14. Notifications — email triggers for all key events
15. Admin: full dashboard — users, jobs, payments, disputes, analytics

### When starting each feature

- Read `CONTEXT.md` and the relevant `CLAUDE.md` files first
- Then read `docs/features/NN-<name>.md` — if it doesn't exist yet, write it first using `docs/features/README.md` as the template (copy 01-auth.md as scaffold)
- **TDD:** write failing tests in the order listed in §7 Test plan of the feature doc, then implement. Red → Green → Refactor.
- Build the service method first, then the route, then the UI
- Write to CONTEXT.md at the end of every session

### Test infrastructure (added post-Phase 6)

- **API:** `bun test` (native, no extra deps). Smoke covers `/health` + canonical 404. Run via `bun --filter @castflow/api test` or `bun run test` at root.
- **Web:** Vitest 4 + React Testing Library + jsdom. Setup file `apps/web/vitest.setup.ts`. Run via `bun --filter web test`.
- **E2E:** Playwright at the repo root (`tests/e2e/`). Smoke covers homepage, login, auth-guard redirect. Run via `bun run test:e2e` against locally-running stack (no auto webServer block yet — see caveats).
- **Turbo:** `test` task wired into `turbo.json`; root `bun run test` runs API + web in parallel with cache.
- Coverage target: 80% per file (per common rules), enforced by the feature acceptance checklists.

Open follow-ups (carried over from Phase 5; not blockers for feature work):

- Provision a shadow DB on alwaysdata and convert the current `db push` schema into a real `prisma migrate dev --name init` migration history before any production work.
- Replace the `ScaffoldPlaceholder` history (it never persisted to the DB — only the placeholder `schema.prisma` referenced it) once the migration history is bootstrapped.
- Decide whether to keep `apps/web/tsconfig.json`'s `exactOptionalPropertyTypes: false` long-term, or to patch the offending shadcn components (`dropdown-menu.tsx`, `sonner.tsx`) to satisfy the strict setting.
- Revisit `apps/web/lib/auth-server.ts`'s `as never` / hand-rolled session shape once Better Auth's actual `getSession` payload is locked in by the auth phase — and consider replacing the literal-only role/status unions with a runtime guard so the typed shape is enforced, not just declared.
