# CastFlow Frontend Audit — 2026-05-22

Scope: public marketing site, marketplace, auth, onboarding, and authenticated caster/artist UI. Excludes `/caster/dashboard` (user request) and `/admin/*` (out of scope per PRODUCT.md).

---

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 / 4 | Globals.css honors `prefers-reduced-motion`. Gaps: low-contrast `text-white/35` placeholders in auth-shell, missing focus rings on topic pills (`/contact`), 2×2 px availability dot (`/talent`). |
| 2 | Performance | 3 / 4 | `OrbitingCircles`, `Particles`, `AnimatedGridPattern`, `BorderBeam` rendered on multiple non-IO routes; cooldown `setInterval` re-renders; no debounce on talent/job filters. |
| 3 | Responsive Design | 2 / 4 | Caster comparison table doesn't collapse; AnimatedBeam flow hidden on mobile but card stack loses flow semantics; `/talent` `xl:grid-cols-4` cramps at md; mobile filter row overlaps at 375 px. |
| 4 | Theming | 3 / 4 | Tokens correctly wired in globals.css. Drift: literal `bg-amber-500/90`, `text-rose-300`, hardcoded `#ffffff` BorderBeam gradients, gradient buttons that violate no-gradient-CTA rule. |
| 5 | Anti-Patterns | **1 / 4** | Heavy AI slop: gradient text on 9 auth headings, multi-Instrument-Serif-italic abuse on 7 pages, ShimmerButton on every auth CTA, AnimatedShinyText eyebrow chips, BorderBeam-as-decoration on 12+ surfaces, MagicCard gradient, glassmorphic auth/onboarding shells. |
| **Total** | | **12 / 20** | **Acceptable — significant work needed** |

## Anti-Patterns Verdict — FAIL

Yes, these pages look AI-generated. Six template tells repeat across the codebase:

1. **Gradient italic-serif span in every h1.** `bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent` copy-pasted onto 9+ headings.
2. **AnimatedShinyText eyebrow pill.** Above the h1 on `/`, `/casters`, `/artists`, `/how-it-works`, `/talent`, `/contact`, legal pages, and inside `auth-shell`.
3. **BorderBeam as decoration.** Pulsing borders on hero images, CTAs, pricing tier cards, SLA cards, featured-artist cards, legal footer, shoot-detail hero.
4. **ShimmerButton on every form CTA.** Login, register/{caster,artist}, forgot-password, reset-password.
5. **Glassmorphic shell.** `backdrop-blur-xl` + Particles + AnimatedGridPattern wrap auth pages and the onboarding shell.
6. **font-serif sprinkled inside product surfaces.** CasterCard title on shoot detail, empty-state h3s on artist profile, legal split-line headings, plus 3–5 Instrument Serif italic moments per marketing page.

## Executive Summary

- **Health score:** 12/20.
- **Total findings:** ~180 across 30 pages. Severity mix: ~17 P0, ~38 P1, ~95 P2, ~30 P3.
- **Root cause:** auth-shell, onboarding-shell, and a shared "heading with gradient italic-serif span" pattern propagate the same six template defaults across every page. Fixing the shared components and codemodding one className clears ~60% of P0/P1 findings.
- **Working well:** tokens in `globals.css`; sensitive-data handling on `/shoots` and `/shoots/[id]`; auth forms have visible labels, inline errors, password strength meter, social-login Google/Apple; AnimatedBeam in `/trust` and `/how-it-works` is the rare justified motion moment.

---

## Findings by Page

### Marketing

**`/` (homepage, composes `components/landing/sections/*`)**
- [P0] Multiple Instrument Serif italic moments in hero — `sections/hero.tsx:45–58`. Fix: keep one editorial line; rest become Geist Sans semibold.
- [P1] WhyCastflowSection drenched brand bg with nested AnimatedGridPattern — `sections/why-castflow.tsx:25`. Fix: drenched is fine, kill the nested pattern.
- [P1] AnimatedShinyText eyebrow chip in hero. Fix: static `<Label>` tracked-uppercase on `surface-50`.
- [P1] BorderBeam on pricing-preview CTA cards — `sections/pricing-preview.tsx:103–117`. White-on-white gradient. Fix: remove.
- [P2] NumberTicker animates static landing values — `sections/numbers-strip.tsx`. Fix: static.

