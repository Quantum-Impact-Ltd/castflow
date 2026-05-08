import { QueryClient, isServer } from '@tanstack/react-query'
import { ApiError } from '@/lib/fetcher'

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 30s, then revalidates on next access.
        staleTime: 30_000,
        // Cache lingers for 5m after last subscriber unmounts.
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Only retry network failures and 5xx. 4xx (validation, auth, not-found,
        // conflict) is a bug or user error — retrying just delays the toast.
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.status >= 400 && error.status < 500) return false
          }
          return failureCount < 2
        },
      },
      mutations: {
        // Mutations are user-initiated; surface failures immediately.
        retry: 0,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

// App Router pattern: a fresh client per server request to avoid cache leaks
// across users; one persistent client in the browser shared across renders.
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
