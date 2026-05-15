import { Fragment } from 'react'
import { cn } from '@/lib/utils'

interface MarqueeProps {
  items: string[]
  durationSeconds?: number
  className?: string
  itemClassName?: string
  separator?: React.ReactNode
  gap?: number
}

export function Marquee({
  items,
  durationSeconds = 40,
  className,
  itemClassName,
  separator,
  gap = 56,
}: MarqueeProps) {
  // Duplicate items twice so the translate3d(-50%) reset loops seamlessly.
  // Each "unit" is item + separator so the gap pattern is consistent across the loop seam.
  const doubled = [...items, ...items]

  return (
    <div
      className={cn(
        'group relative flex w-full overflow-hidden',
        className,
      )}
      style={
        {
          ['--marquee-duration' as string]: `${durationSeconds}s`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <div
        className="animate-marquee flex shrink-0 items-center"
        style={{ gap: `${gap}px` }}
      >
        {doubled.map((item, i) => (
          <Fragment key={`${item}-${i}`}>
            <span
              className={cn(
                'whitespace-nowrap select-none',
                itemClassName,
              )}
            >
              {item}
            </span>
            {separator ? (
              <span className="select-none" aria-hidden>
                {separator}
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
