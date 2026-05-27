---
name: CastFlow
description: The financial-grade rail for a creative industry.
colors:
  brand-50:  "#eef6fb"
  brand-100: "#d6e8f3"
  brand-200: "#b3d4e8"
  brand-300: "#85bcda"
  brand-400: "#5fa3cc"
  brand-500: "#3a8dc4"
  brand-600: "#2f77a8"
  brand-700: "#2a6b96"
  brand-800: "#245878"
  brand-900: "#1e4a64"
  cta-400:   "#f9a26c"
  cta-500:   "#e67e3e"
  ink-900:   "#0d1b26"
  ink-700:   "#1f3441"
  ink-600:   "#475569"
  ink-400:   "#94a3b8"
  surface-0:  "oklch(0.98 0.006 240)"
  surface-50: "oklch(0.955 0.01 240)"
  border:     "oklch(0.91 0.008 240)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(4rem, 12vw, 9rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  editorial:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(3.5rem, 10vw, 7.5rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Geist, ui-sans-serif, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist, ui-sans-serif, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Geist, ui-sans-serif, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm:   "6px"
  md:   "8px"
  lg:   "10px"
  xl:   "14px"
  "2xl": "18px"
  "3xl": "22px"
  "4xl": "26px"
spacing:
  xs:  "8px"
  sm:  "12px"
  md:  "24px"
  lg:  "56px"
  xl:  "96px"
  "2xl": "160px"
components:
  button-primary:
    backgroundColor: "{colors.brand-500}"
    textColor: "{colors.surface-0}"
    rounded: "{rounded.4xl}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-600}"
    textColor: "{colors.surface-0}"
  button-shimmer:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.surface-0}"
    rounded: "{rounded.4xl}"
    padding: "0 24px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.4xl}"
    padding: "0 12px"
    height: "36px"
  card-flat:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "36px"
  chip-brand:
    backgroundColor: "{colors.brand-50}"
    textColor: "{colors.brand-700}"
    rounded: "{rounded.4xl}"
    padding: "4px 10px"
    height: "24px"
---

# Design System: CastFlow

## 1. Overview

**Creative North Star: "The Financial-Grade Rail"**

CastFlow is infrastructure for a creative industry — the rail that carries money, contracts, and reputation between casters and artists. The design system reads as serious utility for creative people. Stripe-restraint in the chrome, editorial confidence in the typography, real photography of real talent where photography appears at all. The aesthetic explicitly rejects the two reflexes the casting category trains for: the glamour-coded gatekeeper (Models.com severity) and the bargain-coded marketplace (Fiverr clutter). CastFlow is neither. It is the adult version of this.

The system runs on tinted neutrals with one decisive blue accent (Infrastructure Blue, `#3a8dc4`) and a sparing warm secondary (Set Light, `#f9a26c` / `#e67e3e`) reserved for shimmer-button sweeps and eyebrow callouts. Every neutral carries a 240° hue undertone — pure `#fff` and pure `#000` are banned at the stylesheet level. Surfaces alternate between two tints to pace the page editorially; cards are flat with a hairline ring, never glassmorphic, never elevated by drop-shadow.

Photography is a first-class element when it appears: real artist portraits in featured strips and profile pages, designed brand-tinted "magazine plates" as honest placeholders elsewhere. Motion is multi-moment (marquees, count-ups, scroll reveals, shimmer sweeps) but every effect earns its space — comprehension first, decoration never.

**Key Characteristics:**
- One decisive brand color (`#3a8dc4`) carrying ~30% of surface presence through drenched sections + CTAs.
- Warm CTA accent (`#f9a26c` → `#e67e3e`) deployed sparingly on shimmer buttons and eyebrow ornaments only.
- Geist Sans for everything operational, Instrument Serif for one editorial moment per page.
- Flat surfaces with hairline rings — no drop-shadow vocabulary, ever.
- Pill-shaped controls (26px radius / `rounded-4xl`) on a 10px base radius scale.
- All neutrals tinted toward 240° at low chroma; `#fff` and `#000` are prohibited literals.
- Magic UI motion library available (marquee, shimmer, shine, orbit, number-ticker) but disciplined.
- Dark mode is defined for future authenticated UI; unused on marketing surfaces.

## 2. Colors

A restrained system: one saturated brand color (Infrastructure Blue) carries identity, one warm pair (Set Light) plays the CTA accent role, and every neutral leans 240° to keep the page warmly cool rather than stark.

