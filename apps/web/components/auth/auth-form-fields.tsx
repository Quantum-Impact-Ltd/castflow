'use client'

import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Dark-glass styled input for use inside AuthShell forms. */
export const AuthInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
  function AuthInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-sm text-white',
          'placeholder:text-white/35',
          'transition-colors outline-none',
          'focus-visible:border-[var(--cta-400)] focus-visible:ring-2 focus-visible:ring-[var(--cta-400)]/30',
          'disabled:pointer-events-none disabled:opacity-50',
          'aria-invalid:border-rose-400/70 aria-invalid:ring-2 aria-invalid:ring-rose-400/20',
          className,
        )}
        {...props}
      />
    )
  },
)

interface AuthFieldProps {
  label: ReactNode
  htmlFor: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}

export function AuthField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60"
        >
          {label}
        </label>
        {hint}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function AuthDivider({ children }: { children?: ReactNode }) {
  return (
    <div className="relative my-6 text-center">
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-white/10"
      />
      <span className="relative inline-block bg-[var(--ink-900)]/80 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45 backdrop-blur">
        {children ?? 'or'}
      </span>
    </div>
  )
}
