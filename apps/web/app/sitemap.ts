import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Static-only for now: dynamic detail routes (artists/[id], shoots/[id])
// require a public list endpoint and live data. Add a second sitemap or
// extend this one once those endpoints land.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '/', priority: 1.0, freq: 'weekly' },
    { path: '/how-it-works', priority: 0.8, freq: 'monthly' },
    { path: '/pricing', priority: 0.9, freq: 'monthly' },
    { path: '/talent', priority: 0.8, freq: 'daily' },
    { path: '/shoots', priority: 0.8, freq: 'daily' },
    { path: '/artists', priority: 0.6, freq: 'weekly' },
    { path: '/casters', priority: 0.6, freq: 'weekly' },
    { path: '/contact', priority: 0.4, freq: 'yearly' },
    { path: '/trust', priority: 0.5, freq: 'monthly' },
    { path: '/terms', priority: 0.3, freq: 'yearly' },
    { path: '/privacy', priority: 0.3, freq: 'yearly' },
    { path: '/register', priority: 0.7, freq: 'yearly' },
    { path: '/login', priority: 0.4, freq: 'yearly' },
  ]
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))
}
