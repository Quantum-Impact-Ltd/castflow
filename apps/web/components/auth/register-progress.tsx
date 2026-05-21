import { cn } from '@/lib/utils'

const STEPS = ['Role', 'Account', 'Verify'] as const

interface RegisterProgressProps {
  /** Zero-indexed: 0 = Role chooser, 1 = Account form, 2 = Email verify */
  current: 0 | 1 | 2
  className?: string
}

/**
 * Small horizontal step indicator used at the top of /register and
 * /register/[role] so the user can see they're partway through a 3-step
 * journey to a finished account. Onboarding picks up where this leaves off.
 */
export function RegisterProgress({ current, className }: RegisterProgressProps) {
  return (
    <div className={cn('mx-auto flex items-center justify-center gap-1.5', className)}>
      {STEPS.map((label, i) => {
        const isDone = i < current
        const isCurrent = i === current
        return (
          <div key={label} className="flex items-center gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full border text-[10px] font-medium tabular-nums transition',
                  isDone && 'border-[var(--cta-400)]/60 bg-[var(--cta-400)]/15 text-[var(--cta-400)]',
                  isCurrent && 'border-[var(--cta-400)] bg-[var(--cta-400)] text-[var(--ink-900)]',
                  !isDone && !isCurrent && 'border-white/15 text-white/40'
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'font-mono text-[10px] font-semibold tracking-[0.18em] uppercase transition',
                  isCurrent ? 'text-white/85' : 'text-white/40'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span aria-hidden className="h-px w-6 bg-white/15" />
            )}
          </div>
        )
      })}
    </div>
  )
}
