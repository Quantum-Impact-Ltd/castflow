import { type ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  className?: string
  reverse?: boolean
  pauseOnHover?: boolean
  children: React.ReactNode
  repeat?: number
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  repeat = 2,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        'group flex w-full overflow-hidden p-2 [--gap:2rem] gap-(--gap)',
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-marquee flex shrink-0 items-center justify-around gap-(--gap)',
              {
                'group-hover:[animation-play-state:paused]': pauseOnHover,
                '[animation-direction:reverse]': reverse,
              },
            )}
          >
            {children}
          </div>
        ))}
    </div>
  )
}
