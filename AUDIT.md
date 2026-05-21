# CastFlow — Frontend Audit (Public, Auth & Onboarding)

> Audit scope: all non-dashboard user-facing pages — public marketing, authentication, account recovery, and onboarding flows. Dashboards excluded (not finalized).
> Last updated: 2026-05-21

---

## Status legend

- `[ ]` Open
- `[~]` In progress
- `[x]` Fixed (commit referenced)
- `[!]` Won't fix / deferred (with reason)

---

## Executive summary

Architecture is sound: shared validators across client/server, httpOnly cookies for sessions, role-routing via layout guards, multi-step onboarding with server-side resume state. Three categories hold this back from production:

1. **Two real correctness bugs in gating layers** (C1 verify-email prefetch, C3 caster gate fail-open) that silently misbehave with no test coverage.
2. **Token-handling pattern** (verify + reset tokens in URL paths consumed by SSR GETs) that has burned other startups.
3. **Pervasive "ship the whole page as JS" pattern** + raw `<img>` tags that hurt LCP on conversion-critical pages.

Counts: **7 Critical, 17 High, 23 Medium, 18 Low**.

---

## Critical (fix before next deploy)

| ID  | Status | Issue                                                                           | Location                                                | Fix                                                                                |
| --- | ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| C1  | [x]    | Verify-email token consumed by SSR GET on prefetch / email-scanner link warming | `app/verify-email/[token]/page.tsx:13-26`               | Require user gesture: render confirm button that POSTs token on click              |
| C2  | [x]    | `/api/auth/send-verification-email` has no rate limit (email-bomb vector)       | `apps/api/src/index.ts:52-69`                           | Add `rateLimit({ windowMs: 3600_000, max: 5 })` keyed on email body, not just IP   |
| C3  | [x]    | Caster onboarding gate silently fails open on any fetch error                   | `app/(caster)/layout.tsx:38-40`                         | Remove swallow; redirect to `/onboarding/caster` on non-OK                         |
| C4  | [x]    | Blurred `shootLocationDetail` ships in DOM (DevTools reveals)                   | `app/shoots/[id]/shoot-detail-view.tsx:521-526`         | Server-render placeholder only; never include value until contract fully signed    |
| C5  | [x]    | Trust page `PrivacyStageCard` labels swapped (artist/caster sees…)              | `app/trust/page.tsx:372-373`                            | Swap items props or rename data fields                                             |
| C6  | [x]    | Contact form is mocked; toast renders literal `&apos;`                          | `app/contact/contact-content.tsx:99-109`                | Wire to Hono endpoint or remove form; fix `&apos;` → `'`                           |
| C7  | [x]    | Onboarding layout doesn't role-check                                            | `app/onboarding/layout.tsx:5-9`                         | Read `session.user.role`, redirect mismatch via `postLoginPath`                    |

---

## High

