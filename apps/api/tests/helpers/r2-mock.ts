import { mock } from 'bun:test'

interface R2Call {
  command: string
  input: unknown
}

export const r2MockState = {
  calls: [] as R2Call[],
}

export function resetR2Mock(): void {
  r2MockState.calls.length = 0
}

/**
 * Minimal S3Client stand-in. We only need `.send(cmd)` to no-op and record
 * the command's class name + input so tests asserting "PDF uploaded" can
 * check that a `PutObjectCommand` was sent against the contracts bucket.
 */
export const r2Mock = {
  send: mock(async (command: unknown) => {
    const ctor = (command as { constructor: { name: string } }).constructor.name
    const input = (command as { input?: unknown }).input
    r2MockState.calls.push({ command: ctor, input })
    return { ETag: '"mocked-etag"' }
  }),
}

export const BucketsMock = {
  public: 'castflow-public',
  private: 'castflow-private',
  contracts: 'castflow-contracts',
} as const
