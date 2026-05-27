# CastFlow — Design Guidelines

This file is the canonical design context for CastFlow's **public-facing marketing site and authenticated marketplace UI**. It is read at the start of every design or frontend session and overrides default AI design instincts.

Scope: public website + marketplace UI. Admin/internal panels are out of scope here.

---

## Register

brand

---

## Design Context

### Users

CastFlow is a UK-only two-sided marketplace for commercial casting. The public site has to convert **two different audiences** with different jobs-to-be-done:

- **Casters** (primary, paying side) — brand marketing managers, creative producers, freelance art directors, small/mid agencies. Time-poor, deadline-driven, mid-30s+ professional. They land on the site because the current way of casting (WhatsApp + email + Excel + agency invoices) is broken. They are not browsing — they have a shoot in 2 weeks and a problem to solve. The job-to-be-done: *"Find verified talent, lock in a contract, pay safely, get it done."* They need to feel that this is a serious, professional, accountable platform — not another marketplace gimmick.

- **Artists** (supply side, model/actor) — UK-based, 18+, semi-pro or pro, often tired of agency gatekeeping and chasing invoices. Mostly mobile-first traffic. The job-to-be-done: *"Find paid work without an agency, get paid on time, build a reputation I own."* They need to feel that the platform is fair, that money is safe, and that being on the platform won't cheapen them.

**Context of use:** Both audiences arrive skeptical. Casting tooling has historically been either glamour-coded (Models.com style — exclusive, intimidating) or bargain-coded (Fiverr style — cluttered, cheap). CastFlow must clearly read as *neither*: it is professional infrastructure for a creative industry.

### Brand Personality

**Three words: Trusted. Considered. Effortless.**

- **Voice:** Calm, direct, expert. Confident without bragging. Plain language. Specifics over adjectives. ("Your money is held by Stripe until the shoot completes." not "Industry-leading payment security.")
- **Tone shift by audience:** Slightly more businesslike on caster-facing pages, slightly more empowering on artist-facing pages. Same core voice, different emphasis.
- **Emotional goals:** Confidence, relief, professionalism. The visitor should exhale and think *"finally, an adult version of this."*

### Aesthetic Direction

**One sentence:** *Calm professional, with editorial confidence — the financial-grade rail for a creative industry.*

**Closest references (in priority order):**
1. **Stripe** — for how it explains money flows, restrained color, generous type, trust-first information design.
2. **Linear marketing** — for typography rhythm, asymmetric layout discipline, motion restraint.
3. **Vercel marketing** — for modern editorial pacing, confident headline scale, contemporary section transitions.

**Explicit anti-references — do NOT chase these:**
- Models.com / fashion-industry sites — gatekeeper-coded, intimidating, monochrome severity.
- Fiverr / Upwork classic — cluttered, bargain-bin, kills the premium-trust pitch.
- Generic SaaS landing pages (hero gradient + three-column features) — invisible.
- Airbnb / consumer marketplaces — too soft and warm; undersells caster gravitas.
- Glassmorphism / neon / "AI startup" aesthetics — wrong industry, wrong tone.
- Typical creative-agency portfolios with parallax-everything and mouse-trail spectacle.

### Brand Color System

**Core brand color: `#3A8DC4`** — a mid-saturation, confident, professional blue. It says "infrastructure," not "creative tool."

**Usage rule:** decisive and sparing — primary CTAs, brand moments, key accents, hover/focus states. Never a wash. The site is mostly neutral; the blue does the heavy lifting where it appears.

**Recommended palette (build out in `globals.css`):**

