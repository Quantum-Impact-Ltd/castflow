// Public marketing-site origin. Used by metadata, OG, sitemap, robots, and
// anywhere absolute URLs need to leave the frontend (e.g. social share
// links). Defaults to the production hostname so previews and local dev
// don't accidentally ship localhost URLs in <link rel="canonical">.
export const SITE_URL =
  process.env['NEXT_PUBLIC_SITE_URL']?.replace(/\/+$/, '') ?? 'https://castflow.co.uk'

export const SITE_NAME = 'CastFlow'

export const SITE_DEFAULT_OG = `${SITE_URL}/og-default.png`
