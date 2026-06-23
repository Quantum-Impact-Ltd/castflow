'use client'

import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface StepDef {
  key: string
  label: string
  optional?: boolean
}

interface OnboardingStepperProps {
  steps: ReadonlyArray<StepDef>
  currentIndex: number
  onStepClick?: (index: number) => void
  /** Highest step the user has unlocked. Steps beyond this aren't clickable. */
  maxUnlockedIndex?: number
}

export function OnboardingStepper({
  steps,
  currentIndex,
  onStepClick,
  maxUnlockedIndex,
}: OnboardingStepperProps) {
  const maxUnlocked = maxUnlockedIndex ?? currentIndex

  return (
    <div className="w-full">
      {/* Mobile: compact progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono tracking-[0.18em] text-white/70 uppercase">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="font-medium text-white">{steps[currentIndex]?.label}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-[var(--cta-400)]"
            initial={false}
            animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Desktop: full rail */}
      <ol className="hidden items-center sm:flex">
        {steps.map((step, i) => {
          const status: 'done' | 'current' | 'upcoming' =
            i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
          const isClickable = onStepClick && i <= maxUnlocked
          const isLast = i === steps.length - 1

          return (
            <li key={step.key} className={cn('flex items-center', !isLast && 'flex-1')}>
              <button
                type="button"
                onClick={isClickable ? () => onStepClick(i) : undefined}
                disabled={!isClickable}
                className={cn(
                  'group flex flex-col items-center gap-1.5 text-center transition',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <div
                  className={cn(
                    'relative grid h-8 w-8 place-items-center rounded-full border text-xs font-medium transition',
                    status === 'done' &&
                      'border-[var(--cta-400)]/70 bg-[var(--cta-400)]/15 text-[var(--cta-400)]',
                    status === 'current' &&
                      'border-[var(--cta-400)] bg-[var(--cta-400)] text-[var(--ink-900)] ring-4 ring-[var(--cta-400)]/20',
                    status === 'upcoming' &&
                      'border-white/15 bg-white/[0.03] text-white/70'
                  )}
                >
                  {status === 'done' ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'max-w-[6.5rem] truncate font-mono text-[10px] tracking-[0.18em] uppercase',
                    status === 'current' && 'text-white/85',
                    status === 'done' && 'text-white/55',
                    status === 'upcoming' && 'text-white/35'
                  )}
                >
                  {step.label}
                </span>
              </button>
              {!isLast && (
                <div className="mx-2 -mt-5 flex-1">
                  <div className="relative h-px w-full overflow-hidden bg-white/10">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-[var(--cta-400)]/70"
                      initial={false}
                      animate={{ width: i < currentIndex ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
