'use client'

import Link from 'next/link'
import { BadgeCheck, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { useTalentSearch } from '@/lib/hooks/use-talent'

/**
 * Live "a few of the approved artists" preview for the public /artists page.
 * Pulls real approved + available talent from the public directory endpoint.
 * Renders nothing while loading or when the directory is empty so the section
 * degrades cleanly on a fresh platform (no fake data).
 */
export function TalentPreview() {
  const { data } = useTalentSearch({ limit: 3 })
  const preview = (data ?? []).slice(0, 3)

  if (preview.length === 0) return null

  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {preview.map((artist) => {
        const hero =
          artist.portfolioItems?.find((p) => p.isPrimary)?.url ??
          artist.portfolioItems?.[0]?.url ??
          ''
        return (
          <Link
            key={artist.id}
            href={`/artists/${artist.id}`}
            className="group block overflow-hidden rounded-2xl border border-border/60 bg-background transition-all hover:shadow-md"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-50)]">
              {hero && (
                <RemoteImage
                  src={hero}
                  alt={`${artist.firstName} portfolio cover`}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              )}
              <div className="absolute left-4 top-4">
                <Badge className="rounded-full bg-background/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground backdrop-blur">
                  <BadgeCheck className="mr-1 h-3 w-3 text-primary" />
                  Verified
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-base font-medium tracking-[-0.01em] text-foreground">
                  {artist.firstName}
                </p>
                <p className="mt-1 text-xs text-foreground/60">
                  {artist.artistType === 'model' ? 'Model' : 'Actor'} · {artist.city}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />
                {Number(artist.ratingAvg ?? 0).toFixed(1)}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