| Role | Token | Value (sketch) | Notes |
|---|---|---|---|
| Brand / primary | `--brand-500` | `#3A8DC4` | The hero color. CTAs, brand marks. |
| Brand hover/pressed | `--brand-600` | `#2F77A8` | Slightly darker for hover. |
| Brand text on white (AA-safe) | `--brand-700` | `#2A6B96` | For body-size text that must read accessibly on white. |
| Brand tint surface | `--brand-50` | `#EEF6FB` | Pale wash for section backgrounds, callouts. |
| Brand tint border | `--brand-100` | `#D6E8F3` | Soft dividers on tinted surfaces. |
| Ink / foreground | `--ink-900` | `#0D1B26` | Near-black, slightly cool, primary text. |
| Muted ink | `--ink-600` | `#475569`-ish | Secondary text, captions. |
| Subtle ink | `--ink-400` | Light slate | Tertiary text, placeholders. |
| Surface | `--surface-0` | `#FFFFFF` | Default canvas. |
| Surface raised | `--surface-50` | `#F8FAFC`-ish cool off-white | Section alternation, cards. |
| Border default | `--border` | Cool gray ~`#E5EAF0` | Hairline dividers. |
| Success | `--success` | Calm green | Payouts, verified states. |
| Warning | `--warning` | Restrained amber | Deadlines, strikes. |
| Destructive | `--destructive` | Considered red | Disputes, cancellations. |

⚠️ **Existing `globals.css` currently uses a rose/red `oklch(0.514 0.222 16.935)` primary inherited from a shadcn default. Replace fully — `#3A8DC4` is the only correct brand color.**

⚠️ **Accessibility check on the brand color:**
- `#3A8DC4` on white: passes WCAG AA for **large text only** (3:1 contrast region). For body-size text on white, use `--brand-700` (`#2A6B96` or darker).
- White on `#3A8DC4`: passes AA for large text, **fails for small body text**. CTAs should use a slightly darker shade or upsize the text.
- Always validate final values with a contrast checker before committing.

### Typography

**Headings:** A confident contemporary sans with character. Default to **Geist** or **Inter Display** (both proven, free, performant). Optional editorial accent: **Fraunces** or **Instrument Serif** for *one* hero moment per page — a tasteful nod to the editorial industry without going full magazine. Use serif sparingly; never as body text.

**Body:** **Inter** or **Geist** at 16–17px base, 1.6 line-height. Generous, readable, professional.

**Mono (rare):** **Geist Mono** for any code-like UI (rate breakdowns, transaction IDs).

**Type scale (suggested, refine in implementation):**

| Token | Size / line | Use |
|---|---|---|
| `display` | 64–80 / 1.05 | Hero headline only |
| `h1` | 48–56 / 1.1 | Section opening |
| `h2` | 36–40 / 1.15 | Page section |
| `h3` | 24–28 / 1.3 | Card title, sub-section |
| `body-lg` | 18–20 / 1.55 | Lede paragraphs |
| `body` | 16–17 / 1.6 | Default body |
| `body-sm` | 14 / 1.5 | Captions, metadata |
| `mono-sm` | 13–14 / 1.5 | IDs, amounts in tables |

⚠️ **Existing `globals.css` sets `html { @apply font-serif }` as body default. Almost certainly wrong for a marketplace UI — serif body at small sizes is hard to read at scale. Switch body to sans, reserve serif for the optional editorial accent only. Confirm before applying.**

### Layout Philosophy

**Visual treatment locked: "Editorial maximalism."** *Magazine-grade homepage that knows it's a product. Bloomberg Businessweek × Vogue Business × confident brand-forward marketing. Supersedes the earlier "Editorial confidence (Vercel/Stripe-leaning)" call — that read as bland and absent without the substance behind it.*

