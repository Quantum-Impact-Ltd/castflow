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
import { authClient } from '@/lib/auth-client'

export interface RegistrationResult {
  user: { id: string; email: string }
  /** False in dev-bypass mode — the account is already verified. */
  verificationEmailSent: boolean
  /** True when dev bypass is on — skip /verify-email and send to login. */
  emailVerified: boolean
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

interface CaptchaArg {
  /** Cloudflare Turnstile token. Required in environments where the
   *  backend has TURNSTILE_SECRET_KEY set. (Audit H5.) */
  captchaToken?: string
}

export function registerArtist(
  input: RegisterArtistInput & CaptchaArg,
  init?: FetcherInit
): Promise<RegistrationResult> {
  return fetcher<RegistrationResult>('/auth/register-artist', {
    method: 'POST',
    body: input,
    ...init,
  })
}

export function registerCaster(
  input: RegisterCasterInput & CaptchaArg,
  init?: FetcherInit
): Promise<RegistrationResult> {
  return fetcher<RegistrationResult>('/auth/register-caster', {
    method: 'POST',
    body: input,
    ...init,
  })
}

/**
 * Login uses Better Auth's client method (not a raw fetch) so the in-memory
 * session store reactively updates, which is what makes `useSession()`
 * consumers re-render without a page refresh.
 */
export async function login(input: LoginInput): Promise<{ user: SessionUser }> {
  const result = await authClient.signIn.email({
    email: input.email,
    password: input.password,
  })
  if (result.error) {
    throw Object.assign(new Error(result.error.message ?? 'Login failed'), {
      code: result.error.code ?? 'AUTH_ERROR',
      status: result.error.status ?? 401,
    })
  }
  // Better Auth's base types don't include our `role` additionalField, so
  // we have to widen through `unknown` to land on our richer SessionUser.
  let user = result.data?.user as unknown as SessionUser | undefined
  // Some Better Auth versions don't echo the user back on sign-in (data is just
  // `{ token, redirect }`). The sign-in still set the session cookie, so fetch
  // the session to get the user (incl. our `role`) for the post-login redirect.
  if (!user) {
    const session = await authClient.getSession()
    user = session.data?.user as unknown as SessionUser | undefined
  }
  if (!user) {
    throw new Error('Login succeeded but no user was returned')
  }
  return { user }
}

export async function logout(): Promise<void> {
  const result = await authClient.signOut()
  if (result.error) {
    throw new Error(result.error.message ?? 'Logout failed')
  }
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

/**
 * Consume a single-use email-verification token. Must only run on explicit
 * user action — calling this from a Server Component or on page load lets
 * email-link prefetchers (Outlook Safe Links, Gmail link-warming, AV
 * scanners) burn the token before the user clicks.
 */
export async function verifyEmailToken(token: string, init?: FetcherInit): Promise<void> {
  const init2: RequestInit = {
    method: 'GET',
    credentials: 'include',
    redirect: 'manual',
    cache: 'no-store',
  }
  if (init?.signal) init2.signal = init.signal
  const res = await fetch(
    `${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
    init2,
  )
  const ok = res.ok || (res.status >= 300 && res.status < 400)
  if (!ok) {
    throw Object.assign(new Error('Verification failed'), {
      code: 'INVALID_TOKEN',
      status: res.status,
    })
  }
}

export async function getSession(init?: FetcherInit): Promise<{ user: SessionUser } | null> {
  const init2: RequestInit = { credentials: 'include', cache: 'no-store' }
  if (init?.signal) init2.signal = init.signal
  const res = await fetch(`${API_BASE}/api/auth/get-session`, init2)
  if (!res.ok) return null
  const data = (await res.json()) as { user: SessionUser } | null
  return data
}
