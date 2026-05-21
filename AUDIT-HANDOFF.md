# CastFlow Audit Remediation — Session Handoff

> **For a fresh Claude session.** This brief is self-contained. Read it
> top-to-bottom, then start working. Do **not** re-audit — the findings are
> already in `AUDIT.md`. Your job is execution.
>
> Distinct from `HANDOFF.md` at repo root, which covers the backend test pass.

---

## What is this?

A multi-session remediation pass against `AUDIT.md`. The audit identified **7 Critical, 17 High, 23 Medium, 18 Low** issues across the public marketing pages, auth flows, and onboarding flows. All 7 Criticals are done. You're picking up the High → Medium → Low queue.

---

## Step 1 — Read in this order before touching code

1. **`AUDIT.md`** (repo root) — every issue, status, file:line, suggested fix. The fix log at the bottom shows what's already done.
2. **`CONTEXT.md`** (repo root) — current implementation state. The "Audit remediation (2026-05-21)" section summarises what's shipped.
3. **`CLAUDE.md`** (repo root) — non-negotiable business rules and the file-map. Read the area-specific CLAUDE.md for whatever you're touching:
   - API work: `apps/api/CLAUDE.md` (+ `apps/api/prisma/CLAUDE.md` if schema-adjacent)
   - Frontend work: `apps/web/CLAUDE.md`
   - Shared packages: `packages/CLAUDE.md`

If you skip these you will violate architectural rules. Don't skip.

---

## Step 2 — Working pattern

Follow this exactly. The Criticals session set the precedent and every commit on `main` from `11e45c0` onward follows it.

### One issue, one commit

- Branch: stay on `main` (the team prefers small atomic commits over PR branches for this work).
- Stage **only** the files for the issue you're fixing. Never `git add -A`. Many other unrelated files are dirty in the working tree — leave them alone.
- Commit subject: `fix(area): <ID> — <short outcome>` e.g. `fix(web): H7 — add generateMetadata to /artists/[id]`.
- Commit body: 2-4 lines on *why*, not what. End with the audit ID list (e.g. "Closes AUDIT H7, M11.").
- Co-author: **don't** add a Claude co-author line — user has `feedback_git_author` memory disabling this.
- Never `--no-verify`, never amend a pushed commit.

### Verification gates per fix

Before every commit:

```bash
bun run typecheck       # all 4 workspaces must pass
```

Lint is currently **dirty** in `apps/web/app/artists/[id]/artist-profile-view.tsx` (8 pre-existing errors on model-stats template literals — flagged in CONTEXT.md). Don't try to "fix" them unless you're tackling H11 (which touches that file). If you add new lint errors, fix them before committing.

### Update three places per fix

1. **AUDIT.md** — flip `[ ]` → `[x]` on the row. Add an entry to the bottom **Fix log** table: `| 2026-MM-DD | <ID> | <commit-hash> | one-line summary |`
2. **The commit message** — include audit ID(s)
3. **Tasks** — `TaskUpdate` status → `in_progress` before, `completed` after

If you batch (e.g. closing H12+M21+L14 in one commit), list every ID.

### Don't ship secrets or invent values

- Pinned package versions only — never `latest`
- New env vars: add to `apps/api/src/lib/env.ts` with a sensible default, document in CONTEXT.md, mention to user
- Never hardcode the `<base url>` for OG images, contact recipient, etc. — env-var or config

---

## Step 3 — Order of attack

Tackle the **High** queue first. Within High, batch quick wins (≤15 min each, one commit per ID) then move to mediums (≤1hr) and heavies. Then move to Medium and Low. Use the order below as a default — re-order only if you spot a hard dependency.

### High — quick wins (do these first, one commit per item)