- **Asymmetric magazine grid.** Not 3-card-grids-stacked. Each section has its own shape. Sections vary in width, depth, and density on purpose.
- **Section padding 96–160px desktop / 56–80px mobile**, but density EARNS the space — whitespace is never empty. If a section has 120px of vertical breathing room, something substantial fills it.
- **Hero scale:** display headline at `clamp(4rem, 12vw, 9rem)` (64–144px). Bigger than the previous attempt. Editorial italic line (Instrument Serif) sits on its own line as a true display moment.
- **Asymmetric hero:** typography left, editorial portrait right (~50/50 desktop, photo below text on mobile). The portrait is part of the hero, not a separate visual element.
- **Brand color is COMMITTED** (per /impeccable color-strategy axis): blue carries 30%+ of total page surface through structural use AND drenched section moments. The "Why CastFlow" section becomes a full-bleed brand-500 drenched moment (white text on blue), not a tinted-card grid.
- **No identical card grids.** Each section's content is laid out for its own meaning: hero is asymmetric; trust marquee is horizontal scroll; numbers strip is dense data; live shoots is editorial gallery (hero shoot + secondaries, not 3-up grid); featured artists is editorial portrait spread; why-castflow is drenched-section pillars; pricing is structured tier cards (the *one* card-grid allowed).
- **Photography is a primary visual element**, not decoration. Real artist portraits appear in hero, live shoots, featured artists section, and artist CTA band. Until real photography is in `apps/web/public/talent/`, use **designed placeholders**: brand-tinted blocks with subtle dot-pattern + artist name in Instrument Serif. Placeholders look intentional, never broken.
- **Cards (when used at all):** flat, hairline borders, generous internal padding, subtle hover-only shadow. Radius 12–16px. Never glassmorphic.

### Motion / Animation Approach

**Motion is now part of the brand, not a polish layer.**

- **Allowed and encouraged:** continuous-scroll trust marquee (slow, ~30s loop, hover pauses); hero headline word-stagger reveal on load; numbers count-up on scroll into view; scroll-triggered fade+translate reveals (24–40px y-shift, 500–700ms ease-out-expo); editorial portrait reveals via clip-path/mask on scroll; hover lifts and underline reveals on interactive elements; pulsing "live" indicator on the numbers strip.
- **Still disallowed:** parallax-everything, mouse-trail effects, bounce/elastic easings, decorative cursors, splash route transitions, gradient text, glassmorphic blurs as default.
- **`prefers-reduced-motion`** honored globally — all motion collapses to instant.
- **The "one wow per page" rule is retired** — multiple motion moments are now expected, but each one must serve content (the marquee proves trust, the counter proves activity, the reveal earns the hierarchy).

### Mobile-First

Every layout decision starts at 375px. Artist-side traffic is overwhelmingly mobile. Marketing-site mobile traffic is also dominant.

- Hero headline must work at 375px without truncation.
- CTAs are always thumb-reachable.
- Navigation collapses to a clean drawer — not a hamburger jammed with 8 items.
- Type scale steps down 1–2 sizes on mobile; never just shrinks the desktop layout.

### Accessibility

