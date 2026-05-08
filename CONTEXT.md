# CastFlow — Implementation Context

> This file is updated at the end of every Claude Code session.
> Always read this before starting any work on this repo.

---

## Current phase

**Phase 4 — Prisma schema**

---

## Phase completion status

| Phase | Description                                                              | Status         |
| ----- | ------------------------------------------------------------------------ | -------------- |
| 1     | Monorepo foundation — folder structure, Turborepo, configs, linting      | ✅ Complete    |
| 2     | Shared packages — @castflow/types and @castflow/validators               | ✅ Complete    |
| 3     | API scaffold — folder structure, env, lib singletons, errors, middleware | ✅ Complete    |
| 4     | Prisma schema — full DB schema, first migration                          | ⬜ Not started |
| 5     | Frontend scaffold — Next.js, folder structure, providers, lib            | ⬜ Not started |
| 6     | Verification — both apps run, typecheck passes, health check responds    | ⬜ Not started |

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

---

## Environment variables outstanding

These need to be filled in manually before certain phases will work:

| Variable                | Needed for                 | Set? |
| ----------------------- | -------------------------- | ---- |
| `DATABASE_URL`          | Phase 4 (Prisma migration) | ⬜ (placeholder in `.env`)   |
| `BETTER_AUTH_SECRET`    | Phase 6 (auth)             | ⬜ (placeholder in `.env`)   |
| `STRIPE_SECRET_KEY`     | Payment features           | ⬜ (placeholder in `.env`)   |
| `STRIPE_WEBHOOK_SECRET` | Webhook handler            | ⬜ (placeholder in `.env`)   |
| `R2_ACCOUNT_ID`         | File uploads               | ⬜ (placeholder in `.env`)   |
| `R2_ACCESS_KEY_ID`      | File uploads               | ⬜ (placeholder in `.env`)   |
| `R2_SECRET_ACCESS_KEY`  | File uploads               | ⬜ (placeholder in `.env`)   |
| `RESEND_API_KEY`        | Emails                     | ⬜ (placeholder in `.env`)   |
| `GOOGLE_CLIENT_ID`      | Social login               | ⬜   |
| `APPLE_CLIENT_ID`       | Social login               | ⬜   |

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

---

## Next up

Run Phase 4 prompt — Prisma schema and first migration. The placeholder `prisma/schema.prisma` will be replaced entirely with the canonical schema documented in `apps/api/prisma/CLAUDE.md`.