**`/casters`** (`app/casters/page.tsx`, 366 lines)
- [P1] Hero h1 has 5 Instrument Serif italic moments (:121, :161, plus three body sections). Fix: collapse to one.
- [P1] Three-column "feature grid" with identical icon+heading+text tiles — :196. Fix: editorial bento or numbered-step layout.
- [P1] Comparison table `grid-cols-[1.4fr_1fr_1fr]` has no mobile collapse — :246. Fix: `<sm` horizontal-scroll or stacked cards.
- [P2] Stat values use `font-mono` — :361. Fix: Geist Sans `font-medium`.
- [P2] Marquee logos rendered as Instrument Serif text — :161–165. Fix: real wordmarks or plain sans.
- [P2] Stat icon `group-hover:scale-110` — :200. Fix: drop scale.
- [P2] BorderBeam magic numbers duplicated across pages — :306, `artists/page.tsx:477`, `trust/page.tsx:300`. Fix: remove (preferred) or extract.

**`/artists`** (`app/artists/page.tsx`, 610 lines) — worst offender by serif abuse
- [P0] Hero h1 contains TWO Instrument Serif italic phrases — :131–133. Fix: one sans h1.
- [P0] Page has 5+ Instrument Serif italic moments — :269, :322, :358. Fix: cut to one.
- [P1] OrbitingCircles + BorderBeam stacked on same hero element — :161–167 and :293–305. Fix: drop BorderBeam.
- [P1] NumberTicker animates static landing-page metrics — :175–179. Fix: static.
- [P2] Four-column "Get started" card grid — :327. Fix: numbered-step list.
- [P2] Stat tile `tint` prop applied inconsistently — :199–220. Fix: one rule.

**`/how-it-works`**
- [P1] AnimatedGridPattern with `skew-y-12` behind step content — `how-it-works-content.tsx:144–146`. Fix: remove.
- [P1] AnimatedList stagger on "Live activity" feed — :357–366. Fix: static list.
- [P1] Three-color accent system on live feed (amber + emerald + brand). Fix: two-accent max.
- [P2] Faked bento — :271. Fix: true 3-col asymmetric grid.
- [P2] AnimatedBeam hidden `<lg` — `flow-beam-section.tsx:93–122`. Fix: numbered progression on mobile.
- [P3] Decorative Sparkles icon absolute-positioned — :287–290. Fix: remove.

**`/pricing`** (`app/pricing/page.tsx`, 511 lines)
- [P1] Hero h1 italic-serif on "Artists keep 100%" — :224. Fix: sans.
- [P1] "Most popular" pill at `-top-3` overlaps awkwardly. Fix: outline+ring variant.
- [P2] Commission breakdown `highlight=true` rule unclear — :293. Fix: same surface, accent value via weight.
- [P2] FAQ `<details>` missing open-state styling — :395. Fix: `group-open` border-t + chevron rotate.
- [P2] Stat eyebrow uses `text-primary` — :482. Fix: `text-ink-600`.

**`/trust`** (`app/trust/page.tsx`, 407 lines)
- [P1] Hero h1 italic-serif "every booking" — :137. Fix: sans.
- [P1] "Privacy ladder" rendered as four flat cards — :192–196. Fix: true progression visual.
- [P1] EscrowFlowSection AnimatedBeam hidden `<lg` — `escrow-flow-section.tsx:92–104`. Fix: mobile fallback.
- [P2] Dispute-outcome left-rail uses `border-primary/40` — :400. Fix: full primary or drop.

**`/contact`** (`app/contact/contact-content.tsx`, 517 lines)
- [P1] Hero italic-serif "about anything" — :293. Fix: sans.
- [P1] BorderBeam on SLA stat card — :309. Fix: remove.
- [P1] Topic pills missing `focus-visible` ring — :130–150. Fix: `focus-visible:ring-2 ring-primary`.
- [P2] Validation error uses destructive color — :514. Fix: ink + warning icon.
- [P2] Safety callout double-tinted — :419. Fix: single layer.

### Public marketplace + profile

