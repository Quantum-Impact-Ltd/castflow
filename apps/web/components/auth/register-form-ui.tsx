import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/** Inline server-error banner shown above the register submit button. */
export function RegisterServerError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-lg border border-rose-400/30 bg-rose-400/[0.08] px-3 py-2 text-sm text-rose-200"
    >
      {message}
    </p>
  )
}

/** Full-width primary submit button for the register forms. */
export function RegisterSubmitButton({
  label,
  pending,
  disabled,
}: {
  label: string
  pending: boolean
  disabled: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-busy={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-900)]"
    >
      {pending ? 'Creating account…' : label}
      {!pending ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
    </button>
  )
}

/** Terms / Privacy consent line under the register submit button. */
export function RegisterTermsFooter() {
  return (
    <p className="text-center text-xs text-white/50">
      By registering you agree to our{' '}
      <Link
        href="/terms"
        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
      >
        Terms
      </Link>{' '}
      and{' '}
      <Link
        href="/privacy"
        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
      >
        Privacy Policy
      </Link>
      .
    </p>
  )
}