| ID | File | One-line fix |
| --- | ---- | ------------ |
| H3 | `apps/web/lib/hooks/use-auth.ts:68-73` | Drop `onError` toast on `useForgotPassword` — the form's `onSettled` already shows the success card; toast contradicts it |
| H4 | `apps/web/app/verify-email/verify-email-client.tsx:42-52` | Wire react-hook-form + Zod email schema (or just `z.string().email().safeParse(email)` before mutation) |
| H7 | `apps/web/app/artists/[id]/page.tsx` | Add `generateMetadata({ params })` returning per-artist title/description/OG |
| H8 | new files | `apps/web/app/sitemap.ts`, `apps/web/app/robots.ts`, add `metadataBase` + `openGraph` to root `layout.tsx` |
| H9 | `apps/web/app/artists/[id]/artist-profile-view.tsx:170-171` | `rel="noreferrer"` → `rel="noopener noreferrer"`. Check `app/privacy/page.tsx:271-273` (ICO link) same fix |
| H10 | `apps/web/app/suspended/page.tsx` | Add `auth.api.getSession` check; redirect users whose `status !== 'suspended' && status !== 'banned'` to `/` |
| H13 | `apps/web/lib/query-keys.ts` + `lib/hooks/use-artist.ts:24` + `lib/hooks/use-uploads.ts:7` | Add `queryKeys.artist.profile()` factory, replace both inline `['artist','me']` with it |
| H16 | `apps/web/app/onboarding/pending/page.tsx:80-82`, `components/onboarding/steps/step-review.tsx:239` | Rephrase hardcoded "48 hours" to "usually within 48 hours" (or make config-driven later) |

### High — medium effort (one commit each, may touch a few files)

| ID | Notes |
| --- | --- |
| H1 | `apps/api/src/services/AuthService.ts:61-76` — currently throws `EMAIL_TAKEN` 409. Change `assertEmailAvailable` to return a flag; in `registerArtist`/`registerCaster` short-circuit to fake-success when email already exists, send "someone tried to sign up with your email" via `EmailService` (new template). Test plan: 1) duplicate registration returns the same shape as a fresh signup, 2) target email receives the warning. |
| H11 | `apps/web/app/shoots/[id]/shoot-detail-view.tsx:53-54`, `apps/web/app/artists/[id]/artist-profile-view.tsx:36` — replace `const isAuthed = false` constants with `authClient.useSession()`. Both files are already `'use client'`. Wire the branches that already exist. |
| H14 | `apps/web/components/onboarding/steps/step-identity.tsx:61-82` — after upload, render `<img src={profile.idDocumentUrl}>` for `image/*` content type, or `<a href={...}>View document</a>` for PDFs. Add a "Replace" button. |
| H15 | `apps/web/app/onboarding/pending/page.tsx:21-25` + `apps/web/app/onboarding/artist/page.tsx` — when `profile.approvalStatus === 'rejected'`, render a banner with `profile.approvalNotes` and a "Once you've fixed this, resubmit" CTA. Don't silently redirect. |
| H17 | `apps/web/components/onboarding/steps/step-caster-welcome.tsx:31-35` — gate the action cards on `complete.isSuccess`; show a small loader until then. The mutation fires-and-forgets on mount today, which leaves a race if the user navigates before it resolves. |

### High — heavier (single-purpose commits or short stack)

