import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Placeholder photography pending real testimonial assets. Allowlist
      // so next/image doesn't error on the marketing surfaces that still
      // use these. Replace before launch.
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
}

export default nextConfig