| ID   | Status | Issue                                                              | Location                                                                                | Fix                                                                       |
| ---- | ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| H1   | [x]    | Registration leaks email existence via `EMAIL_TAKEN` 409           | `apps/api/src/services/AuthService.ts:61-76`                                            | Return generic success; send "someone tried to sign up" email             |
| H2   | [x]    | Verify + reset tokens in URL paths get logged                      | `apps/api/src/index.ts:35` + all `[token]` routes                                       | Strip tokens from logger; POST-confirm pattern                            |
| H3   | [x]    | Forgot-password shows success card AND error toast simultaneously  | `forgot-form.tsx:24-29` + `use-auth.ts:68-73`                                           | Drop global `onError` toast for `useForgotPassword`                       |
| H4   | [x]    | Resend-email field has no client validation                        | `verify-email/verify-email-client.tsx:42-52`                                            | Add `z.string().email()` parse before mutation                            |
| H5   | [x]    | No CAPTCHA on register or after N failed logins                    | All auth flows                                                                          | Add hCaptcha / Turnstile (Better Auth has plugins)                        |
| H6   | [x]    | No `next/image` — raw `<img>` everywhere                           | All public pages + `/register`                                                          | Swap to `next/image`; allowlist already configured                        |
| H7   | [x]    | `/artists/[id]` lacks `generateMetadata`                           | `app/artists/[id]/page.tsx:9`                                                           | Add `generateMetadata` returning per-artist title/description/OG          |
| H8   | [x]    | No sitemap.xml, robots.txt, metadataBase, OG image                 | Root config                                                                             | Add `app/sitemap.ts`, `app/robots.ts`, `metadataBase` + openGraph         |
| H9   | [x]    | Instagram external link missing `rel="noopener"`                   | `artist-profile-view.tsx:170-171`                                                       | Change `rel="noreferrer"` → `rel="noopener noreferrer"`                   |
| H10  | [x]    | `/suspended` accessible to anyone                                  | `app/suspended/page.tsx:9`                                                              | Server-side redirect users with `status !== 'suspended'`                  |
| H11  | [x]    | Dead session-aware code renders wrong UI for logged-in users       | `shoot-detail-view.tsx:53-54`, `artist-profile-view.tsx:36`                             | Wire `authClient.useSession()`; gate branches properly                    |
| H12  | [x]    | `typeof window` in JSX → hydration mismatch                        | `shoot-detail-view.tsx:528`                                                             | Use `usePathname()` or pass path from server                              |
| H13  | [x]    | Inline query keys break invalidation contract                      | `lib/hooks/use-artist.ts:24`, `lib/hooks/use-uploads.ts:7`                              | Add `queryKeys.artist.profile()`; use in both                             |
| H14  | [x]    | ID upload has no preview                                           | `step-identity.tsx:61-82`                                                               | Render `<img>` for images, "View document" link for PDFs                  |
| H15  | [x]    | Rejection feedback invisible — `approvalNotes` never shown         | `pending/page.tsx:21-25` + missing from stepper                                         | Show `approvalStatus === 'rejected'` banner with notes + resubmit CTA     |
| H16  | [x]    | 48-hour SLA hardcoded in copy                                      | `pending/page.tsx:80-82`, `step-review.tsx:239`                                         | Read from config or rephrase to "usually within 48 hours"                 |
| H17  | [x]    | `StepCasterWelcome` fires complete on mount before user action     | `step-caster-welcome.tsx:31-35`                                                         | Wait for `complete.isSuccess` before showing action cards                 |

---

## Medium

| ID   | Status | Issue                                                                              | Location                                       |
| ---- | ------ | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| M1   | [x]    | AuthShell is `'use client'`, balloons bundle on conversion-critical routes         | `auth-shell.tsx:1`                             |
| M2   | [x]    | Login form doesn't pre-fill `?email=` query from registration redirect             | `login-form.tsx:27-30`                         |
| M3   | [x]    | `safeRedirect` doesn't block backslash-prefixed paths                              | `login-form.tsx:22-25`                         |
| M4   | [x]    | 401 redirect loop risk in fetcher (no guard against being on `/login`)             | `lib/fetcher.ts:86-88`                         |
| M5   | [x]    | No DOB at artist registration — 18+ rule deferred to onboarding                    | `register/artist/register-form.tsx`            |
| M6   | [x]    | No "show password" toggle anywhere                                                 | all password fields                            |
| M7   | [~]    | No password strength meter / breached-password check                               | all password fields                            |
| M8   | [x]    | Inconsistent password-hint copy between artist and caster forms                    | both register-form.tsx files                   |
| M9   | [~]    | Whole-page `'use client'` on /talent, /shoots, /how-it-works                       | content components                             |
| M10  | [x]    | Lightbox modal lacks focus trap / ESC / return-focus                               | `artist-profile-view.tsx:306-354`              |
| M11  | [x]    | No skip-link in root or AuthShell                                                  | root layout                                    |
| M12  | [x]    | `prefers-reduced-motion` not respected on most animations                          | many decorative components                     |
| M13  | [x]    | No CAPTCHA / honeypot on contact form (when wired)                                 | `contact-content.tsx:99`                       |
| M14  | [x]    | GSAP loaded on every public page for nav drawer                                    | `card-nav.tsx:6`                               |
| M15  | [x]    | Talent/shoots filter search runs on every keystroke (no debounce)                  | `talent-content.tsx`, `shoots-content.tsx`     |
| M16  | [x]    | Portfolio uploads have no progress %                                               | `lib/api/uploads.ts:44-49`                     |
| M17  | [x]    | Portfolio upload failure forgets file — no retry button                            | `use-uploads.ts:20-28`                         |
| M18  | [x]    | Inconsistent file picker UX (Portfolio dropzone, ID bare input)                    | `step-identity.tsx`                            |
| M19  | [x]    | No autosave; "Save & Exit" drops in-progress edits                                 | `onboarding-shell.tsx:42`                      |
| M20  | [x]    | `StepReview` submit doesn't pre-validate locally — N round trips                   | `step-review.tsx`                              |
| M21  | [x]    | No suspended/banned check in onboarding layout                                     | `onboarding/layout.tsx`                        |
| M22  | [x]    | Pending-page refetch button has no cooldown                                        | `pending/page.tsx:89-97`                       |
| M23  | [x]    | Caster doesn't collect logo/avatar (legitimacy boost)                              | `step-caster-company.tsx`                      |