| ID | Notes |
| --- | --- |
| H2 | `apps/api/src/index.ts:35` — replace `logger()` with a customised logger that scrubs `/verify-email/<token>` and `/reset-password/<token>` paths. Hono's `logger` accepts a `fn` argument. Don't write your own from scratch — use the built-in's API. |
| H6 | `<img>` → `next/image` migration. Files: `talent-content.tsx:218,286,447`, `shoots-content.tsx:208,425`, `shoot-detail-view.tsx:113`, `casters/page.tsx:276`, `artists/page.tsx:386`, `artists/[id]/artist-profile-view.tsx:278,286,334,340`, `featured-artists.tsx:157`, `live-shoots.tsx:117,179`, `register/page.tsx:121,87`. Use `fill` with parent `relative` for grid cards, explicit `width`/`height` for portraits. Verify `next.config.ts` already allowlists `images.unsplash.com` (it does). Split into 2–3 commits by surface so each is reviewable. |
| H5 | Cloudflare Turnstile recommended (free, privacy-respecting, simpler than hCaptcha). Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` env vars. Add Turnstile widget on both register forms always, on login after 3 failed attempts (server tracks per-IP failed-attempt counter — use the existing `rateLimit` bucket infrastructure). Server middleware verifies the token via Cloudflare's `siteverify` endpoint before passing to Better Auth. **Do NOT ship without an env-var-driven feature flag** so it can be disabled in dev. |

---

## Step 4 — When you finish all the Highs

1. Update `CONTEXT.md`'s "Audit remediation" section with the High batch summary (mirror the Critical batch format).
2. Move to **Medium** queue (M1–M23 in AUDIT.md). Same working pattern.
3. Then **Low** (L1–L18).
4. When all rows are `[x]`, archive `AUDIT.md` (rename to `audit/2026-05-frontend-audit.md`) and write a short final-status note in `CONTEXT.md`.

---

## Step 5 — Things that will trip you up

- **Don't `git add -A`.** Many unstaged files in the working tree are part of the user's parallel feature work (see `git status` at session start). Only stage what you edit.
- **`redirect()` in Next.js throws.** Don't put `redirect()` calls inside `try/catch` blocks unless you re-throw the thrown navigation signal — see commit `ffda4e7` (C3) for the pattern.
- **Better Auth's enumeration protection.** Don't naively call `signUpEmail` on duplicate emails — `AuthService.assertEmailAvailable` pre-checks. See the H1 notes above.
- **Shared validators are the source of truth.** When adding a schema (like the C6 contact form), put it in `packages/validators/src/<name>.ts` and re-export from `packages/validators/src/index.ts`. Never duplicate in apps.
- **`'use client'` boundaries.** A component imported by a Server Component that adds `'use client'` makes everything below it a client subtree. Be deliberate.
- **TypeScript strict project.** `exactOptionalPropertyTypes` is on at the root tsconfig. When passing optional props, spread conditionally: `{...(condition ? { prop: value } : {})}`. See `shoot-detail-view.tsx` for the pattern after C4.
- **Tokens in URL paths.** Until H2 ships, do not invent new token-in-URL patterns. POST tokens in bodies.
- **API base URL.** Frontend fetcher prepends `/api/v1`. Better Auth lives at `/api/auth/*` — outside `/api/v1` — use `betterAuthRequest` from `lib/api/auth.ts` for those.

---

## Step 6 — Commands you'll run constantly

```bash
# From repo root
bun run typecheck                    # all 4 workspaces
bun run lint                         # 8 pre-existing errors in artist-profile-view.tsx — ignore unless touching that file

# Per-workspace
cd apps/api && bun run typecheck
cd apps/web && bun run typecheck

# Tests (where they exist)
cd apps/api && bun test
cd packages/validators && bun test
cd apps/web && bun run test          # vitest

# Dev servers
cd apps/api && bun run dev           # port 3001
cd apps/web && bun run dev           # port 3000
```

---

## Step 7 — Status snapshot when you sit down

Run this to confirm where you are:

```bash
cd /home/tabish/Desktop/castflow
git log --oneline -15                         # see what's been done
grep -c "\[x\]" AUDIT.md                      # count fixed rows
grep "| H" AUDIT.md | grep -c "\[ \]"         # count remaining High rows
```

The Criticals chain ends at commit `e38c674`. Anything after that is High remediation work.

---

## Reference

- Audit-finding doc: `AUDIT.md`
- Project context: `CONTEXT.md`
- Architectural rules: `CLAUDE.md` (root) + area-specific files
- Critical fixes for reference: commits `11e45c0`, `ce53298`, `ffda4e7`, `1cb9a55`, `7b8735c`, `d9bc603`, `a551533`
- New env var added during Critical pass: `CONTACT_INBOX_EMAIL` (defaults to `hello@castflow.co.uk`)

Good luck. Move fast on quick wins; slow down for H1, H5, H6.
