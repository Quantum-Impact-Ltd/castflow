'use client'

import { useEffect, useState } from 'react'

/**
 * Returns `value` after it's stayed unchanged for `delayMs`. Anything that
 * mutates `value` faster than that is collapsed into a single update — the
 * canonical pattern for taming high-frequency inputs (search fields,
 * filter sliders) feeding expensive computations or network calls.
 *
 * Two-state shape (not a ref) so consumers can read it inside `useMemo`
 * dependency arrays and TanStack Query keys without surprise.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
