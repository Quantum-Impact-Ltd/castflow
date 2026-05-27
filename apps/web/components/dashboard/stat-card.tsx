import type { ComponentType, ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: ComponentType<{ className?: string }>
  /** When set, the whole card becomes a link. */
  href?: string
  className?: string
  /** Emphasise the card (e.g. an action-needed tile). */
  accent?: boolean
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
  accent,
}: StatCardProps) {
  const body = (
    <div
      className={cn(
        'flex h-full flex-col gap-3 rounded-xl border bg-card p-5 transition-colors',
        accent ? 'border-primary/40 bg-accent/40' : 'border-border',
        href && 'hover:border-primary/40 hover:bg-accent/30',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
      <span className="text-3xl font-semibold tracking-[-0.02em] text-foreground">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        {body}
      </Link>
    )
  }
  return body
}
