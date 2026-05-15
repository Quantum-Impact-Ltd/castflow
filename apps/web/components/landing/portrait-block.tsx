import Image from 'next/image'
import { cn } from '@/lib/utils'

interface PortraitBlockProps {
  /** Path under /public — e.g. "/talent/t01.jpg". When missing, renders a designed placeholder. */
  src?: string
  /** Artist display name, e.g. "Maya Okafor". Used as caption + alt text. */
  name: string
  /** Short context — e.g. "Model · London". */
  meta?: string
  /** Layout slot — affects type scale of the caption. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Override the wrapper aspect ratio. */
  className?: string
  /** Use the dark plate variant for placeholders against dark surfaces. */
  variant?: 'light' | 'dark'
  /** Hide the caption overlay entirely. */
  hideCaption?: boolean
  /** Priority load (for above-the-fold portraits). */
  priority?: boolean
}

export function PortraitBlock({
  src,
  name,
  meta,
  size = 'md',
  className,
  variant = 'light',
  hideCaption = false,
  priority = false,
}: PortraitBlockProps) {
  const captionScale =
    size === 'xl'
      ? 'text-2xl md:text-3xl'
      : size === 'lg'
        ? 'text-xl md:text-2xl'
        : size === 'sm'
          ? 'text-sm'
          : 'text-base md:text-lg'

  const overlayTextColor = variant === 'dark' ? 'text-white' : 'text-foreground'
  const metaColor = variant === 'dark' ? 'text-white/70' : 'text-muted-foreground'
  const plateClass = variant === 'dark' ? 'bg-plate-dark' : 'bg-plate'

  return (
    <figure
      className={cn(
        'relative overflow-hidden rounded-xl',
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`${name}${meta ? ` — ${meta}` : ''}`}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div className={cn('absolute inset-0', plateClass)} aria-hidden />
      )}

      {hideCaption ? null : (
        <figcaption
          className={cn(
            'absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5',
            'bg-gradient-to-t from-black/55 via-black/20 to-transparent',
          )}
        >
          <span
            className={cn(
              'font-serif italic leading-tight',
              src ? 'text-white' : overlayTextColor,
              captionScale,
            )}
          >
            {name}
          </span>
          {meta ? (
            <span
              className={cn(
                'font-mono text-xs uppercase tracking-wider',
                src ? 'text-white/80' : metaColor,
              )}
            >
              {meta}
            </span>
          ) : null}
        </figcaption>
      )}
    </figure>
  )
}
