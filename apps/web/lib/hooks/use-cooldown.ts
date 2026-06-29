'use client'

import { useEffect, useState } from 'react'

interface Cooldown {
  /** Whole seconds left on the cooldown (0 when not active). */
  remaining: number
  /** True while the cooldown is running. */
  onCooldown: boolean
  /** Start (or restart) the cooldown for the configured number of seconds. */
  start: () => void
}

/**
 * Epoch-timestamp cooldown so a user can't button-mash an action (e.g.
 * resending a verification email, or refetching application status) and burn
 * through the API's per-email/IP rate-limit bucket.
 *
 * One interval per cooldown — `cooldownUntil` is the only dependency, so a 1s
 * `now` tick does NOT tear down and recreate the timer. The interval also
 * self-clears the moment the cooldown expires. (Audit M22 / dedupe #3.)
 */
export function useCooldown(seconds: number): Cooldown {
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= cooldownUntil) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  return {
    remaining,
    onCooldown: remaining > 0,
    start: () => setCooldownUntil(Date.now() + seconds * 1000),
  }
}
