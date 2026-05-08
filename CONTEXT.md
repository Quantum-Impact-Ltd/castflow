# CastFlow — Implementation Context

> This file is updated at the end of every Claude Code session.
> Always read this before starting any work on this repo.

---

## Current phase

**Phase 3 — API scaffold**

---

## Phase completion status

| Phase | Description                                                              | Status         |
| ----- | ------------------------------------------------------------------------ | -------------- |
| 1     | Monorepo foundation — folder structure, Turborepo, configs, linting      | ✅ Complete    |
| 2     | Shared packages — @castflow/types and @castflow/validators               | ✅ Complete    |
| 3     | API scaffold — folder structure, env, lib singletons, errors, middleware | ⬜ Not started |
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
- `bun install` run successfully (132 packages)
- `@castflow/types` — all TypeScript interfaces, enums, and API response types (`enums.ts`, `entities.ts`, `api.ts`)
- `@castflow/validators` — all Zod schemas: auth, artist, job, bid, booking, review, upload

---

## Known caveats and decisions

- **`turbo.json`: `pipeline` → `tasks`** — Turbo 2.x renamed the field; the Phase 1 spec used the old name. Updated in Phase 2 when typecheck failed.
- **`packageManager`: pinned to `bun@1.3.11`** — Turbo 2.x rejects `bun@latest`; requires a strict semver pin. The Phase 1 spec used `bun@latest`.
- **`zod` pinned to `^3.23.0`** per spec — note that zod v4 exists but our schemas target v3 API (`.refine` with object-shape options, etc.).
- **`updateBidSchema` exports**: only `submitBidSchema`/`updateBidSchema` named values exported; `UpdateBidInput` type is not yet used and not exported. Add the inferred type when the bid edit endpoint is built.
- **`ageMin/ageMax` validation in `createJobSchema`**: the spec sets `min(18)` for both, but the existing `Job` interface allows age ranges starting from 18 — the validator's lower bound (18) is the canonical one for casting purposes (no minors).

---

## Environment variables outstanding

These need to be filled in manually before certain phases will work:

| Variable                | Needed for                 | Set? |
| ----------------------- | -------------------------- | ---- |
| `DATABASE_URL`          | Phase 4 (Prisma migration) | ⬜   |
| `BETTER_AUTH_SECRET`    | Phase 6 (auth)             | ⬜   |
| `STRIPE_SECRET_KEY`     | Payment features           | ⬜   |
| `STRIPE_WEBHOOK_SECRET` | Webhook handler            | ⬜   |
| `R2_ACCOUNT_ID`         | File uploads               | ⬜   |
| `R2_ACCESS_KEY_ID`      | File uploads               | ⬜   |
| `R2_SECRET_ACCESS_KEY`  | File uploads               | ⬜   |
| `RESEND_API_KEY`        | Emails                     | ⬜   |
| `GOOGLE_CLIENT_ID`      | Social login               | ⬜   |
| `APPLE_CLIENT_ID`       | Social login               | ⬜   |

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

---

## Next up

Run Phase 3 prompt — API scaffold.