**`/shoots`**
- [P0] Hero h1 has TWO Instrument Serif italic spans — `shoots-content.tsx:184–185`.
- [P1] BorderBeam on hero featured card — :205–210. Fix: remove.
- [P1] Cards visually identical (image + bottom-overlay text) — :140, :156. Fix: vary card composition.
- [P2] Em dash literal in metadata — :308. Fix: "Not specified".
- [P2] AnimatedShinyText shimmer on "Updated minutes ago" — :174–179. Fix: static + `live-pulse` dot.
- [P2] Mobile filter overflow pattern overlaps pills at 375 px. Fix: bump gap, test on device.

**`/shoots/[id]`**
- [P0] Bid panel uses MagicCard with brand gradient — `shoot-detail-view.tsx:380–386`. Fix: flat shadcn Card.
- [P0] BorderBeam on hero image — :110–116. Fix: remove.
- [P1] CasterCard title is `font-serif text-3xl` — :598. Fix: Geist Sans medium.
- [P1] CasterStat tiles nested inside CasterCard — :614–633. Fix: inline `<dt>/<dd>` rows with hairline dividers.
- [P2] GlareHover on similar-shoots cards — :669. Fix: simple `scale(1.04)` on hover.

**`/talent`**
- [P0] Hero h1 italic-serif "models and actors" — `talent-content.tsx:195`. Also italic-serif "book in one click" in final CTA — two moments.
- [P1] BorderBeam on featured artist hero — :216–220. Fix: remove.
- [P1] 2×2 availability dot with ping — :468–481. Critical affordance, invisible. Fix: visible badge or 4×4 dot with ring.
- [P2] `grayscale-[40%]` on unavailable cards — :462. Fix: "Unavailable" badge + 30% black overlay.
- [P2] GlareHover on every card — :446–452. Fix: remove.
- [P2] AnimatedShinyText on "Verified UK talent" eyebrow. Fix: static `<Label>`.

**`/artists/[id]`**
- [P0] ProfileCard is ~1,200 lines of bespoke tilt + glow + pointer-tracking — `artist-profile-view.tsx:79–106`. Fix: replace with static `rounded-3xl border-border/60` card.
- [P0] Instagram handle in DOM as link regardless of auth — :181–188. Fix: render `href` only when `isCaster`; locked placeholder otherwise.
- [P1] Portfolio lightbox capped `max-h-[85vh] max-w-4xl` — :319. Fix: full-screen viewer.
- [P2] Stat trio rendered as three rounded-2xl cards — :246–253. Fix: inline 3-column flex row, divider-only.
- [P3] Empty-state h3s are `font-serif text-2xl` — :271, :538. Fix: Geist Sans.

### Auth

**Shared `components/auth/auth-shell.tsx` — root cause of most P0s**
- [P0] AnimatedGridPattern decorative layer — :51.
- [P0] Particles background — :61.
- [P0] AnimatedShinyText eyebrow chip — :101.
- [P0] Form card `backdrop-blur` + drop-shadow — :123.

**Cross-cutting (9 page.tsx files)**
- [P0] Same gradient italic-serif span in every h1 — `login/page.tsx:47`, `register/page.tsx:52`, `register/caster/page.tsx:20`, `register/artist/page.tsx:20`, `forgot-password/page.tsx:17`, `reset-password/page.tsx:18`, `reset-password/[token]/page.tsx:20`, `verify-email/page.tsx:37`, `verify-email/[token]/page.tsx:27`. Fix: codemod strip the entire span.
- [P1] ShimmerButton on every auth submit — `login-form.tsx:152`, `register/caster/register-form.tsx:246`, `register/artist/register-form.tsx:231`, `forgot-form.tsx:73`, `reset-form.tsx:117`. Fix: solid pill `Button` with `aria-busy`.

**Specifics**
- [P1] Inconsistent confirm-password label ("Confirm" vs "Confirm password"). Fix: standardize.
- [P2] Password grid `grid-cols-2` cramped at 375 px — `register/caster/register-form.tsx:191–228`. Fix: stack `<sm`.
- [P2] Verify-email resend has no client-side validation feedback — `verify-email-client.tsx:67–76`. Fix: inline error.
- [P2] Topic/role pills lack `focus-visible` ring. Codemod across pill components.

