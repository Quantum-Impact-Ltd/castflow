import { describe, expect, it } from 'bun:test'
import { app } from '../src/index'

describe('GET /health', () => {
  it('returns the canonical success envelope with status ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean; data: { status: string; env: string } }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
    expect(body.data.env).toBeDefined()
  })
})

describe('Unknown route', () => {
  it('returns a structured 404 envelope', async () => {
    const res = await app.request('/api/v1/this-does-not-exist')
    expect(res.status).toBe(404)
    const body = (await res.json()) as {
      success: boolean
      error: { code: string; message: string }
    }
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
    expect(body.error.message).toBe('Route not found')
  })
})

describe('GET /api/auth/get-session', () => {
  it('is forwarded to Better Auth instead of the app 404 handler', async () => {
    const res = await app.request('/api/auth/get-session')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('null')
  })
})
