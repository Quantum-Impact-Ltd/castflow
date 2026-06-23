import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarsProps {
  /** Rating 0–5; supports halves via rounding for display. May arrive as a Decimal string. */
  value: number | string
  className?: string
  size?: number
}

export function Stars({ value, className, size = 16 }: StarsProps) {
  const numeric = typeof value === 'string' ? Number(value) : value
  const rounded = Math.round(Number.isFinite(numeric) ? numeric : 0)
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${value} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i < rounded
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-muted-foreground/40'
          )}
        />
      ))}
    </span>
  )
}