**`/suspended`**
- [P0] CTA button has gradient + colored drop-shadow — :57. Fix: solid `bg-[var(--cta-400)]`, no shadow.

### Onboarding + authenticated app

**Shared `components/onboarding/onboarding-shell.tsx`**
- [P0] AnimatedGridPattern (:63–72) + Particles (:73–80) wrap every step. Fix: remove.
- [P0] `backdrop-blur-xl` on tips sidebar — :161. Fix: solid `bg-card`.
- [P0] StepNav primary button has gradient + colored shadow — `step-nav.tsx:58–59`. Fix: solid CTA fill, no shadow.

**`/onboarding/artist`**
- [P0] Rejection banner uses `backdrop-blur-xl` + rose border — `app/onboarding/artist/page.tsx:322`. Fix: solid `bg-destructive/5`, `border-destructive/30`.
- [P2] `calculateDobMax()` recomputes every render — `step-personal.tsx:38–42`. Fix: `useMemo` or module-scope.
- [P2] Portfolio per-file upload has no progress bar — `step-portfolio.tsx:77–86`. Fix: shadcn `<Progress>`.

**`/onboarding/pending`**
- [P1] Decorative blur circles + animated icons on status page — :55–63. Fix: plain card.
- [P2] Cooldown re-renders every 1 s via `setInterval` — :29. Fix: cleanup + render-on-tick.
- [P3] Silent auto-redirect on approval — :44–47. Fix: toast → delay → redirect.

**Caster pages (excl. dashboard)**
- [P2] Empty states have no inline CTA — `caster/jobs/list.tsx:14`. Fix: pass `action` prop.
- [P2] Skeleton loader counts don't match expected data. Fix: SSR fetch page 1.
- [P2] Talent grid `xl:grid-cols-4` no tablet step — `caster/talent/client.tsx:77`. Fix: `sm:grid-cols-2 xl:grid-cols-3`.
- [P2] Talent cards show no portfolio preview. Fix: aspect-square portfolio thumb.
- [P2] Filter inputs hit API on every keystroke. Fix: `useDebouncedValue(300)`.
- [P2] Settings save mutations have no success toast — `caster/settings/client.tsx:82`. Fix: `toast.success(...)`.
- [P2] `/caster/talent/shortlisted` is "Coming soon" placeholder in nav. Fix: hide link or render deliberate empty state.
- [P2] Messaging inbox unread badge wraps below date on mobile — `components/messaging/inbox.tsx:44–47`. Fix: `flex justify-between`.

**Artist pages**
- [P1] Delete-account button destructive-styled with no confirmation — `artist/settings/page.tsx:24–26`. Fix: `<AlertDialog>`.
- [P2] Portfolio thumbnails missing primary-photo badge / caption — `artist/portfolio/client.tsx:78–96`. Fix: overlay badge + caption.
- [P2] Hardcoded `bg-amber-500/90` — `:86`. Fix: token.
- [P2] Photo-count validation advisory not enforced — :75–76. Fix: disable continue until 3+.
- [P2] No pagination on `/artist/jobs`. Fix: cursor pagination or "Load more".
- [P2] Booking cards lack job title. Fix: subtitle.
- [P3] Status badges lack tooltips.

### Legal

- [P0] AnimatedShinyText on legal-page eyebrow — `legal-layout.tsx:125–130`. Fix: static.
- [P0] BorderBeam in legal final-CTA — :155–160. Fix: remove.
- [P0] Hero heading splits into Instrument Serif italic ("Your data, *not theirs.*") — :133–136. Fix: single Geist Sans sentence.
- [P1] No max-width on body article wrapper — :75–95. Fix: `max-w-[70ch]`.
- [P2] Undefined `.prose-style` class — :76. Fix: remove or replace.
- [P2] Body `leading-[1.7]` too loose. Fix: `leading-relaxed`.

---

## Systemic Issues

