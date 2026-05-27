'use client'

import { useCallback, useSyncExternalStore } from 'react'

// Caster "global talent shortlist" — artists saved across all jobs. Persisted
// in localStorage behind a hook abstraction so it's functional now and can be
// repointed at a backend table + endpoint later without touching consumers.

const KEY = 'castflow:talent-shortlist'

function read(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

const listeners = new Set<() => void>()
let snapshot: string[] = []
let hydrated = false

function emit() {
  snapshot = read()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  if (!hydrated) {
    snapshot = read()
    hydrated = true
  }
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function write(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids))
  emit()
}

export interface UseTalentShortlist {
  shortlistedIds: string[]
  isShortlisted: (id: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
}

export function useTalentShortlist(): UseTalentShortlist {
  const shortlistedIds = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => [] as string[]
  )

  const toggle = useCallback((id: string) => {
    const current = read()
    write(current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  }, [])

  const remove = useCallback((id: string) => {
    write(read().filter((x) => x !== id))
  }, [])

  const isShortlisted = useCallback((id: string) => shortlistedIds.includes(id), [shortlistedIds])

  return { shortlistedIds, isShortlisted, toggle, remove }
}
