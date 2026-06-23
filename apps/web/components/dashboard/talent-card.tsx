'use client'

import Link from 'next/link'
import { Bookmark, MapPin, Star } from 'lucide-react'
import type { PublicArtistProfile } from '@/lib/api/talent'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { InviteToJobDialog } from '@/components/dashboard/invite-to-job-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTalentShortlist } from '@/lib/hooks/use-talent-shortlist'
import { cn, formatRating } from '@/lib/utils'

interface TalentCardProps {
  artist: PublicArtistProfile
}

export function TalentCard({ artist }: TalentCardProps) {
  const { isShortlisted, toggle } = useTalentShortlist()
  const saved = isShortlisted(artist.id)
  const primary =
    artist.portfolioItems?.find((p) => p.isPrimary) ?? artist.portfolioItems?.[0] ?? null

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40">
      <Link href={`/caster/talent/${artist.id}`} className="relative block aspect-[3/4] bg-muted">
        {primary ? (
          <RemoteImage
            src={primary.url}
            alt={artist.firstName}
            fill
            sizes="(max-width: 640px) 50vw, 240px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-4xl font-semibold text-muted-foreground/40">
            {artist.firstName.charAt(0)}
          </span>
        )}
      </Link>

      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={saved ? 'Remove from shortlist' : 'Add to shortlist'}
        aria-pressed={saved}
        onClick={() => toggle(artist.id)}
        className="absolute right-2 top-2 h-8 w-8"
      >
        <Bookmark className={cn('h-4 w-4', saved && 'fill-primary text-primary')} />
      </Button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/caster/talent/${artist.id}`}
            className="font-medium text-foreground hover:underline"
          >
            {artist.firstName}
          </Link>
          <Badge variant="secondary" className="capitalize">
            {artist.artistType}
          </Badge>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {artist.city ?? 'UK'}
        </p>

        <p className="flex items-center gap-1.5 text-sm">
          {artist.ratingCount > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{formatRating(artist.ratingAvg)}</span>
              <span className="text-muted-foreground">({artist.ratingCount})</span>
            </>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              New to Platform
            </Badge>
          )}
        </p>

        <div className="mt-auto pt-2">
          <InviteToJobDialog artistId={artist.id} artistName={artist.firstName}>
            <Button variant="outline" size="sm" className="w-full">
              Invite to apply
            </Button>
          </InviteToJobDialog>
        </div>
      </div>
    </div>
  )
}