### Primary
- **Infrastructure Blue** (`#3a8dc4` / `brand-500`): The hero color. CTAs, brand marks, focus rings, link accents, chart-1 fills, drenched "Why CastFlow" section backgrounds. The full `brand-50 → brand-900` ramp exists for hover states (`brand-600`), AA-safe text on white (`brand-700`), tinted surfaces (`brand-50`), and dark backgrounds (`brand-800`/`brand-900`).
- **Infrastructure Blue – Hover** (`#2f77a8` / `brand-600`): Primary CTA hover and pressed state.
- **Infrastructure Blue – Text-Safe** (`#2a6b96` / `brand-700`): The only acceptable brand-blue for body-size text on white. Passes WCAG AA at 16px.

### Secondary
- **Set Light** (`#f9a26c` / `cta-400`): Warm CTA accent. Appears on shimmer-button sweeps, eyebrow icons, hover gradient endpoints. A film-set tungsten reference, not a generic SaaS warm.
- **Set Light – Deep** (`#e67e3e` / `cta-500`): The deeper warm end of the same gradient. Used as the lower stop on shimmer sweeps and a few hover states.

### Neutral
- **Ink** (`#0d1b26` / `ink-900`): Primary text, near-black with a cool brand undertone. Never `#000`.
- **Ink Medium** (`#1f3441` / `ink-700`): Sub-headings, body emphasis.
- **Ink Soft** (`#475569` / `ink-600`): Secondary text, captions, metadata.
- **Ink Faint** (`#94a3b8` / `ink-400`): Tertiary text, disabled, placeholders.
- **Canvas** (`oklch(0.98 0.006 240)` / `surface-0`): Page background. A 240°-tinted off-white. The page reads as warmly cooled, not stark.
- **Canvas Raised** (`oklch(0.955 0.01 240)` / `surface-50`): Section alternation tier. Slightly stronger tint for editorial pacing.
- **Hairline** (`oklch(0.91 0.008 240)` / `border`): All dividers, card rings, input borders. Never thicker than 1px.

### Status
- **Considered Red** (`oklch(0.577 0.245 27.325)` / `destructive`): Disputes, cancellations, error states. Restrained; never used decoratively.

### Named Rules

**The Decisive Blue Rule.** Infrastructure Blue is decisive, never decorative. It marks CTAs, focus rings, brand moments, and drenched sections — nothing else. It is never a background wash without intent, never a gradient companion, never present "for vibe." The page is mostly neutral; the blue earns every appearance.

**The No-White, No-Black Rule.** Pure `#ffffff` and pure `#000000` are prohibited literals. Every neutral carries a 240° hue tint at low chroma. If a future utility references `#fff` or `#000`, replace with `surface-0` and `ink-900` respectively.

**The Single Saturated Color Rule.** Infrastructure Blue is the only saturated color used at marketing-page scale. Set Light is a sparing accent, never a co-equal hue. Pastel palettes, neon outlines, and rainbow data-viz are forbidden.

## 3. Typography

