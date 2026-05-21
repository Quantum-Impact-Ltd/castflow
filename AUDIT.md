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
| M12  | [ ]    | `prefers-reduced-motion` not respected on most animations                          | many decorative components                     |
| M13  | [x]    | No CAPTCHA / honeypot on contact form (when wired)                                 | `contact-content.tsx:99`                       |
| M14  | [ ]    | GSAP loaded on every public page for nav drawer                                    | `card-nav.tsx:6`                               |
| M15  | [ ]    | Talent/shoots filter search runs on every keystroke (no debounce)                  | `talent-content.tsx`, `shoots-content.tsx`     |
| M16  | [ ]    | Portfolio uploads have no progress %                                               | `lib/api/uploads.ts:44-49`                     |
| M17  | [ ]    | Portfolio upload failure forgets file — no retry button                            | `use-uploads.ts:20-28`                         |
| M18  | [ ]    | Inconsistent file picker UX (Portfolio dropzone, ID bare input)                    | `step-identity.tsx`                            |
| M19  | [ ]    | No autosave; "Save & Exit" drops in-progress edits                                 | `onboarding-shell.tsx:42`                      |
| M20  | [ ]    | `StepReview` submit doesn't pre-validate locally — N round trips                   | `step-review.tsx`                              |
| M21  | [x]    | No suspended/banned check in onboarding layout                                     | `onboarding/layout.tsx`                        |
| M22  | [ ]    | Pending-page refetch button has no cooldown                                        | `pending/page.tsx:89-97`                       |
| M23  | [ ]    | Caster doesn't collect logo/avatar (legitimacy boost)                              | `step-caster-company.tsx`                      |

---

## Low

| ID  | Status | Issue                                                                     | Location                              |
| --- | ------ | ------------------------------------------------------------------------- | ------------------------------------- |
| L1  | [ ]    | `Suspense fallback={null}` causes blank flash                             | login + verify-email pages            |
| L2  | [ ]    | External Unsplash `<img>` on `/register`                                  | `app/register/page.tsx:121, 87`       |
| L3  | [ ]    | Resend-verification button has no cooldown timer                          | `verify-email-client.tsx`             |
| L4  | [ ]    | Apple Sign-In missing despite backend support                             | `login-form.tsx:138-144`              |
| L5  | [ ]    | Reset-password keeps token in hidden form input unnecessarily             | `reset-form.tsx:67`                   |
| L6  | [ ]    | `EMAIL_NOT_VERIFIED` mapped via HTTP 403, not canonical code              | `login-form.tsx:44`                   |
| L7  | [ ]    | Three Google fonts loaded — review if Geist Mono earns weight             | `layout.tsx:9-27`                     |
| L8  | [ ]    | Inline brand hex strings instead of `--brand-*` tokens                    | multiple                              |
| L9  | [ ]    | Two-bar hamburger in nav (visually unusual)                               | `card-nav.tsx:201-202`                |
| L10 | [ ]    | `/verify-email/confirmed` may be orphaned                                 | `app/verify-email/confirmed/page.tsx` |
| L11 | [ ]    | `dobMax` calculated at module load                                        | `step-personal.tsx:34-38`             |
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
| 2026-05-21 | M11 | _pending_ | Server-component `<SkipLink>` mounted at the top of the body in `app/layout.tsx`; visually-hidden until focus, then reveals a high-contrast "Skip to content" pill that targets a `#main-content` span placed right before `{children}` in the SessionProvider subtree. Works for every route including AuthShell pages because everything renders inside this anchor. |
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
