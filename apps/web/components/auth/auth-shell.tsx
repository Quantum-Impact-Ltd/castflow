import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthShellProps {
  eyebrow?: string
  heading: ReactNode
  subhead?: ReactNode
  children: ReactNode
  footer?: ReactNode
  backHref?: string
  backLabel?: string
  width?: 'sm' | 'md' | 'lg'
  /** Optional slot rendered between the eyebrow chip and the heading — used
   *  by the registration pages to show a 3-step progress indicator. */
  topAccessory?: ReactNode
}

const WIDTH_MAP: Record<NonNullable<AuthShellProps['width']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
}

export function AuthShell({
  eyebrow,
  heading,
  subhead,
  children,
  footer,
  backHref = '/',
  backLabel = 'Back to CastFlow',
  width = 'md',
  topAccessory,
}: AuthShellProps) {
  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-[var(--ink-900)] text-white">
      {/* Atmospheric color washes — tonal depth only, no grid/particles. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-[var(--brand-700)] opacity-[0.22] blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[var(--cta-400)] opacity-[0.16] blur-[140px]"
      />

      {/* Top-left brand mark */}
      <div className="absolute left-6 top-6 z-20 flex items-center gap-4 lg:left-10 lg:top-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-lg font-medium tracking-tight text-white transition-opacity hover:opacity-90"
        >
          <span
            className="inline-block h-2 w-2 rounded-full bg-[var(--cta-400)] transition-transform duration-500 group-hover:scale-150"
            aria-hidden
          />
          CastFlow
        </Link>
        <Link
          href={backHref}
          className="hidden items-center gap-1 text-xs font-medium text-white/55 transition-colors hover:text-white sm:inline-flex"
        >
          <ChevronLeft className="h-3 w-3" aria-hidden />
          {backLabel}
        </Link>
      </div>

      {/* Centered form column */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24 lg:py-28">
        <div className={cn('w-full', WIDTH_MAP[width])}>
          {eyebrow ? (
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--cta-400)] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--cta-400)]" />
                </span>
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/85">
                  {eyebrow}
                </span>
              </div>
            </div>
          ) : null}

          {topAccessory ? <div className="mb-6">{topAccessory}</div> : null}

          <h1 className="text-balance text-center text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            {heading}
          </h1>
          {subhead ? (
            <p className="mt-4 text-center text-base text-white/65 sm:text-lg">
              {subhead}
            </p>
          ) : null}

          {/* Card — flat tonal lift, single hairline ring. No blur, no shadow. */}
          <div className="relative mt-10 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]">
            <div className="relative p-7 sm:p-9">{children}</div>
          </div>

          {footer ? (
            <div className="mt-7 text-center text-sm text-white/60">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
