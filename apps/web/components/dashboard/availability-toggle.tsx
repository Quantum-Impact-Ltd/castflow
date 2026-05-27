'use client'

import { Switch } from '@/components/ui/switch'
import { useUpdateAvailability } from '@/lib/hooks/use-artist'
import { cn } from '@/lib/utils'

interface AvailabilityToggleProps {
  status: 'available' | 'unavailable'
  className?: string
  /** Hide the descriptive copy (e.g. on a compact dashboard tile). */
  compact?: boolean
}

/**
 * The artist availability switch (PRD §8.13). Casters only see artists marked
 * `available` in talent search, so this directly controls discoverability.
 */
export function AvailabilityToggle({ status, className, compact }: AvailabilityToggleProps) {
  const update = useUpdateAvailability()
  const available = status === 'available'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Switch
        checked={available}
        disabled={update.isPending}
        onCheckedChange={(checked) =>
          update.mutate({ availabilityStatus: checked ? 'available' : 'unavailable' })
        }
        aria-label="Availability"
      />
      <div className="leading-tight">
        <p className="text-sm font-medium text-foreground">
          {available ? 'Available for work' : 'Not available'}
        </p>
        {!compact ? (
          <p className="text-xs text-muted-foreground">
            {available
              ? 'Casters can find you in talent search.'
              : 'You’re hidden from talent search until you switch this on.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}