1. **The gradient italic-serif `<span>` is the codebase's AI fingerprint.** Single codemod removes ~15 P0/P1 findings.
2. **auth-shell + onboarding-shell import the same atmosphere stack.** Shared refactor fixes 8 pages.
3. **ShimmerButton wired into every auth CTA.** Button-variant swap fixes 6 pages.
4. **BorderBeam used as decoration default.** 12+ instances, almost none load-bearing.
5. **AnimatedShinyText is the "eyebrow chip" default.** Replace with static `<Label>`.
6. **Instrument Serif italic overused as inline-span emphasis.** "One per page" rule violated on 9 of 11 routes that use serif.
7. **Identical card grids on marketing pages** where editorial layout is required.
8. **NumberTicker animates static numbers** on landing pages. Reserve for dashboard.
9. **Filter inputs hit API on every keystroke.** No debounce anywhere.
10. **Mobile responsive gaps concentrated in tables and 3+ col grids.**
11. **Sensitive-data leak on `/artists/[id]`** — Instagram `href` in DOM regardless of auth.

## Positive Findings (keep)

- `globals.css` correctly tokenized: brand ramp, `surface-0/50` tints, `prefers-reduced-motion` global override, `bg-plate` magazine-plate utility, `live-pulse` animation.
- Sensitive-data rules correctly applied on `/shoots` (city-only, company-only) and `/shoots/[id]` (locked address until contract).
- Auth forms: visible labels, inline error association, password strength meter, cooldown logic, autocomplete attrs, Google/Apple social-login present.
- AnimatedBeam in `/trust` (escrow flow) and `/how-it-works` is the rare justified motion moment.
- TrustMarquee and `live-pulse` indicators serve content.
- Better Auth + session SSR + skip-link landmark in `app/layout.tsx` are well-built.

---

## Action Checklist

Ordered by impact-per-effort. First three actions unblock ~60% of P0/P1.

- [x] **Action 1 — `/impeccable distill` strip auth-shell + onboarding-shell.** Remove `AnimatedGridPattern`, `Particles`, `AnimatedShinyText`, `backdrop-blur-xl`, form-card drop-shadow. Affects 11+ routes. ✅ Done.
- [x] **Action 2 — `/impeccable typeset` codemod the gradient italic-serif `<span>` across all h1s.** Strip the `bg-gradient-to-br ... bg-clip-text font-serif italic text-transparent` wrapper. Keep at most one Instrument Serif italic per page (zero on auth, legal, product UI). ✅ Done (auth + legal). Marketing per-page trimming deferred to action 7.
- [x] **Action 3 — `/impeccable distill` remove BorderBeam from non-load-bearing surfaces.** Sweep pricing-preview, casters, artists, trust, contact-content, shoots-content, shoot-detail-view, talent-content, legal-layout, how-it-works, hero, pricing page. ✅ Done — all 17 instances stripped across 12 files.
- [x] **Action 4 — `/impeccable harden` auth/onboarding ban list.** ShimmerButton swap (5 auth forms), `/suspended` CTA gradient + shadow, onboarding StepNav gradient + shadow, rejection-banner glass on `/onboarding/artist`, delete-account button styling (artist + caster). ✅ Done. Instagram href on `/artists/[id]` was already correctly gated — audit P0 was a false positive on re-read.
- [x] **Action 5 — `/impeccable layout` kill identical card grids on marketing.** Replaced 3-col feature grid (`/casters`), 4-col "Get started" (`/artists`), 4-col "privacy ladder" (`/trust`) with editorial numbered list, vertical timeline, and progressive ladder respectively. ✅ Done.
- [ ] **Action 6 — `/impeccable adapt` responsive sweep.** Caster comparison table mobile collapse, AnimatedBeam fallback on mobile, `/talent` grid steps, mobile filter row gap, password grid stacking `<sm`, messaging inbox badge alignment.
- [ ] **Action 7 — `/impeccable polish` eyebrow chip codemod.** Replace every AnimatedShinyText eyebrow with static tracked-label `<Label>` on `surface-50`. Same change across marketing, talent, contact, legal.
- [ ] **Action 8 — `/impeccable clarify` copy + microcopy fixes.** Remove em dashes ("→ —", "Not specified"), confirm-password label consistency, expand `/caster/settings/notifications` and `/caster/settings/billing` placeholders, `mailto:` precomposition for delete flows.
- [ ] **Action 9 — `/impeccable optimize` debounce + tighten loops.** `useDebouncedValue(300)` on filter inputs, memoize `calculateDobMax`, replace 1 s `setInterval` with on-tick render only.
- [ ] **Action 10 — `/impeccable harden` empty/loading/error coverage.** SSR-fetch first page for skeletons, `action` prop on `<EmptyState>`, save toast on `onSuccess`, tooltips on status badges, portfolio progress bar + 3-photo gate.
- [ ] **Action 11 — `/impeccable colorize` palette discipline.** Eyebrows `text-ink-600` not `text-primary`, validation errors ink + warning icon (not destructive), stat tiles one surface treatment, hardcoded `bg-amber-500/90` and `text-rose-300` → tokens.
- [ ] **Action 12 — `/impeccable distill` drop GlareHover, NumberTicker (on static landing values), OrbitingCircles (artists hero), AnimatedList stagger, AnimatedGridPattern (`/how-it-works` skew-y-12), MagicCard gradient on shoot detail bid panel.**
- [ ] **Action 13 — `/impeccable polish` final pass.** Stat tile typography (no `font-mono` for numbers), FAQ `<details>` open-state on `/pricing`, decorative Sparkles icon on `/how-it-works`, empty-state h3 serifs on `/artists/[id]`, separator overuse on `/shoots/[id]`.

