import type { NextConfig } from 'next'

// Absolute origin of the API (Railway). When set, browser API calls are
// proxied through this Vercel deployment (see rewrites) so the Better Auth
// session cookie is first-party to the frontend domain — otherwise the API on
// a different domain sets a cross-site cookie the server-side auth guards can
// never read. Unset locally, where the browser talks to the API directly.
const API_ORIGIN = process.env.API_ORIGIN

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Placeholder photography pending real testimonial assets. Allowlist
      // so next/image doesn't error on the marketing surfaces that still
      // use these. Replace before launch.
      { protocol: 'https', hostname: 'picsum.photos' },
      // Cloudflare R2 public bucket (portfolio photos, logos, job covers).
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
  // Proxy API + auth traffic to Railway so it's same-origin in the browser.
  // No-op locally (API_ORIGIN unset) where NEXT_PUBLIC_API_URL points straight
  // at the API.
  async rewrites() {
    if (!API_ORIGIN) return []
    return [
      { source: '/api/auth/:path*', destination: `${API_ORIGIN}/api/auth/:path*` },
      { source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` },
    ]
  },
}

export default nextConfig
