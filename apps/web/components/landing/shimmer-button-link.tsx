import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface Props {
  href: string
  children: ReactNode
  className?: string
  /**
   * `default` renders a warm CTA pill (cta-400 fill, dark-ink text) for use on
   * light marketing surfaces. `inverse` renders a surface-0 fill with
   * foreground text so the CTA reads cleanly on a dark drenched panel.
   *
   * Name retained for downstream call sites — the original component used to
   * render an animated shimmer sweep; that was stripped per the design
   * system's "no decorative animation on CTAs" rule.
   */
  variant?: 'default' | 'inverse'
}

const BASE =
  'inline-flex h-12 items-center justify-center gap-1.5 rounded-full px-7 text-base font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-400)]/60 focus-visible:ring-offset-2'

const VARIANT: Record<NonNullable<Props['variant']>, string> = {
  default:
    'bg-[var(--cta-400)] text-[#1c1108] hover:bg-[var(--cta-400)]/90 focus-visible:ring-offset-background',
  inverse:
    'bg-background text-foreground hover:bg-background/90 focus-visible:ring-offset-foreground',
}

export function ShimmerButtonLink({
  href,
  children,
  className,
  variant = 'default',
}: Props) {
  return (
    <Link href={href} className={cn(BASE, VARIANT[variant], className)}>
      {children}
    </Link>
  )
}