---

## Action Log

### Action 1 — strip auth-shell + onboarding-shell (2026-05-22)

**Files touched:**
- `apps/web/components/auth/auth-shell.tsx` — removed `AnimatedGridPattern`, `Particles`, `AnimatedShinyText` imports + usage; removed `backdrop-blur` on eyebrow pill; removed `backdrop-blur-xl` + `shadow-[0_28px_90px_-30px_rgba(0,0,0,0.7)]` on form card. Kept the two soft color washes (tonal atmosphere, not glass).
- `apps/web/components/onboarding/onboarding-shell.tsx` — removed `AnimatedGridPattern`, `Particles` imports + usage; removed `backdrop-blur-sm` on header; removed `backdrop-blur-xl` + drop-shadow on tips sidebar card.

**Verification:** `bunx tsc --noEmit` exit 0. No broken importers from the two shells.

**Downstream impact:** every auth route (`/login`, `/register`, `/register/{caster,artist}`, `/forgot-password`, `/reset-password`, `/reset-password/[token]`, `/verify-email`, `/verify-email/[token]`, `/suspended`) and every onboarding step (`/onboarding/{caster,artist,pending}`) now renders without the three banned layers and without the form-card drop-shadow.

**Not addressed (scheduled):** auth headings still contain gradient italic-serif spans (action 2); ShimmerButton still wired into form CTAs (action 4); `/suspended` CTA gradient + shadow (action 4); rejection-banner glass on `/onboarding/artist` (action 4); StepNav gradient button (action 4).

### Action 2 — gradient italic-serif span codemod (2026-05-22)

**Files touched:**
- `apps/web/app/login/page.tsx` — heading collapsed to plain string "Sign in to CastFlow."
- `apps/web/app/register/page.tsx` — "Pick the side you're on."
- `apps/web/app/register/caster/page.tsx` — "Open your caster account."
- `apps/web/app/register/artist/page.tsx` — "Apply as an artist."
- `apps/web/app/forgot-password/page.tsx` — "Forgot your password?"
- `apps/web/app/reset-password/page.tsx` — "Reset link missing."
- `apps/web/app/reset-password/[token]/page.tsx` — "Choose a new password."
- `apps/web/app/verify-email/page.tsx` — "Check your inbox."
- `apps/web/app/verify-email/[token]/page.tsx` — "Confirm your email."
- `apps/web/components/legal/legal-layout.tsx` — hero h1 renders `{title} {titleAccent}` as plain text; FinalCta h2 "Talk to a human anytime." stripped of the trailing italic-serif span.

**Verification:** `bunx tsc --noEmit` exit 0. No regressions; the 9 auth pages and 2 legal pages render their headings as plain Geist Sans semibold with no gradient, no italic, no serif.

