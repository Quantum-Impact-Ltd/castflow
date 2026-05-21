// Native-fetch wrapper for the CastFlow API.
//
// Layered stack:
//   Component → useQuery/useMutation → service (lib/api/*) → fetcher
//
// Only `lib/api/*` service modules should call this directly.
// Components and hooks must never import fetcher.

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly fields?: Record<string, string[]>

  constructor(opts: {
    code: string
    message: string
    status: number
    fields?: Record<string, string[]>
  }) {
    super(opts.message)
    this.name = 'ApiError'
    this.code = opts.code
    this.status = opts.status
    if (opts.fields) this.fields = opts.fields
  }
}

interface SuccessEnvelope<T> {
  success: true
  data: T
  meta?: { total: number; page: number; limit: number; hasNext?: boolean }
}

interface ErrorEnvelope {
  success: false
  error: { code: string; message: string; fields?: Record<string, string[]> }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
}

const API_BASE = `${process.env['NEXT_PUBLIC_API_URL'] ?? ''}/api/v1`

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return url
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    search.set(k, String(v))
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

// Public auth surfaces where a 401 from a background request should NOT
// trigger a hard navigation to /login. Anything else (dashboards, public
// pages firing authenticated queries) still bounces.
const AUTH_SURFACE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/suspended',
] as const

function isOnAuthSurface(pathname: string): boolean {
  return AUTH_SURFACE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`),
  )
}

function isSuccessEnvelope<T>(v: unknown): v is SuccessEnvelope<T> {
  return typeof v === 'object' && v !== null && (v as { success?: unknown }).success === true
}

function isErrorEnvelope(v: unknown): v is ErrorEnvelope {
  return typeof v === 'object' && v !== null && (v as { success?: unknown }).success === false
}

export async function fetcher<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, params, headers, ...rest } = opts

  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
  }
  if (body !== undefined) init.body = JSON.stringify(body)

  const res = await fetch(buildUrl(path, params), init)

  // 401 redirect preserved from the previous axios interceptor.
  // Browser-only — server-side callers (route handlers, server components)
  // get the ApiError thrown below and decide their own redirect strategy.
  //
  // Guard against bouncing the user when they're already on a public auth
  // page (login itself round-trips through Better Auth, which can 401 a
  // wrong-password attempt from the /login screen; without this guard we'd
  // hard-reload /login and clobber any error state the form is rendering).
  if (res.status === 401 && typeof window !== 'undefined') {
    if (!isOnAuthSurface(window.location.pathname)) {
      window.location.href = '/login'
    }
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    throw new ApiError({
      code: 'INVALID_RESPONSE',
      message: 'API returned a non-JSON response',
      status: res.status,
    })
  }

  if (res.ok && isSuccessEnvelope<T>(payload)) {
    return payload.data
  }

  if (isErrorEnvelope(payload)) {
    throw new ApiError({
      code: payload.error.code,
      message: payload.error.message,
      status: res.status,
      ...(payload.error.fields ? { fields: payload.error.fields } : {}),
    })
  }

  throw new ApiError({
    code: 'UNKNOWN_ERROR',
    message: 'Unexpected response shape',
    status: res.status,
  })
}
