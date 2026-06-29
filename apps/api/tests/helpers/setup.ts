/**
 * Test preload. Registered via `apps/api/bunfig.toml`'s `[test] preload` so it
 * runs before any test file resolves its imports. Registers module mocks for
 * Stripe + R2 so that downstream `import { stripe } from '../lib/stripe'`
 * (and the equivalent for r2) return the mocked singletons.
 *
 * Module specifiers in `mock.module(...)` must be resolvable from the file
 * that calls them. We use the absolute path to the real lib file via
 * `import.meta.dir` so it works regardless of how a consumer spells the
 * relative import. Bun normalises the resolution internally.
 */
import { mock } from 'bun:test'
import { resolve } from 'node:path'
import { stripeMock } from './stripe-mock'
import { r2Mock, BucketsMock } from './r2-mock'

const stripeLibPath = resolve(import.meta.dir, '../../src/lib/stripe.ts')
const r2LibPath = resolve(import.meta.dir, '../../src/lib/r2.ts')

mock.module(stripeLibPath, () => ({
  stripe: stripeMock,
}))

mock.module(r2LibPath, () => ({
  r2: r2Mock,
  Buckets: BucketsMock,
}))

// getSignedUrl signs offline from the client config, but r2Mock is a bare
// `{ send }` stub with no AWS middleware/config, so the real presigner throws.
// Return a deterministic fake signed URL that encodes the bucket + key so
// tests can assert the right object was targeted.
mock.module('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: async (_client: unknown, command: unknown) => {
    const input = (command as { input?: { Bucket?: string; Key?: string } }).input ?? {}
    return `https://signed.mock/${input.Bucket}/${input.Key}?sig=test`
  },
}))