---

## Low

| ID  | Status | Issue                                                                     | Location                              |
| --- | ------ | ------------------------------------------------------------------------- | ------------------------------------- |
| L1  | [x]    | `Suspense fallback={null}` causes blank flash                             | login + verify-email pages            |
| L2  | [x]    | External Unsplash `<img>` on `/register`                                  | `app/register/page.tsx:121, 87`       |
| L3  | [x]    | Resend-verification button has no cooldown timer                          | `verify-email-client.tsx`             |
| L4  | [x]    | Apple Sign-In missing despite backend support                             | `login-form.tsx:138-144`              |
| L5  | [x]    | Reset-password keeps token in hidden form input unnecessarily             | `reset-form.tsx:67`                   |
| L6  | [x]    | `EMAIL_NOT_VERIFIED` mapped via HTTP 403, not canonical code              | `login-form.tsx:44`                   |
| L7  | [x]    | Three Google fonts loaded — review if Geist Mono earns weight             | `layout.tsx:9-27`                     |
| L8  | [x]    | Inline brand hex strings instead of `--brand-*` tokens                    | multiple                              |
| L9  | [x]    | Two-bar hamburger in nav (visually unusual)                               | `card-nav.tsx:201-202`                |
| L10 | [x]    | `/verify-email/confirmed` may be orphaned                                 | `app/verify-email/confirmed/page.tsx` |
| L11 | [x]    | `dobMax` calculated at module load                                        | `step-personal.tsx:34-38`             |
| L12 | [ ]    | `autoFocus` on every step's first input is aggressive on mobile           | all step components                   |
| L13 | [ ]    | Skills step inconsistency (review says missing, stepper says passable)    | `step-review.tsx:114` vs `page.tsx:200-202` |
| L14 | [x]    | No `<meta name="robots" content="noindex">` on onboarding pages           | onboarding layout                     |
| L15 | [ ]    | Optional fields not visually distinct                                     | multiple form components              |
| L16 | [ ]    | No "time to complete" estimate on artist onboarding                       | step-craft / step 1                   |
| L17 | [ ]    | Forgot-password landing doesn't autofocus email                           | `forgot-form.tsx:60-69`               |
| L18 | [ ]    | Suspended page metadata missing `Metadata` type import                    | `app/suspended/page.tsx:4`            |

---

## Cross-cutting issues

1. Raw `<img>` everywhere — `next/image` migration is the single biggest LCP win.
2. `'use client'` over-used on static content.
3. Dead session-aware code in detail views.
4. Tokens in URL paths get logged.
5. No CAPTCHA / bot defence anywhere.
6. Hardcoded marketing numbers presented as live data.
7. Inline brand hex drifts from `--brand-*` tokens.
8. `prefers-reduced-motion` ignored on most decorative animations.
9. No SEO scaffolding (sitemap, robots, metadataBase).
10. No skip-link anywhere.
11. Inconsistent file picker UX between Identity (bare input) and Portfolio (dropzone).
12. No autosave / no real "Save & Exit" in onboarding.

---

## Security checklist summary

