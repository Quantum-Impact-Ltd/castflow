// Public marketing-site origin. Used by metadata, OG, sitemap, robots, and
// anywhere absolute URLs need to leave the frontend (e.g. social share
// links). Defaults to the production hostname so previews and local dev
// don't accidentally ship localhost URLs in <link rel="canonical">.
export const SITE_URL =
  process.env['NEXT_PUBLIC_SITE_URL']?.replace(/\/+$/, '') ?? 'https://castflow.co.uk'

export const SITE_NAME = 'CastFlow'

export const SITE_DEFAULT_OG = `${SITE_URL}/og-default.png`

// Deploy environment. Only the canonical production deploy should be
// crawlable / indexable. Staging and preview deploys set
// NEXT_PUBLIC_SITE_ENV to something other than 'production' so robots.ts
// and the root metadata flip to noindex — otherwise a publicly reachable
// staging host gets indexed and (with SITE_URL falling back to prod) points
// crawlers at the production domain.
export const SITE_ENV = process.env['NEXT_PUBLIC_SITE_ENV'] ?? 'production'

export const IS_PUBLIC_PRODUCTION = SITE_ENV === 'production'

// The public Talent/Shoots pages can fall back to bundled mock data so the
// platform demos richly before there's real content. That is a DEMO-ONLY
// behaviour: on staging/prod it would silently render fabricated artists and
// shoots, so it is OFF unless explicitly enabled. Opt in per-deploy.
export const ENABLE_MOCK_FALLBACK =
  process.env['NEXT_PUBLIC_ENABLE_MOCK_FALLBACK'] === 'true'
