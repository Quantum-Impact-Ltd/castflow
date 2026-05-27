import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarsProps {
  /** Rating 0–5; supports halves via rounding for display. */
  value: number
  className?: string
  size?: number
}

export function Stars({ value, className, size = 16 }: StarsProps) {
  const rounded = Math.round(value)
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
