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

---

## Environment variables outstanding

These need to be filled in manually before certain phases will work:

| Variable                | Needed for                                              | Set?                                 |
| ----------------------- | ------------------------------------------------------- | ------------------------------------ |
| `DATABASE_URL`          | Phase 4 (Prisma migration)                              | ✅ Set (alwaysdata Postgres)         |
| `SHADOW_DATABASE_URL`   | `prisma migrate dev` (Phase 4 workaround — see caveats) | ⬜ (not set; `db push` used instead) |
| `BETTER_AUTH_SECRET`    | Phase 6 (auth)                                          | ⬜ (placeholder in `.env`)           |
| `STRIPE_SECRET_KEY`     | Payment features                                        | ⬜ (placeholder in `.env`)           |
| `STRIPE_WEBHOOK_SECRET` | Webhook handler                                         | ⬜ (placeholder in `.env`)           |
| `R2_ACCOUNT_ID`         | File uploads                                            | ⬜ (placeholder in `.env`)           |
| `R2_ACCESS_KEY_ID`      | File uploads                                            | ⬜ (placeholder in `.env`)           |
| `R2_SECRET_ACCESS_KEY`  | File uploads                                            | ⬜ (placeholder in `.env`)           |
| `RESEND_API_KEY`        | Emails                                                  | ⬜ (placeholder in `.env`)           |
| `GOOGLE_CLIENT_ID`      | Social login                                            | ⬜                                   |
| `APPLE_CLIENT_ID`       | Social login                                            | ⬜                                   |

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

---

## Next up

Foundation complete. Ready for feature development.

Suggested build order (each one is a complete vertical slice):

1. Auth flows — register (artist + caster), login, email verify, social login
2. Artist onboarding — personal info, stats, portfolio upload, ID doc, submit for review
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

When starting each feature:

- Read CLAUDE.md and CONTEXT.md first
- Build the service method first, then the route, then the UI
- Write to CONTEXT.md at the end of every session

Open follow-ups (carried over from Phase 5; not blockers for feature work):

- Provision a shadow DB on alwaysdata and convert the current `db push` schema into a real `prisma migrate dev --name init` migration history before any production work.
- Replace the `ScaffoldPlaceholder` history (it never persisted to the DB — only the placeholder `schema.prisma` referenced it) once the migration history is bootstrapped.
- Decide whether to keep `apps/web/tsconfig.json`'s `exactOptionalPropertyTypes: false` long-term, or to patch the offending shadcn components (`dropdown-menu.tsx`, `sonner.tsx`) to satisfy the strict setting.
- Revisit `apps/web/lib/auth-server.ts`'s `as never` / hand-rolled session shape once Better Auth's actual `getSession` payload is locked in by the auth phase — and consider replacing the literal-only role/status unions with a runtime guard so the typed shape is enforced, not just declared.