| Concern                                          | Status                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Sessions in httpOnly cookies                     | ✅                                                                  |
| CSRF via `requireOrigin` on `/api/v1/*`          | ✅                                                                  |
| CSRF on Better Auth `/api/auth/*` routes         | ⚠ Relies on default SameSite=Lax — verify cookie config explicitly  |
| Password client+server validation parity         | ✅                                                                  |
| Account enumeration: forgot-password             | ✅                                                                  |
| Account enumeration: login                       | ✅                                                                  |
| Account enumeration: register                    | ❌ `EMAIL_TAKEN` leaks (H1)                                         |
| Account enumeration: verify resend               | ❌ Differential response (C2)                                       |
| Tokens in httpOnly cookies, not localStorage     | ✅                                                                  |
| Token-in-URL log exposure                        | ❌ (H2)                                                             |
| Rate limit on login                              | ✅ 10/15min                                                         |
| Rate limit on forgot-password                    | ✅ 5/hour                                                           |
| Rate limit on verify resend                      | ❌ (C2)                                                             |
| Bot defence / CAPTCHA                            | ❌ (H5)                                                             |
| Open redirect filter                             | ⚠ Blocks `//`, not `\foo` (M3)                                      |
| Autocomplete attributes correct                  | ✅                                                                  |
| 18+ enforced (DOB)                               | ⚠ Only in onboarding, not registration (M5)                         |
| File upload allowlist + size limits              | ✅                                                                  |
| Direct-to-R2 presigned URL pattern               | ✅                                                                  |
| Public artist profile sensitive-field exposure   | ✅ (measurements public — product call)                             |
| Public shoot detail location leak                | ❌ (C4)                                                             |

---

## Fix log