**Display Font:** Geist (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Editorial Accent:** Instrument Serif (with `Georgia, serif` fallback)
**Body Font:** Geist
**Mono Font:** Geist Mono (with `ui-monospace, monospace` fallback)

**Character:** A confident contemporary sans does every operational job — headlines, body, labels. Instrument Serif appears on **one editorial moment per page** (a hero line, a section opener) as a deliberate nod to magazine craft. The pairing is restrained on purpose: sans for clarity, serif for italic confidence, never both at once except in the hero.

### Hierarchy
- **Display** (Geist, 500, `clamp(4rem, 12vw, 9rem)`, line-height 1.05, letter-spacing −0.02em): Hero headline only. One per page maximum.
- **Editorial** (Instrument Serif, 400 italic, `clamp(3.5rem, 10vw, 7.5rem)`, line-height 1.05): The one editorial line per page that sits on its own — typically inside the hero, occasionally opening a feature section.
- **Headline** (Geist, 500, `clamp(2.25rem, 4vw, 3.5rem)`, line-height 1.1, letter-spacing −0.015em): Major section opening.
- **Title** (Geist, 500, 24px, line-height 1.3): Card title, sub-section.
- **Body** (Geist, 400, 17px, line-height 1.6): Default body. Max line length 65–75ch.
- **Body-sm** (Geist, 400, 14px, line-height 1.5): Captions, metadata, helper text.
- **Label** (Geist, 500, 13px, line-height 1.4, letter-spacing 0.04em): Eyebrow labels, button text, form labels. Lightly tracked for institutional voice.
- **Mono** (Geist Mono, 400, 14px, line-height 1.5): Transaction IDs, rate breakdowns, contract reference numbers. Never as default body.

### Named Rules

**The One Italic Rule.** Instrument Serif italic is reserved for one editorial moment per page. It is never used for body, never used for buttons, never used inside cards. Two italic moments on one screen is one too many.

**The Sans-Body Rule.** Body copy is Geist Sans. Serif body type is forbidden. (If `globals.css` still sets `font-serif` as the body default, that is a regression — fix it before shipping anything new.)

**The Tracked-Label Rule.** Labels and eyebrows carry +0.04em letter-spacing. This is the institutional-voice signal: confident, slightly typeset, never casual.

## 4. Elevation

CastFlow is a **flat-by-default** system. Depth is conveyed through tonal surface alternation (`surface-0` vs `surface-50`) and hairline rings (`border` at 1px), never drop shadows. The drenched "Why CastFlow" section uses `brand-800` as a full-bleed background to assert depth-by-color, not depth-by-shadow. Cards are flat planes with a 1px `ring-foreground/10` hairline; the only motion-driven elevation is a subtle `translateY(-2px)` on hover where appropriate.

### Shadow Vocabulary
None. The system intentionally has no shadow tokens. If a component needs apparent elevation, use:
- A tonal lift (move the surface from `surface-0` to `surface-50` or to `brand-50`).
- A hairline ring (`1px ring(ink-900 / 10%)`).
- A `translateY(-2px)` micro-lift on hover, paired with a transition.

### Named Rules

**The No-Shadow Rule.** `box-shadow` is forbidden on cards, buttons, panels, modals, and drawers in their resting state. Glassmorphic blurs (`backdrop-filter: blur(...)`) are forbidden as decorative defaults. Apparent depth is expressed through surface tint and hairline rings.

**The Hairline-Only Rule.** All borders are 1px. Side-stripe accents (a 3px or 4px colored border-left as a "callout" indicator) are prohibited. If a callout needs emphasis, use a full hairline ring and a `brand-50` background fill instead.

## 5. Components

### Buttons
The platform's button shape is decisively **pill** (rounded-4xl ≈ 26px) — a stronger commitment than the typical soft-radius shadcn default. The pill reads as a deliberate identity choice; never override it on a one-off basis.

- **Shape:** Pill, `rounded-4xl` (26px), 1px transparent border (becomes `ring` color on focus).
- **Sizes:** `xs` 24px, `sm` 32px, default 36px, `lg` 40px. Icon-only buttons follow the same height/width.
- **Primary:** `bg-primary` (Infrastructure Blue, `#3a8dc4`) with `surface-0` text. Hover: `bg-primary/80` (or `brand-600`). Pressed: 1px Y translate. Focus: 3px ring at `ring/50`.
- **Outline:** Transparent fill, `border` color hairline, `bg-input/30` background. Hover lifts to `bg-input/50`.
- **Ghost:** Transparent at rest, `bg-muted` on hover. No border. Used inside table rows and dense UI.
- **Secondary:** `bg-secondary` (the 240°-tinted off-white) with `secondary-foreground` (near-ink). Restrained — used when primary blue would be too loud.
- **Destructive:** `bg-destructive/10` fill, `text-destructive` foreground. Quiet, not alarming. Hover deepens to `/20`.
- **Link:** `text-primary` underline-offset-4, hover adds underline.

**Signature variant — Shimmer Button:** Used for the homepage hero CTA and one featured CTA per page. Ink-900 background, surface-0 text, pill shape, with an inset `cta-400 → cta-500` shimmer sweep animating across the surface (`--speed: 3s`). This is the system's **one allowed warm-color moment** at button scale. Never duplicate it elsewhere on the same page.

### Cards
- **Shape:** `rounded-2xl` (18px) — softer than buttons. The contrast is intentional: pill controls, rectangle-soft surfaces.
- **Background:** `surface-0` (page-aligned). Cards never sit on `surface-0` *background* with a `surface-0` *card* — alternate to `surface-50` or set the card on a `brand-50` tinted section.
- **Border:** `ring-1 ring-foreground/10` (the hairline). Never a thicker stroke.
- **Shadow:** None. See Elevation.
- **Internal padding:** 24px default, 16px in `size="sm"` variant.
- **Hover (when interactive):** `translateY(-2px)` + ring darkens to `/15`. Transition 200ms ease-out.

### Inputs
- **Shape:** `rounded-lg` (10px). Less pill, more functional.
- **Height:** 36px default. 40px for primary form contexts.
- **Background:** `transparent` on light surfaces, `surface-50` when on tinted sections.
- **Border:** `1px solid border` color. Focus: 3px `ring/50` ring at `brand-500`, plus the `border` shifts to `brand-500`.
- **Placeholder:** `ink-400`. Never use placeholder as label — labels are always visible.
- **Error:** Border `destructive/40`, ring `destructive/20`.

### Chips & Badges
- **Style:** Pill (`rounded-4xl`), 24px tall, 4×10 padding, label typography (13px / 500 / tracked).
- **Brand chip:** `bg-brand-50` + `text-brand-700`. Used for tags and "shortlisted" states.
- **Neutral chip:** `bg-surface-50` + `text-ink-700`. Used for filters and metadata.
- **No status-stripe variants.** A side-stripe colored border is not an acceptable chip style.

### Navigation
- **Style:** Sans, label-typography (13px tracked), `ink-700` at rest, `ink-900` on hover. Active state adds a 1px `brand-500` underline at `text-underline-offset: 6px`.
- **Primary CTA in nav** is always the pill Primary button, never an underlined link.
- **Mobile:** Drawer with full-width tap targets (≥44px). Never a hamburger jammed with 8 items — collapse to ≤5 primary destinations, surface the rest in a single "More" group.

### Signature Component — Magazine Plate
The fallback for "real photography not available yet." A brand-tinted block (`bg-brand-100`) with a radial dot-grid at 14px tile size and 8% ink dots, optionally captioned with the artist's name set in Instrument Serif italic. Looks intentional, never broken; signals "designed placeholder," not "missing image." Dark variant (`bg-plate-dark`) uses `brand-800` with `6%` white dots for use on dark inverted sections.

### Signature Component — Live Pulse Indicator
A 6px solid `success`-green dot with a `live-pulse` animation (1.8s ease-in-out, fades to 55% opacity and scales to 92%) paired with a tracked-uppercase "LIVE" label. Used on the homepage numbers strip and the active-shoots feed only — never decoratively.

## 6. Do's and Don'ts

### Do:
- **Do** use `#3a8dc4` (`brand-500`) as the only saturated identity color, and `brand-700` (`#2a6b96`) when blue meets body-size text on white.
- **Do** tint every neutral toward 240° — use `surface-0` / `surface-50` / `ink-*` tokens, never raw grays.
- **Do** keep buttons on `rounded-4xl` (26px pill) and cards on `rounded-2xl` (18px). The contrast between pill controls and softer surfaces is intentional.
- **Do** restrict Instrument Serif italic to **one editorial moment per page** — usually inside the hero.
- **Do** use the Shimmer Button for the page's primary CTA only. It is the one allowed warm-color moment at button scale.
- **Do** reserve real artist photography for places where it exists; use the Magazine Plate component (dot-grid brand tint) for honest placeholders elsewhere.
- **Do** honor `prefers-reduced-motion` — the global override in `globals.css` is non-negotiable.
- **Do** let sections breathe with 96–160px desktop vertical padding, but **earn the space** with substantial content.

### Don't:
- **Don't** use pure `#ffffff` or `#000000` — they are prohibited literals. Use `surface-0` and `ink-900`.
- **Don't** use side-stripe colored borders (`border-left: 4px solid …`) as callout accents. Use a full hairline ring and a `brand-50` fill instead.
- **Don't** use `background-clip: text` gradient text. Emphasis is via weight or size, never via gradient fill.
- **Don't** use `box-shadow` for card or button elevation. Surfaces are flat with hairline rings; depth is tonal.
- **Don't** ship glassmorphic blurs (`backdrop-filter`) as a default decorative treatment. Reserve for rare, purposeful uses.
- **Don't** lay out three-column "icon + heading + text" feature grids on the homepage. Editorial maximalism means every section has its own shape — the only allowed card grid is Pricing.
- **Don't** chase the anti-references from PRODUCT.md — Models.com gatekeeper severity, Fiverr/Upwork clutter, gradient-hero SaaS templates, Airbnb consumer warmth, "AI startup" neon-on-black aesthetics, agency-portfolio parallax-everything.
- **Don't** use serif type for body copy. The `font-serif` body default in legacy `globals.css` is a bug; if you see it, fix it.
- **Don't** use stock photography of "diverse smiling teams in meetings" or AI-generated faces. Real platform talent only; if it's not available, use a Magazine Plate or omit the placement.
- **Don't** write CTAs that say "Click here" or "Learn more." Every CTA is verb-led and specific: "Post your first shoot", "Find paid work", "Browse talent free".
- **Don't** apply dark mode to public marketing pages. Dark tokens exist for future authenticated UI; the marketing site is light-only.
- **Don't** add a second saturated accent color "for variety." Set Light is the only warm accent; everything else is the brand-blue family and tinted neutrals.
