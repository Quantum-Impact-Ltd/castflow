# CastFlow — Implementation Context

> This file is updated at the end of every Claude Code session.
> Always read this before starting any work on this repo.

---

## Current phase

**Phase 2 — Shared packages**

---

## Phase completion status

| Phase | Description                                                              | Status         |
| ----- | ------------------------------------------------------------------------ | -------------- |
| 1     | Monorepo foundation — folder structure, Turborepo, configs, linting      | ✅ Complete    |
| 2     | Shared packages — @castflow/types and @castflow/validators               | ⬜ Not started |
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

---

## Known caveats and decisions

_Populated as implementation progresses. Examples of what goes here:_

- _"Used X instead of Y because of Z"_
- _"Deferred feature X to later — see note"_
- _"Found issue with package X — workaround is Y"_
- _"Environment variable X needs to be set manually before Phase 4"_

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

---

## Next up

Run Phase 2 prompt — shared packages.
