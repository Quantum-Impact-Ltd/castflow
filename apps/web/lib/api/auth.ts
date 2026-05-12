// Auth service layer — pure framework-agnostic async functions.
// Components/hooks must never call fetcher directly; they go through these.

import type {
  RegisterArtistInput,
  RegisterCasterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@castflow/validators'
import { fetcher } from '@/lib/fetcher'

export interface RegistrationResult {
  user: { id: string; email: string }
  verificationEmailSent: true
}

export interface SessionUser {
  id: string
  email: string
  role: 'artist' | 'caster' | 'admin'
  approvalStatus?: 'pending' | 'approved' | 'rejected' | null
  emailVerified?: boolean
  name?: string
}

interface FetcherInit {
  signal?: AbortSignal
}

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? ''

// Better Auth's handler is mounted at /api/auth — outside the /api/v1 path
// that `fetcher` prefixes — so register helpers use fetcher (under /api/v1)
// while Better-Auth-handled endpoints use a thin direct fetch.

interface BetterAuthRequestOpts extends FetcherInit {
  method?: 'POST' | 'GET'
  body?: unknown
}

async function betterAuthRequest<T>(path: string, opts: BetterAuthRequestOpts = {}): Promise<T> {
  const { method = 'POST', body, signal } = opts
  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  }
  if (body !== undefined) init.body = JSON.stringify(body)
  if (signal) init.signal = signal

  const res = await fetch(`${API_BASE}/api/auth${path}`, init)
  const text = await res.text()
  const payload = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    const err = payload as { code?: string; message?: string } | null
    throw Object.assign(new Error(err?.message ?? `Request failed (${res.status})`), {
      code: err?.code ?? 'AUTH_ERROR',
      status: res.status,
    })
  }
  return payload as T
}

export function registerArtist(
  input: RegisterArtistInput,
  init?: FetcherInit
): Promise<RegistrationResult> {
  return fetcher<RegistrationResult>('/auth/register-artist', {
    method: 'POST',
    body: input,
    ...init,
  })
}

export function registerCaster(
  input: RegisterCasterInput,
  init?: FetcherInit
): Promise<RegistrationResult> {
  return fetcher<RegistrationResult>('/auth/register-caster', {
    method: 'POST',
    body: input,
    ...init,
  })
}

export async function login(input: LoginInput, init?: FetcherInit): Promise<{ user: SessionUser }> {
  const res = await betterAuthRequest<{ user: SessionUser }>('/sign-in/email', {
    body: input,
    ...init,
  })
  return res
}

export async function logout(init?: FetcherInit): Promise<void> {
  await betterAuthRequest<unknown>('/sign-out', init)
}

export async function forgotPassword(
  input: ForgotPasswordInput,
  init?: FetcherInit
): Promise<void> {
  await betterAuthRequest<unknown>('/forget-password', {
    body: { ...input, redirectTo: '/reset-password' },
    ...init,
  })
}

export async function resetPassword(input: ResetPasswordInput, init?: FetcherInit): Promise<void> {
  await betterAuthRequest<unknown>('/reset-password', {
    body: { token: input.token, newPassword: input.password },
    ...init,
  })
}

export async function resendVerification(email: string, init?: FetcherInit): Promise<void> {
  await betterAuthRequest<unknown>('/send-verification-email', {
    body: { email },
    ...init,
  })
}

export async function getSession(init?: FetcherInit): Promise<{ user: SessionUser } | null> {
  const init2: RequestInit = { credentials: 'include', cache: 'no-store' }
  if (init?.signal) init2.signal = init.signal
  const res = await fetch(`${API_BASE}/api/auth/get-session`, init2)
  if (!res.ok) return null
  const data = (await res.json()) as { user: SessionUser } | null
  return data
}
