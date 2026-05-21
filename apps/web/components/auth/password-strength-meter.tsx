'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * Rules-based password strength meter — no external libraries, no network
 * calls, just signals that line up with the shared `passwordSchema` in
 * `@castflow/validators` plus a few stretch criteria.
 *
 * Score buckets (0–5):
 *   0–1  → too weak
 *   2    → weak
 *   3    → fair
 *   4    → strong
 *   5    → very strong
 *
 * Breached-password lookup (HaveIBeenPwned k-anonymity API) is deliberately
 * deferred — it adds an external network dependency, a debounced fetch, and
 * a privacy disclosure obligation. Easy to slot in here when product calls
 * for it.
 */

interface Criterion {
  label: string
  test: (password: string) => boolean
}

const CRITERIA: readonly Criterion[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a number', test: (p) => /[0-9]/.test(p) },
  { label: 'Contains a symbol', test: (p) => /[^a-zA-Z0-9]/.test(p) },
  { label: 'Uppercase + lowercase', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: '12+ characters (stronger)', test: (p) => p.length >= 12 },
] as const

const LEVELS = [
  { score: 0, label: 'Too weak', barClass: 'bg-rose-500/70', textClass: 'text-rose-300' },
  { score: 1, label: 'Too weak', barClass: 'bg-rose-500/70', textClass: 'text-rose-300' },
  { score: 2, label: 'Weak', barClass: 'bg-orange-400/80', textClass: 'text-orange-200' },
  { score: 3, label: 'Fair', barClass: 'bg-amber-400/80', textClass: 'text-amber-200' },
  { score: 4, label: 'Strong', barClass: 'bg-emerald-400/80', textClass: 'text-emerald-200' },
  { score: 5, label: 'Very strong', barClass: 'bg-emerald-400/90', textClass: 'text-emerald-200' },
] as const

interface PasswordStrengthMeterProps {
  password: string
  /** Hide the criteria checklist; just render the bar + label. */
  compact?: boolean
}

export function PasswordStrengthMeter({
  password,
  compact = false,
}: PasswordStrengthMeterProps) {
  const { score, satisfied } = useMemo(() => {
    const results = CRITERIA.map((c) => c.test(password))
    return {
      score: results.filter(Boolean).length,
      satisfied: results,
    }
  }, [password])

  if (!password) return null

  const level = LEVELS[score] ?? LEVELS[0]!

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-1 flex-1 gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i < score ? level.barClass : 'bg-white/10',
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            'shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]',
            level.textClass,
          )}
          aria-live="polite"
        >
          {level.label}
        </span>
      </div>

      {!compact ? (
        <ul className="space-y-1 text-[11px] text-white/55">
          {CRITERIA.map((c, i) => (
            <li
              key={c.label}
              className={cn(
                'flex items-center gap-1.5',
                satisfied[i] ? 'text-emerald-200/85' : '',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'inline-block h-1 w-1 rounded-full',
                  satisfied[i] ? 'bg-emerald-300' : 'bg-white/25',
                )}
              />
              {c.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