- **Target: WCAG 2.1 AA.** AAA where trivially achievable.
- **Contrast:** All body text ≥ 4.5:1. Large text ≥ 3:1. Validate every brand-color text combination with `--brand-700` fallback.
- **Focus states:** Always visible, never `outline: none` without a replacement. 2px focus ring in `--brand-500` with a 2px offset.
- **Keyboard navigation:** Full coverage. Skip-to-content link in the layout.
- **Screen reader:** Semantic HTML first, ARIA second. Headings ordered; landmarks named.
- **Reduced motion:** Honored globally (see Motion).
- **Image alt text:** Required for portfolio images (artist's name + context). Decorative images get empty alt.
- **Forms:** Labels always visible. Errors associated. No placeholder-as-label.

### Information Architecture (Public Site)

**Confirmed sitemap:**

```
/                      Homepage — caster-first hero, artist secondary path
/casters               For Casters — caster-facing pitch + CTA
/artists               For Artists — artist-facing pitch + CTA (and discovery)
/shoots                Public job feed — SEO + social-proof driver
/shoots/[id]           Public job detail — bidding gated behind sign-up
/how-it-works          End-to-end flow visualised for both sides
/pricing               Caster subscription tiers + commission explainer
/trust                 Verification, escrow, contracts, dispute resolution
/contact               Existing — keep minimal
/artists/[id]          Public artist profile (shareable, SEO-ready)

# Account plumbing (not marketing)
/register, /login, /forgot-password, /reset-password, /verify-email
/terms, /privacy
```

**Privacy rules on public /shoots:** Public job cards/details show title, category, city (not address), shoot date, rate or "Open to Bids", spots remaining, and caster *company name only*. The "Submit a bid" CTA is gated behind sign-up + admin approval. Shoot address remains hidden until contract is signed (per PRD §10.7).

**Deferred until post-launch:** About, Blog, Case studies, FAQ (folded into Trust + Pricing), Careers.

**Primary nav:** Logo · How it Works · For Casters · For Artists · Pricing · Trust · `Log in` · **`Get started →`** (primary CTA, blue)

### Conversion Flow

- **Caster funnel (primary):** Home → /casters → /how-it-works → /pricing → /register (caster) → email verify → dashboard.
- **Artist funnel:** Home (secondary CTA) or direct → /artists → /how-it-works → /register (artist) → 6-step onboarding → pending approval.
- **The homepage hero serves casters.** Artist entry is unambiguous but secondary — a clear "Are you a model or actor?" line with its own CTA, not a 50/50 split that dilutes both.

### Business Model (locked, supersedes PRD §11.2)

**Casters pay. Artists never pay a penny.**

- Casters are on a **monthly subscription + per-casting commission** model. Both revenue streams flow from the caster side.
- Artists keep **100% of their agreed rate** — no commission deducted from payout.

⚠️ **This supersedes PRD §11.2**, which currently describes a commission-from-artist-payout model. The PRD, the artist earnings dashboard ("gross → commission → net" breakdown), and the Stripe Connect split logic all need reconciliation against this corrected model. Flagged but not in scope for the marketing-site work — track separately.

**Paywall timing (locked):**
- **Free to register + browse + shortlist talent.**
- **Paywall hits on first job post.** Caster must pick a tier before posting.
- Implication for copy: "free to *post*" is **wrong** and must not appear anywhere. Acceptable framings: *"Free to explore"*, *"No card to sign up"*, *"Browse talent free — pay only when you post"*.

**Tier structure (placeholders until final pricing is set):**

| Tier | Posts / month | Seats | Use case | Monthly | Commission |
|---|---|---|---|---|---|
| **Starter** | 1 | 1 | Freelance producers, small brands | £XX | X% |
| **Studio** ★ Most popular | 3 | 3 | Mid-size brands, boutique agencies | £XX | X% |
| **Agency** | Unlimited | 10 | Full agencies, production houses | £XX | X% |

- **Commission rate should be flat across tiers** (default recommendation) — escalating commission punishes scale and confuses messaging. Override only if there's a deliberate reason.
- Tier names are working placeholders; final names follow brand-name decision.

**Marketing implications:**
- Artist-side pitch becomes much stronger: *"Keep 100% of what you earn. No agency cut. No platform cut."*
- Caster-side pitch reframes around *predictable monthly cost + per-booking fee, vs. opaque agency rates per shoot.*

### Brand Name / Wordmark

⚠️ **"CastFlow" is a working placeholder, not the final brand name.** Treat *"CastFlow"* set in **Geist Sans** as the wordmark for now — no custom logotype, no logo mark. When the final brand name is decided, the wordmark gets re-set and any brand-mark work can follow. Until then: avoid building anything that would be expensive to rename (custom SVG logos, favicons baked into images, hardcoded brand strings in copy beyond the obvious places).

### Photography

The team has an in-house photographer with real artist and shoot photography available. Treatment rules:

- **Hero (homepage):** Typography-only at launch — no photography. Photography may earn its way in later as a secondary visual moment.
- **Featured artists strip / Artist CTA band / public artist profiles:** Real photography lives here. Treat with restraint — consistent crop ratios, no decorative frames, no drop shadows. The talent does the work.
- **Never:** stock photography of "smiling teams in meetings," AI-generated faces, or generic models-from-Unsplash. Real platform talent only. If real photography isn't available for a placement, use typography or omit the placement entirely — better to have no image than a fake one.

### Content Hierarchy (per page, sketch)

- **Homepage:** Nav → Hero (caster-first, typography-only, Instrument Serif accent in headline) → The Flow (6-step compressed how-it-works) → Live shoots strip (from `/shoots`) → Why CastFlow (3 pillars on `--brand-50`) → Pricing tier preview (full tiers, not a teaser) → Artist CTA band (dark inverted) → Final caster CTA → Footer.
- **For Casters:** Hero → "Post in 5 minutes" walkthrough → Talent search / shortlist → Escrow + contract explained → Pricing detail → FAQ → CTA.
- **For Artists:** Hero → "Keep 100% of what you earn" → Real artist profiles → Verification + reputation story → Reviews system → CTA.
- **How it Works:** Side-by-side caster vs. artist timeline, the 10-step PRD §9.1 loop.
- **Pricing:** 2–3 caster subscription tiers + per-casting commission rate stated explicitly. Artist-side callout: "You keep 100% — there is no artist-side fee." FAQ inline.
- **Trust:** Verification process, escrow explained step-by-step, contract sample, dispute process, ToS/Privacy links.

---

## Design Principles

These are the rules that override default AI design instincts on every CastFlow design or frontend task.

1. **Trust is the product. Everything visual must reinforce that the platform is safe with money, contracts, and reputation.** When in doubt, choose the option that makes a skeptical professional exhale, not the one that makes a designer Dribbble-like.

2. **Restraint over ornament.** Whitespace, type scale, and one decisive blue accent do more than gradients, glows, and decorative shapes. If a section needs a flourish to feel finished, the typography or hierarchy is wrong.

3. **#3A8DC4 is decisive, not decorative.** It marks CTAs, brand moments, and key accents. It is never a background wash, never a gradient companion, never present "for vibe." The site is mostly neutral; the blue earns every appearance.

4. **Real content over placeholder.** No lorem ipsum, no stock-photo couples, no synthetic-looking AI imagery. Real artist portfolios (when available), real numbers, real copy. The casting industry is too visually literate to forgive fakeness.

5. **Two audiences, one voice, segmented hierarchy.** Casters lead on the homepage and earn the primary hero. Artists have a clear, dignified second path — never an afterthought, never a 50/50 split that confuses both.

6. **Mobile is the first frame, not the last.** Every layout starts at 375px. Desktop earns its expanded canvas by adding rhythm, not by being the source of truth.

7. **Motion serves comprehension. One "wow" per page, maximum.** Reveal animations clarify hierarchy; they don't replace it. `prefers-reduced-motion` is honored without exception.

8. **Accessibility is design, not compliance.** Contrast, focus, keyboard order, semantic structure — designed in from the start, not bolted on at audit.

---

## Anti-defaults (override these AI instincts on this project)

- ❌ Default shadcn rose primary — replace with `#3A8DC4` brand system everywhere.
- ❌ Body default `font-serif` in current `globals.css` — wrong; body is sans.
- ❌ Three-column "feature grid with icons" landing pattern — boring, unspecific.
- ❌ Hero gradient backgrounds, mesh gradients, animated blobs — wrong industry.
- ❌ Centered single-column marketing layout — too generic for the editorial confidence we want.
- ❌ Pastel-everywhere palette — saturated brand blue is the only saturated color used at scale.
- ❌ Stock photography of "diverse smiling people in meetings" — kills credibility instantly.
- ❌ Dark mode for the public site (MVP) — light-only is the confirmed direction.
- ❌ Glassmorphism, neon outlines, gradient text — wrong era and wrong industry.
- ❌ "Click here" / "Learn more" CTAs — every CTA is verb-led and specific ("Post your first shoot", "Find paid work").