**Scope policy:** action 2's narrow codemod targets the `bg-gradient-to-br ... bg-clip-text font-serif italic text-transparent` pattern (auth-only in this codebase) plus the split-line italic-serif accent on legal-layout (zero serif on legal per policy). Marketing-page Instrument Serif italic abuse (multiple moments per page on `/casters`, `/artists`, `/pricing`, `/trust`, `/contact`, `/shoots`, `/talent`) is per-page judgment work and is deferred to action 7. Section h2 `font-serif` (non-italic) on legal-layout left as-is for now — action 13 polish covers it.

### Action 3 — BorderBeam sweep (2026-05-22)

**Files touched (17 instances across 12 files):**
- `apps/web/components/landing/sections/hero.tsx` — hero photo column (brand-300→brand-700 beam).
- `apps/web/components/landing/sections/pricing-preview.tsx` — two beams on the "Most popular" tier card; fragment collapsed since only the badge `<span>` remained.
- `apps/web/app/casters/page.tsx` — final-CTA panel beam.
- `apps/web/app/artists/page.tsx` — hero "This month" stat card beam + final-CTA panel beam.
- `apps/web/app/how-it-works/how-it-works-content.tsx` — final-CTA panel beam.
- `apps/web/app/shoots/shoots-content.tsx` — featured-hero card beam + final-CTA panel beam.
- `apps/web/app/shoots/[id]/shoot-detail-view.tsx` — hero image beam.
- `apps/web/app/talent/talent-content.tsx` — featured-artist hero beam + final-CTA panel beam.
- `apps/web/app/trust/page.tsx` — final-CTA panel beam.
- `apps/web/app/pricing/page.tsx` — final-CTA panel beam.
- `apps/web/app/contact/contact-content.tsx` — SLA card beam + final-CTA panel beam.
- `apps/web/components/legal/legal-layout.tsx` — FinalCta beam.

All imports of `BorderBeam` also removed from the same 12 files. The component file at `components/ui/border-beam.tsx` is kept (no live consumers but cheap to leave for now; can be deleted in a later cleanup if no consumer reappears).

**Verification:** `bunx tsc --noEmit` exit 0. Final grep confirms zero remaining `BorderBeam` references outside the component definition itself.

**What this clears:** all the "pulsing animated border on hero / CTA / pricing / SLA / featured-artist / legal-footer" instances called out as P0/P1 throughout the audit. Cards revert to their flat hairline-ring + tonal-lift styling per the no-shadow, hairline-only design rules.

### Action 4 — harden auth/onboarding ban list (2026-05-22)

**ShimmerButton → solid pill button** across 5 auth forms:
- `app/login/login-form.tsx`
- `app/register/caster/register-form.tsx`
- `app/register/artist/register-form.tsx`
- `app/forgot-password/forgot-form.tsx`
- `app/reset-password/reset-form.tsx`

Each ShimmerButton replaced with native `<button>`:
```
inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full
bg-[var(--cta-400)] px-6 text-sm font-semibold text-[#1c1108] transition-colors
hover:bg-[var(--cta-400)]/90 disabled:cursor-not-allowed disabled:opacity-60
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-400)]/60
focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-900)]
```
plus `aria-busy={mutation.isPending}` for screen-reader feedback while submitting. Imports of `ShimmerButton` removed from all 5 files.

**`/suspended` CTA + icon wrapper** — `app/suspended/page.tsx`:
- CTA `<a>` lost `bg-gradient-to-br from-cta-400 to-cta-500`, lost `shadow-[0_10px_30px_-12px_rgba(249,162,108,0.55)]`, lost the literal `#fab17f`/`#e88a4b` hover stops. Now solid `bg-[var(--cta-400)]` with hover-darken + focus-ring matching the auth pill style. `rounded-xl` → `rounded-full`.
- ShieldAlert icon wrapper lost `backdrop-blur-xl`.

**Onboarding StepNav button** — `components/onboarding/step-nav.tsx`:
- Lost `bg-gradient-to-br from-cta-400 to-cta-500`, lost `shadow-[0_10px_30px_-12px_...]`, lost the literal hex hover gradient. Now solid pill (`rounded-full`, `bg-[var(--cta-400)]`, hover-darken, focus-ring, `aria-busy`). `disabled:shadow-none` line removed (no shadow anymore).