| Date | ID | Commit | Notes |
| ---- | -- | ------ | ----- |
| 2026-05-21 | C1 | `11e45c0` | Split [token] page into server shell + client confirm button. Token now only consumed on user click — safe against email-link prefetchers. Added `verifyEmailToken` service + `noindex` metadata. |
| 2026-05-21 | C2 | `ce53298` | Cap `/api/auth/send-verification-email` at 5/hour keyed on (lowercased email, IP). Body read via cloned Request so Better Auth still sees the original. `rateLimit` key fn now async-capable. |
| 2026-05-21 | C3 | `ffda4e7` | Caster onboarding gate now fails closed. Restructured try/catch so redirect() isn't caught by the catch arm. Unconfirmed gate → redirect to `/onboarding/caster` instead of falling through. |
| 2026-05-21 | C4 + H12 | `1cb9a55` | Locked `DetailRow` renders opaque placeholder; parent stops passing `shootLocationDetail` into the prop chain when isAuthed is false. Replaced `typeof window` SSR hack with `usePathname()`. |
| 2026-05-21 | C5 | `7b8735c` | Renamed `caster`/`artist` fields → `casterSees`/`artistSees` to make semantics explicit. Stage 4 data corrected so "Exact shoot location revealed" sits under "Artist sees" (the only party who actually learns it post-signing). |
| 2026-05-21 | C6 + M13 | `d9bc603` | Contact form now hits real `POST /api/v1/contact` (rate-limited 5/hr/IP). New `@castflow/validators` `contactMessageSchema` shared client+server. Honeypot field for bot defence. Toast escape fixed. |
| 2026-05-21 | C7 + M21 + L14 | `a551533` | Parent `/onboarding/layout`: auth + admin redirect + suspended/banned redirect + `noindex`. Three per-flow sub-layouts (`artist/`, `caster/`, `pending/`) enforce role-vs-flow via `postLoginPath`. |
| 2026-05-21 | H3 | `6aeea8a` | Dropped `onError` toast from `useForgotPassword` (account-enumeration defence — the form already shows generic success in `onSettled`). |
| 2026-05-21 | H4 | `b766d77` | Zod-validate resend-email field client-side before hitting the rate-limited server endpoint. |
| 2026-05-21 | H9 | `7246412` | `rel="noopener noreferrer"` on Instagram + ICO external links. |
| 2026-05-21 | H13 | `fb3b676` | Routed `['artist','me']` inline keys through `queryKeys.artist.me()` factory across use-artist + use-uploads. |
| 2026-05-21 | H16 | `d79beb7` | Soften "within 48 hours" → "usually within 48 hours" on both pending page and step-review. |
| 2026-05-21 | H10 + L18 | `1ada477` | `/suspended` now requires session and user.status ∈ {suspended,banned}; others bounce to /. Added typed Metadata import + noindex. |
| 2026-05-21 | H7 + H8 | `d3b7cdd` | SEO foundation: `lib/site.ts`, `app/sitemap.ts`, `app/robots.ts`, root `metadataBase`/`openGraph`/`twitter`, per-artist `generateMetadata` on `/artists/[id]`. New env `NEXT_PUBLIC_SITE_URL`. |
| 2026-05-21 | H1 | `1efed66` | Registration no longer throws `EMAIL_TAKEN`. Duplicate signups return fake-success indistinguishable from a real signup and trigger a 'someone tried to sign up' email to the legitimate owner. Test rewritten. |
| 2026-05-21 | H2 | `b441630` | Custom `safeLog` print-fn for hono/logger scrubs `token=`/`code=` query params and opaque path segments on auth routes. Tokens no longer leak to access-log retention. |
| 2026-05-21 | H11 | `2f5142d` | Wired `useAuthSession()` into `artist-profile-view` + `shoot-detail-view`. Logged-in casters now see caster UI; logged-in artists see artist UI. Killed the `isCaster=false`/`isAuthed=false` hardcodes. |
| 2026-05-21 | H14 | `9cf7e5e` | New `GET /api/v1/artists/me/id-document/url` returns short-lived presigned URL for the artist's own ID. `step-identity` renders inline image preview or PDF link after upload. |
| 2026-05-21 | H15 | `bd174a2` | `/onboarding/pending` renders a 'changes requested' branch with admin `approvalNotes` + 'Edit & resubmit' CTA (no silent redirect). Artist stepper shows rejection banner across every step while status is rejected. |
| 2026-05-21 | H17 | `f73feac` | `StepCasterWelcome` holds action cards behind `complete.isSuccess` so navigation before the PATCH lands doesn't get bounced by the caster-layout gate. |
| 2026-05-21 | H6 (part 1) | `e404e87` | next/image on landing & directory surfaces: featured-artists, live-shoots, talent grid, shoots grid, casters, artists list, register tiles. picsum.photos allowlisted in next.config (placeholder TODO). |
| 2026-05-21 | H6 (part 2) | `abbb65a` | next/image on shoot-detail, artist-profile (incl. lightbox), step-portfolio. Skipped (documented): profile-card tilt component, avatar-circles micro-avatars, step-identity (presigned URL). |
| 2026-05-21 | H5 | `996cabc` | Cloudflare Turnstile on `/register-{artist,caster}` (env-flagged via `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — no-op when unset). New `requireCaptcha` middleware + `<TurnstileWidget>`. Login after-N-fail deferred (noted in handoff). |
| 2026-05-21 | M23 | `86ad083` | End-to-end caster logo upload. **DB**: `CasterProfile.logoUrl String?` added to `schema.prisma` (additive nullable, no data migration) — `bunx prisma db push` required on next deploy. **Validators**: `caster_logo` added to `presignedUrlSchema` / `confirmUploadSchema` and to `UPLOAD_LIMITS` (jpeg/png/webp/svg, 2MB cap). **API**: `UploadService.confirmUpload` writes the resulting public URL to `CasterProfile.logoUrl`; `PATCH /casters/me` accepts `logoUrl: null` for explicit clears. **Types**: `CasterProfile.logoUrl: string \| null`. **Frontend**: step-caster-company gets a dropzone above the contact fields with preview + Replace/Remove buttons, hooked into the existing `useUploadFile` with progress %. |
| 2026-05-21 | M22 | `58aa461` | Pending-page "Check application status" button now enforces a 30s cooldown after each click. The button label switches to a live `Check again in Ns` countdown driven by a 1Hz interval that only ticks while the cooldown is active (no idle re-renders once it expires). |
| 2026-05-21 | M20 | `a21daa9` | `StepReview.handleSubmit` now consults the already-computed `sections.tone === 'missing'` flags before calling the API. If anything is incomplete it scrolls to top, jumps the stepper to the first missing section, and toasts a fix-it message — no wasted server round-trip. Server validation remains the source of truth for anything the client can't see (e.g. invalid portfolio mime types after upload confirm). |
| 2026-05-21 | M19 | `eb15e3d` | Renamed the shell's exit label from "Save & exit" (which lied — nothing was being saved) to plain "Exit". New `useBeforeUnloadWarning(when)` hook registered on the four form-bearing steps (step-personal, step-stats × model/actor, step-experience, step-caster-company) gated on RHF's `formState.isDirty && !mutation.isPending` — closing the tab / hitting back / following an external link now triggers the browser's native "Leave site? Changes may not be saved" prompt. Full autosave deferred — would need a per-step debounced PATCH, separate decision per step. |
| 2026-05-21 | M18 | `9777db4` | step-identity now uses `react-dropzone` (single-file, mime-restricted) like step-portfolio. Drag-and-drop, drag-active styling, and the "Replace" button is rewired to `dropzone.open()` so click-to-browse still works. Hidden manual `<input ref={inputRef}>` removed. |
| 2026-05-21 | M17 | `3f12f42` | Pending-upload state in `step-portfolio` now keeps the original `File` handle and a `status: 'uploading' \| 'failed'` flag, with optional `error` message. Failure path no longer drops the entry — the placeholder card switches to a red error variant with **Retry** (re-fires the same File through the mutation) and **Dismiss** controls. Dropzone summary line reflects the active/failed split. |
| 2026-05-21 | M16 | `cdf38e0` | Swapped the R2 PUT in `lib/api/uploads.ts` from `fetch()` to a `putWithProgress()` XHR helper that emits `onProgress(0–100)` and accepts an `AbortSignal`. `useUploadFile` forwards the callback. `step-portfolio` now tracks an in-flight queue keyed by a synthetic upload id (filename + size + timestamp + nonce) and renders a per-file placeholder card with a 0–100% progress bar that sits alongside the existing portfolio grid. Removed the blanket "Uploading…" line in favour of a per-file count. |
| 2026-05-21 | M15 | `e2b81f5` | New `useDebouncedValue<T>(value, delayMs)` hook in `lib/hooks/`. Wired into talent + shoots content components with 250ms delay on the free-text query input; the `useMemo` filter pipelines now key off the debounced value instead of the raw keystroke value. Select-based facets stay synchronous (they only change on user action). |
| 2026-05-21 | M14 | `ae5392a` | GSAP is no longer in the initial bundle for landing pages. `card-nav.tsx` now uses `import type` + a cached `loadGsap()` dynamic-import helper; the library only fetches on the user's first hamburger tap. Removed the eager `useLayoutEffect` that built the timeline at mount; timeline creation moves into the open-path of `toggleMenu`. Resize handler is a no-op until GSAP has loaded. Initial collapsed state is driven by the existing CSS (`.card-nav { height: 60px; overflow: hidden; }` etc.) so visual baseline is unchanged. |
| 2026-05-21 | M12 | `116ba79` | Site-wide `@media (prefers-reduced-motion: reduce)` rule in `globals.css` clamps every CSS keyframe animation, transition, and smooth-scroll to 0.01ms (not 0ms so `animationend`/`transitionend` listeners still fire). Catches every Tailwind utility, shadcn primitive, and bespoke `@keyframes`. JS-driven motion (motion/react, framer) already checks the OS pref independently; existing `motion-reduce:` Tailwind variants in hero/reveal/counter are preserved unchanged. |
| 2026-05-21 | M11 | `5b068b8` | Server-component `<SkipLink>` mounted at the top of the body in `app/layout.tsx`; visually-hidden until focus, then reveals a high-contrast "Skip to content" pill that targets a `#main-content` span placed right before `{children}` in the SessionProvider subtree. Works for every route including AuthShell pages because everything renders inside this anchor. |
| 2026-05-21 | M10 | `f7cb23c` | Portfolio lightbox now: ESC to close, initial focus to ✕, Tab/Shift+Tab cycle within the dialog, focus restored to the originating thumbnail on close (parent caches the trigger via `e.currentTarget` and re-focuses in `requestAnimationFrame` after the dialog unmounts). Also added `aria-label` to the dialog and a focus-visible ring on the close button. |
| 2026-05-21 | M9 (how-it-works) | `d4a6569` | `how-it-works-content.tsx` is now a server component — extracted the single `useRef`-using island (`FlowBeamSection`) into a sibling `flow-beam-section.tsx` client file, with its own copy of the `STEPS` data. The rest of the page (hero, bento features, activity list, CTAs) composes client animation components (`Reveal`, `NumberTicker`, etc.) from a server parent, so the page shell no longer ships as JS. Talent and shoots content files stay `[~]` — their filter state lives at the page root and warrants a separate refactor session. |
| 2026-05-21 | M8 | `b273fb5` | Caster register-form password hint copy aligned with artist register-form ("8+ chars · 1 num · 1 sym"). |
| 2026-05-21 | M7 (meter) | `c3a6058` | New `<PasswordStrengthMeter>` — rules-based, zero deps, 5-criterion checklist mirroring the shared `passwordSchema` plus length-12 stretch goal. Wired on register-artist, register-caster (compact), reset-password. Row marked `[~]` (in progress) — the breached-password (HIBP k-anonymity) half is deliberately deferred; adds an external network dep + privacy disclosure obligation worth a separate decision. |
| 2026-05-21 | M6 | `58da926` | New `<PasswordInput>` client wrapper around `AuthInput` with an eye/eye-off toggle (forwardRef preserved so RHF.register still works). Wired into login, reset-password, register-artist, register-caster — all 6 password fields. Toggle is `tabIndex={-1}` so it doesn't disrupt keyboard form flow but stays available to mouse + screen reader. |
| 2026-05-21 | M5 | `3476876` | DOB now collected on the artist register form and validated by `registerArtistSchema` (shared `isOldEnoughToRegister` helper extracted from `artist.ts`; same predicate the onboarding `artistPersonalInfoSchema` already used). Persisted onto `ArtistProfile.dob` in `AuthService.registerArtist`. Onboarding step-personal still allows correction. New under-18 rejection tests at both the validator (V7b/V7c) and API (A2b) layers. |
| 2026-05-21 | M4 | `0a0ac4e` | `fetcher` now skips its `window.location.href = '/login'` redirect when the user is already on `/login`, `/register*`, `/forgot-password`, `/reset-password*`, `/verify-email*`, or `/suspended`. Stops hard-reloads from clobbering an inline error state (e.g. wrong-password attempt on /login) and removes the redirect-loop risk on auth pages that issue background v1 requests. |
| 2026-05-21 | M3 | `df1f3d6` | Extracted the `?redirect=` sanitiser into `lib/safe-redirect.ts` (`safeInternalRedirect`) with 11 unit tests covering protocol-relative, backslash-prefix, URL-encoded `%5C`/`%2F`, control-char (tab/newline/null), oversized payload, and whitespace-bypass vectors. Replaces the inline `startsWith('/') && !startsWith('//')` check which let `/\evil.com` and `/%5Cevil.com` past. |
| 2026-05-21 | M2 | `8abc893` | Login form now reads `?email=` from the search params, sanitises (length≤254, must contain '@') and uses it as the RHF default. autoFocus moves to the password field when prefilled so the user can type their password immediately. Closes the loop on register-{artist,caster} which already redirect to `/login?email=…` on the duplicate-email path. |
| 2026-05-21 | M1 | `dcb39ca` | Stripped `'use client'` from `AuthShell` (the heavy atmospheric layer — Particles canvas, AnimatedGridPattern, blur washes — no longer ships as JS on /login, /register, /verify-email, /forgot-password, /reset-password). Form-only primitives (`AuthInput`, `AuthField`, `AuthDivider`) extracted to a sibling `auth-form-fields.tsx` client module; six consumer forms updated to import from there. |
| 2026-05-21 | L1 | `5ed7846` | Replaced `Suspense fallback={null}` with layout-matched skeleton placeholders on `/login` and `/verify-email`. Both wrap a client component using `useSearchParams()`, so the boundary is required; the previous empty fallback caused a visible blank flash + layout shift while the client subtree streamed in. Skeleton sizes mirror the real form (email + password + submit + divider + Google CTA for login; resend email field + button for verify-email) so there's no jump when the real form mounts. |
| 2026-05-21 | L2 | (subsumed by H6) | The `/register` role tiles already migrated to `next/image` as part of H6 part-1 (`e404e87`). Unsplash hosts are allowlisted in `next.config.ts`. No code change needed — flipping the row for bookkeeping. |
| 2026-05-21 | L3 | `1adb3d6` | 30s cooldown on the `/verify-email` resend button. Same epoch-timestamped `cooldownUntil` + 1Hz ticker pattern as M22 (only runs while a cooldown is active). Button label flips to `Resend in Ns`. Stops button-mash spam from burning through the per-email/IP rate-limit bucket. |
| 2026-05-21 | L4 | `d81ab15` | Apple sign-in button on `/login`, gated on `NEXT_PUBLIC_APPLE_ENABLED=true` so backend creds (`APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` in `socialProviders.apple`) can be rolled out before exposing the UI. Inline `AppleGlyph` SVG. Wired through the same `authClient.signIn.social` path with `safeRedirect` callback. |
| 2026-05-21 | L5 | `165fdcb` | Reset-password form no longer wires the token through RHF. The token comes from the URL prop and never changes during the form's lifetime — registering it as a hidden input added a DOM artefact (probed by some browser extensions) for zero benefit. `onSubmit` reads it from the prop directly; `formSchema` only extends with `confirmPassword`. |
| 2026-05-21 | L6 | `4098cf5` | Login error mapper now matches on `code === 'EMAIL_NOT_VERIFIED'` only, not on bare `status === 403`. A banned/suspended account also returns 403, and showing 'Please verify your email' there was misleading. Better Auth always sets the canonical code on the unverified path, so the code-only check is sufficient. |
| 2026-05-21 | L7 | (review only) | Reviewed Geist Mono usage: `font-mono text-[10px] uppercase tracking-[0.22em]` is the site-wide eyebrow microcopy pattern, appearing on virtually every page (talent, shoots, casters, artists, trust, pricing, contact, how-it-works, verify-email, register, suspended, and every onboarding step). It earns its weight. Keeping the three-font load (Geist sans + Geist mono + Instrument Serif). No code change. |
| 2026-05-21 | L8 | `7881370` | Tokenised the inline brand-hex strings sprinkled across 33 `.tsx` files. Added two new CSS vars in `globals.css` for the orange CTA pair (`--cta-400: #f9a26c`, `--cta-500: #e67e3e`) and swept `#f9a26c`/`#e67e3e`/`#2a6b96`/`#85bcda`/`#0d1b26` onto `var(--cta-*)`/`var(--brand-700)`/`var(--brand-300)`/`var(--ink-900)`. Tailwind v4 supports the CSS-var arbitrary-value + `/opacity` modifier via color-mix, so opacity classes like `bg-[var(--cta-400)]/15` still work. Three callers reverted to hex literals: `GlareHover` and `Particles` parse the hex at runtime to compute RGBA channels and cannot take a CSS variable. Cleaned up `card-nav.css` and `globals.css`'s few internal hex refs for consistency. |
| 2026-05-21 | L9 | `cae183b` | Conventional 3-bar hamburger in the landing nav. Added a third `.hamburger-line` and a `:nth-child(2)` opacity-fade so the icon collapses to the same X glyph on open. Tweaked the gap/translateY math (gap 6→5, translateY ±4 → ±7) to keep the closed icon balanced. |
| 2026-05-21 | L10 | `68d95b8` | Deleted `/verify-email/confirmed/page.tsx`. The route was orphaned — no code in apps/web, apps/api, or the Better Auth flow ever linked to it (the `[token]` success path lands the user back at `/login`). Removing it eliminates the search-index risk (it had no noindex) and drift surface. |
| 2026-05-21 | L11 | `f5bf985` | `dobMax` was computed by a module-load IIFE in `step-personal.tsx`, so a tab open across midnight kept yesterday's 18+ cap on the date picker. Extracted into a `calculateDobMax()` helper called from the component body — re-evaluated per render at near-zero cost. |
