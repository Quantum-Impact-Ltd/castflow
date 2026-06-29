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
          'placeholder:text-white/45',
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
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70"
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
