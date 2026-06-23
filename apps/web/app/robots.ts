import type { MetadataRoute } from 'next'
import { SITE_URL, IS_PUBLIC_PRODUCTION } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  // Non-production (staging/preview) deploys are blocked from crawling
  // entirely so they never get indexed alongside — or instead of — prod.
  if (!IS_PUBLIC_PRODUCTION) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep private surfaces out of search results. Onboarding,
        // verification, password-reset, dashboards, and the suspended page
        // all sit behind auth — indexing them just wastes crawler budget
        // and risks leaking tokens via search engine caches.
        disallow: [
          '/api/',
          '/onboarding/',
          '/verify-email/',
          '/reset-password/',
          '/forgot-password',
          '/artist/',
          '/caster/',
          '/admin/',
          '/suspended',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
