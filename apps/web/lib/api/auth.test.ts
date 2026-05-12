import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerArtist, registerCaster, getSession } from './auth'

interface FetchCall {
  url: string
  init: RequestInit
}

const calls: FetchCall[] = []
const originalFetch = globalThis.fetch

function mockResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  calls.length = 0
  globalThis.fetch = vi.fn(((input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} })
    return Promise.resolve(
      mockResponse({
        success: true,
        data: { user: { id: 'u1', email: 'jane@example.com' }, verificationEmailSent: true },
      })
    )
  }) as typeof globalThis.fetch)
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('lib/api/auth', () => {
  it('W7: registerArtist POSTs to /auth/register-artist', async () => {
    await registerArtist({
      email: 'jane@example.com',
      password: 'Strong1!',
      firstName: 'Jane',
      lastName: 'Doe',
      artistType: 'model',
    })
    expect(calls.length).toBe(1)
    expect(calls[0]!.url).toContain('/api/v1/auth/register-artist')
    expect(calls[0]!.init.method).toBe('POST')
    expect(calls[0]!.init.body).toContain('jane@example.com')
  })

  it('registerCaster POSTs to /auth/register-caster', async () => {
    await registerCaster({
      email: 'ops@acme.co',
      password: 'Strong1!',
      companyName: 'Acme',
      companyType: 'brand',
      contactName: 'Pat',
    })
    expect(calls.length).toBe(1)
    expect(calls[0]!.url).toContain('/api/v1/auth/register-caster')
    expect(calls[0]!.init.method).toBe('POST')
    expect(calls[0]!.init.body).toContain('Acme')
  })

  it('W8: services accept and forward AbortSignal', async () => {
    const controller = new AbortController()
    await registerArtist(
      {
        email: 'jane@example.com',
        password: 'Strong1!',
        firstName: 'Jane',
        lastName: 'Doe',
        artistType: 'model',
      },
      { signal: controller.signal }
    )
    expect(calls[0]!.init.signal).toBe(controller.signal)
  })

  it('getSession hits Better Auth proxy and returns null on non-OK', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response('forbidden', { status: 403 }))
    ) as typeof globalThis.fetch

    const result = await getSession()
    expect(result).toBeNull()
  })
})
