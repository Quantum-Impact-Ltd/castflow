'use client'

import { useCallback, useSyncExternalStore } from 'react'

// Artist "saved jobs" bookmarks. Persisted in localStorage (per-device) behind
// a hook abstraction so the storage mechanism can later be swapped for a
// backend table + endpoint without touching any consuming component.

const KEY = 'castflow:saved-jobs'

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
// Cache the parsed snapshot so useSyncExternalStore sees a stable reference
// between writes (returning a fresh array each call causes an infinite loop).
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

export interface UseSavedJobs {
  savedIds: string[]
  isSaved: (id: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
}

export function useSavedJobs(): UseSavedJobs {
  const savedIds = useSyncExternalStore(
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

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds])

  return { savedIds, isSaved, toggle, remove }
}
