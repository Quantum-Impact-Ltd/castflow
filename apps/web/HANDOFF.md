# Public-pages handoff — `apps/web`

Last updated: 2026-05-19. Public marketing surface is complete; auth and
authenticated panels are still untouched.

## Status

| Route                | State    | Notes                                                                 |
| -------------------- | -------- | --------------------------------------------------------------------- |
| `/`                  | shipped  | landing (pre-existing). Final CTA uses light dot-grid, not BorderBeam.|
| `/how-it-works`      | shipped  | AnimatedBeam + NumberTicker + AnimatedList + AnimatedGridPattern.     |
| `/casters`           | shipped  | Marquee + ShimmerButton + AvatarCircles + AnimatedShinyText.          |
| `/artists` (mktg)    | shipped  | OrbitingCircles + BorderBeam + 3-artist preview → `/talent`.          |
| `/artists/[id]`      | shipped  | Uses ProfileCard (`components/card/`); profile-card.css was tuned.    |
| `/talent`            | shipped  | Directory grid using GlareHover. 12 mock artists.                     |
| `/shoots`            | shipped  | Public job feed. 9 mock shoots. Image-led cards.                      |
| `/shoots/[id]`       | **404**  | Card links exist but the detail page hasn't been built.               |
| `/pricing`           | shipped  | 3 tiers, comparison table, FAQ via `<details>`.                       |
| `/trust`             | shipped  | 4 pillars + privacy ladder + escrow flow + dispute outcomes.          |
| `/contact`           | shipped  | RHF + Zod form; submission is mocked (toast).                         |
| `/terms`             | shipped  | 11 sections, shared `LegalLayout`.                                    |
| `/privacy`           | shipped  | 11 sections, shared `LegalLayout`.                                    |
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/onboarding` | stubs / pre-existing | Out of scope for this pass. |

Every dark final-CTA panel uses a white `BorderBeam` for consistency.

## Stack additions during this work

- **`motion`** (`12.x`) installed for Magic UI components.
- **Magic UI components**, copied locally into `components/ui/`:
  - `animated-beam`, `animated-grid-pattern`, `animated-list`, `animated-shiny-text`
  - `avatar-circles`, `border-beam`, `glare-hover`, `marquee`, `number-ticker`
  - `orbiting-circles`, `shimmer-button`
- **Keyframes** added to `app/globals.css` for those that need them:
  `shimmer-slide`, `spin-around`, `shiny-text`, `orbit`. The pre-existing
  `marquee-x` is reused by the new Magic UI Marquee.
- **ProfileCard** at `components/card/` (React Bits source) — `profile-card.css`
  was rewritten to (a) make the avatar `object-fit: cover` fill the card,
  (b) tone down the holographic shine/glare to readable levels,
  (c) overlay the top title on a soft gradient instead of purple gradient text.
- **`/talent` card pattern** uses `GlareHover` to replace a pile of competing
  pills. Don't add more pills to that card.

## MCP servers (this directory)

`apps/web/.mcp.json` registers:

- **`shadcn`** — `npx shadcn@latest mcp` — used to install components and
  pull from registries.
- **`magic-ui`** — already configured higher up; used for pulling animated
  components (search → get → write inline).

`components.json` `registries` block:

```json
"registries": {
  "@react-bits": "https://reactbits.dev/r/{name}.json"
}
```

So `npx shadcn@latest add @react-bits/<component-name>` will install from
React Bits. The Magic UI MCP exposes `mcp__magic-ui__searchRegistryItems` /
`getRegistryItem` for browsing without installing.

## Mock data layer

We don't have a public-lite backend endpoint yet — `/talent/:id` and
`/jobs` are caster-gated on the API. To unblock the public marketing pages
all data is mocked locally:

- `lib/mock/artists.ts` — 12 `PublicArtistProfile`s with `getMockArtist(id)` +
  `getMockReviews(id)` helpers, used by `/artists/[id]` and `/talent`.
- `lib/mock/shoots.ts` — 9 public-job records with a mock-only `imageUrl`
  field on each, used by `/shoots`.

When backend public endpoints land, swap `getMockArtist` → `useTalentProfile`,
`MOCK_ARTISTS` → `useTalentSearch`, `MOCK_SHOOTS` → a `useJobs` hook. Hooks
already exist in `lib/hooks/use-talent.ts` and `lib/hooks/use-reviews.ts`;
just remove the mock fallbacks. There's a TODO comment in
`app/artists/[id]/artist-profile-view.tsx` marking the exact swap point.

## Conventions used throughout

- **Server Components by default**; only `'use client'` when a section needs
  state (forms, filters, charts, motion that depends on refs).
- **Page split pattern** for client-heavy routes: `app/<route>/page.tsx` is a
  Server Component that imports `<RouteContent />` from
  `<route>-content.tsx` (a client file). Used on `/shoots`, `/talent`,
  `/contact`, `/how-it-works`, `/artists/[id]`.
- **Typographic system**: serif italic accent inside an otherwise sans
  heading; mono-uppercase eyebrows; `surface-50` for alternating section
  backgrounds; `BorderBeam` for the dark inverse CTA panel.
- **Filter / select pills** on `/shoots` and `/talent` use the same
  `PillSelect` pattern (dark filled when non-default, surface-50 when
  default). Reuse when adding new filter UIs.
- **Card pattern** (image-led, on dark image): top-left = context pill,
  top-right = state indicator, bottom overlay = title + meta, optional
  text-only meta below the image. Keep to two visible pills max.
- **Magic UI components** are copied source, not installed via shadcn CLI,
  because of the registry overlap with existing components and to keep them
  auditable. If you need to bump them, regenerate via the MCP and diff.

## Known cleanup / next steps (in order of value)

1. **Build `/shoots/[id]`** — card clicks currently 404. Pull job-detail
   shape from `packages/types`. Match the image-led aesthetic of the feed.
2. **Wire the contact form** — replace the mocked `await new Promise` in
   `app/contact/contact-content.tsx` with a real POST. Resend is the
   intended transport per `apps/web/CLAUDE.md`.
3. **Swap mocks for live data** — once the backend exposes public-lite
   talent + jobs endpoints (need to split `/talent/:id` into a public read
   and a caster-detail read). Search for "Using mock data while" comments.
4. **Surface `/talent` in the nav** — currently only in the footer and
   from `/artists` and `/casters`. Could replace "For artists" with a
   "Talent" link or add it as a fifth item.
5. **Auth pages** — `/login`, `/register`, etc. are pre-existing stubs that
   weren't touched in this pass. Better Auth client is already wired in
   `lib/auth-client.ts`. Note: destructured `useSession` is currently
   non-callable due to better-auth types — use `authClient.useSession()`.
6. **Landing's `FinalCtaSection`** is the only final CTA that does NOT get
   the white BorderBeam (it uses a light dot-grid panel, not the dark
   inverse). Decide whether to unify or leave as is.

## Useful files to read first in a new session

- `apps/web/CLAUDE.md` — frontend conventions (data flow, server-vs-client,
  sensitive-data rules).
- `apps/api/CLAUDE.md` and `apps/api/prisma/CLAUDE.md` — needed when the
  next task touches data shapes.
- `docs/PRD.md` — source of truth for the business rules cited in
  `/trust`, `/pricing`, and `/terms`.
- `apps/web/components/ui/` — newly added Magic UI primitives.
- `apps/web/lib/mock/` — current talent and shoots mock data.

## Quick smoke-test routes

```
/             /how-it-works   /casters    /artists    /artists/maya-okafor
/talent       /shoots         /pricing    /trust      /contact
/terms        /privacy
```

The artist profile id can be any of: `maya-okafor`, `daniel-reyes`,
`iris-calloway`, `theo-mensah`, `eleanor-park`, `amelia-fitzgerald`,
`rafe-okonkwo`, `priya-shankar`, `jude-blackwell`, `noor-haddad`,
`oscar-langley`. Unknown ids fall back to Maya.
