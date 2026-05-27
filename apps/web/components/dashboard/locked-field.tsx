import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LockedFieldProps {
  /** Why the value is hidden — shown next to the lock icon. */
  reason?: string
  className?: string
}

/**
 * Renders an opaque placeholder for a value the server intentionally withholds
 * (shoot location before a contract is fully signed, contact details before a
 * booking). The hidden value is NEVER passed to this component, so it can't
 * leak into the DOM — the parent simply renders <LockedField/> instead of the
 * real value when the server returns it masked.
 */
export function LockedField({ reason, className }: LockedFieldProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground',
        className
      )}
    >
      <Lock className="h-3.5 w-3.5 shrink-0" />
      {reason ?? 'Hidden'}
    </span>
  )
}
