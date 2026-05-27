'use client'

import { useCallback, useSyncExternalStore } from 'react'

// Per-user email notification preferences. Persisted in localStorage behind a
// hook so the UI is fully functional now; the storage call can later be
// repointed at a backend column + endpoint without touching consumers.

export interface NotificationPrefs {
  bidUpdates: boolean
  messages: boolean
  bookings: boolean
  payments: boolean
  reviews: boolean
}

export const DEFAULT_PREFS: NotificationPrefs = {
  bidUpdates: true,
  messages: true,
  bookings: true,
  payments: true,
  reviews: true,
}

const KEY = 'castflow:notification-prefs'
const listeners = new Set<() => void>()
let snapshot: NotificationPrefs = DEFAULT_PREFS
let hydrated = false

function read(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>
    return { ...DEFAULT_PREFS, ...parsed }
  } catch {
    return DEFAULT_PREFS
  }
}

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

export function useNotificationPrefs() {
  const prefs = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => DEFAULT_PREFS
  )

  const setPref = useCallback((key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...read(), [key]: value }
    window.localStorage.setItem(KEY, JSON.stringify(next))
    emit()
  }, [])

  return { prefs, setPref }
}
