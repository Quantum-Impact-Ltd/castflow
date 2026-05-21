'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepNavProps {
  onBack?: () => void
  onSkip?: () => void
  nextLabel?: string
  /** If provided, used as the `type` of the Next button. Defaults to 'submit'. */
  nextType?: 'submit' | 'button'
  onNext?: () => void
  isSubmitting?: boolean
  nextDisabled?: boolean
}

export function StepNav({
  onBack,
  onSkip,
  nextLabel = 'Continue',
  nextType = 'submit',
  onNext,
  isSubmitting,
  nextDisabled,
}: StepNavProps) {
  return (
    <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/55 transition hover:text-white disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="rounded-lg px-3 py-2 text-sm text-white/55 transition hover:text-white disabled:opacity-50"
          >
            Skip for now
          </button>
        )}
        <button
          type={nextType}
          onClick={onNext}
          disabled={isSubmitting || nextDisabled}
          className={cn(
            'inline-flex h-10 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold tracking-tight transition',
            'bg-gradient-to-br from-[#f9a26c] to-[#e67e3e] text-[var(--ink-900)]',
            'shadow-[0_10px_30px_-12px_rgba(249,162,108,0.55)]',
            'hover:from-[#fab17f] hover:to-[#e88a4b]',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'
          )}
        >
          {isSubmitting ? 'Saving…' : nextLabel}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