**Onboarding rejection banner** — `app/onboarding/artist/page.tsx:322`:
- Lost `backdrop-blur-xl` on the alert. Bumped fill from `bg-rose-400/[0.06]` → `bg-rose-400/[0.08]` so the panel still reads clearly without the blur.

**Delete-account button styling** — `app/(artist)/artist/settings/page.tsx`, `app/(caster)/caster/settings/client.tsx`:
- The destructive `<Button>` was a `<Link>` to an info page that explains manual email-based deletion. Not actually destructive. Changed variant `destructive` → `outline` so the visual matches behavior. Confirm dialog not added — would be theater for a navigation-only button (no client-side delete action exists).

**Instagram href on `/artists/[id]`** — false positive:
- Audit P0 claimed the Instagram handle leaked in the DOM for non-casters. On re-read, the conditional at lines 170–188 already correctly gates rendering: casters see the `<a href=...>` link, non-casters see a `<Link>` to login with a Lock icon and no handle. ProfileCard `handle` prop at line 88–92 also uses `isCaster && profile.instagramHandle` with a `firstName.toLowerCase()` fallback. No code change required.
- Caveat: the mock data still ships `profile.instagramHandle` to the client as JS state regardless of role. Real fix lives server-side once `/talent/:id` becomes public; tracked separately.

**Verification:** `bunx tsc --noEmit` exit 0. Remaining `ShimmerButton` consumers are the two marketing `shimmer-button-link.tsx` wrappers (homepage hero, `/casters` hero) — out of action 4 scope, deferred to a later marketing pass.

### Action 5 — kill identical card grids (2026-05-22)

**`/casters` feature grid → editorial numbered list** — `app/casters/page.tsx:195–209`
- Was: `grid gap-4 md:grid-cols-2 lg:grid-cols-3` of 6 identical `rounded-2xl border` icon + heading + body cards.
- Now: a divider-separated vertical list. Each feature gets a row with `01–06` mono number on the left, oversized title (`text-2xl sm:text-3xl`) and body in the middle, and the icon chip pushed to the right column on `lg+` only. Top + bottom hairline framing the block; rows separated by `divide-y divide-border/60`. No cards.

**`/artists` "Get started" → vertical numbered timeline** — `app/artists/page.tsx:319–336`
- Was: `grid gap-4 md:grid-cols-2 lg:grid-cols-4` of 4 identical card tiles.
- Now: an `<ol>` rendering each step with a circular `01–04` marker on the left rail, a hairline `bg-border` connector dropping from each marker to the next, and the step title + body running to the right. Oversized titles (`text-2xl sm:text-3xl`), icon appears inline next to the title on `sm+`. Genuinely sequential reads as a flow, not four parallel tiles.

**`/trust` privacy ladder → progressive ladder** — `app/trust/page.tsx:190–197`, `:340–`
- Was: `grid gap-4 lg:grid-cols-4` of 4 identical `PrivacyStageCard` tiles, with the final stage given a `border-primary shadow-md` accent (the only thing differentiating them).
- Now: `PrivacyStageCard` replaced by `PrivacyStageRow`. Vertical `<ol>` with stage markers that *intensify* down the ladder via `STAGE_DOT_BG`:
  - `public` → empty `bg-background` with `border-border`
  - `shortlist` → `bg-primary/10`
  - `booking` → `bg-primary/25`
  - `signed` → solid `bg-primary` with `text-primary-foreground`
  Connecting rail switches to `bg-primary/60` between the signed marker and what came before. The visual now reads "data unlocks progressively," which was the conceptual point the four flat cards never communicated. `PrivacyList` left intact — moved into a 2-col sub-grid so each row shows "Caster sees / Artist sees" side by side at `sm+`.

**Pillars section on `/trust` left alone** — the audit's [P1] verdict for that section was "icon cards are inherently a grid; OK at 4 cols" so it stays.

**Verification:** `bunx tsc --noEmit` (from `apps/web/`) exit 0. The three sections render without any identical-card-grid pattern; mobile collapses cleanly since each replacement was already vertical-first.
