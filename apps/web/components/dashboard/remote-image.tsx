import Image, { type ImageProps } from 'next/image'

/**
 * next/image for user-generated content served from Cloudflare R2. The R2
 * public host is a runtime env var the web build can't know ahead of time
 * (it may be a *.r2.dev URL or a custom domain), so we render these
 * `unoptimized` — this bypasses the remotePatterns allowlist and the Image
 * Optimization API while keeping the ergonomics (and lint compliance) of
 * next/image. Marketing/static imagery still uses optimized <Image>.
 */
export function RemoteImage(props: ImageProps) {
  return <Image unoptimized {...props} />
}
