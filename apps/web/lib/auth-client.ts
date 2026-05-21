// `better-auth/react` exports a `useSession` that returns a regular React-hook
// shape ({ data, isPending, error }). `better-auth/client`'s version is a
// Nanostore atom which doesn't work like a hook — using the react entry point
// lets components call `useSession()` directly without manual store subscriptions.
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env['NEXT_PUBLIC_API_URL']!,
})

export const { signIn, signUp, signOut, useSession } = authClient
