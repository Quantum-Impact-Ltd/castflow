'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useSession as useBetterAuthSession } from '@/lib/auth-client'

export interface SessionUser {
  id: string
  email: string
  name?: string
  role: 'admin' | 'caster' | 'artist'
  approvalStatus?: 'pending' | 'approved' | 'rejected' | null
  status?: 'pending' | 'active' | 'suspended' | 'banned'
  emailVerified?: boolean
}

export interface ResolvedSession {
  user: SessionUser
  session: { id: string; expiresAt: string }
}

interface SessionContextValue {
  session: ResolvedSession | null
  /** True while Better Auth is fetching for the first time AND we have no
   *  server-rendered fallback to show. After the first fetch this is false. */
  isPending: boolean
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isPending: false,
})

interface SessionProviderProps {
  /** Session as fetched by the server-side layout. Used as the first-render
   *  value so the nav doesn't flash a logged-out state on a logged-in page. */
  initialSession: ResolvedSession | null
  children: ReactNode
}

/**
 * Bridges the server-rendered session (passed once at mount) with Better
 * Auth's live `useSession()` store (which updates on login/logout/focus/
 * broadcast). The rule:
 *
 *   - First paint: Better Auth is still pending → show `initialSession`.
 *     This is what kills the "Log in" → "Log out" flash on first render.
 *   - After Better Auth resolves: trust its data (which may be null after
 *     a logout). The server-rendered value becomes irrelevant.
 *
 * Components should use `useAuthSession()` instead of calling Better Auth's
 * `useSession()` directly — it's the same shape but populated immediately.
 */
export function SessionProvider({ initialSession, children }: SessionProviderProps) {
  const { data, isPending } = useBetterAuthSession()

  // Better Auth's user type doesn't include our `role`/`approvalStatus` extras
  // by default; widen through unknown.
  const live = data as unknown as ResolvedSession | null | undefined

  const session: ResolvedSession | null = isPending
    ? initialSession
    : (live ?? null)

  // Only report pending when we have no initial fallback to show. Otherwise
  // consumers see false from the very first render even while Better Auth
  // is fetching, because the UI already has something meaningful to display.
  const reportedPending = isPending && !initialSession

  return (
    <SessionContext.Provider value={{ session, isPending: reportedPending }}>
      {children}
    </SessionContext.Provider>
  )
}

/**
 * Read the current session inside client components. Always populated on the
 * first render when the server-side layout was able to resolve a session
 * (i.e. the user is logged in). Reactive to login/logout/cross-tab events
 * via Better Auth's underlying store.
 */
export function useAuthSession(): SessionContextValue {
  return useContext(SessionContext)
}
