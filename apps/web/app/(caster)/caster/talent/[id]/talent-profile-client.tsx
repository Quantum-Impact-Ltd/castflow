'use client'

import Link from 'next/link'
import { ChevronLeft, BadgeCheck, Bookmark, Download, Lock } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState, StatusBadge } from '@/components/dashboard'
import { Stars } from '@/components/dashboard/stars'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { InviteToJobDialog } from '@/components/dashboard/invite-to-job-dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTalentProfile } from '@/lib/hooks/use-talent'
import { useArtistReviews } from '@/lib/hooks/use-reviews'
import { useTalentShortlist } from '@/lib/hooks/use-talent-shortlist'
import { cn, formatDate } from '@/lib/utils'

const EXPERIENCE: Record<string, string> = {
  new_face: 'New face',
  semi_pro: 'Semi-pro',
  professional: 'Professional',
}

export function CasterTalentProfileClient({ artistId }: { artistId: string }) {
  const { data: artist, isPending, isError, refetch } = useTalentProfile(artistId)
  const reviews = useArtistReviews(artistId)
  const { isShortlisted, toggle } = useTalentShortlist()

  if (isPending) return <LoadingState variant="detail" />
  if (isError || !artist) return <ErrorState message="We couldn’t load this profile." onRetry={() => void refetch()} />

  const saved = isShortlisted(artist.id)
  const model = artist.modelStats
  const actor = artist.actorStats
  const skills = (artist.skills ?? [])
  const portfolio = artist.portfolioItems ?? []
  const compCardUrl = `${process.env['NEXT_PUBLIC_API_URL']}/api/v1/artists/${artist.id}/comp-card?download=1`

  return (
    <div className="space-y-6">
      <Link
        href="/caster/talent"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to talent
      </Link>

      <PageHeader
        title={artist.firstName}
        description={`${artist.city ?? 'UK'} · ${EXPERIENCE[artist.experienceLevel] ?? '—'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label={saved ? 'Remove from shortlist' : 'Add to shortlist'}
              onClick={() => toggle(artist.id)}
            >
              <Bookmark className={cn('h-4 w-4', saved && 'fill-primary text-primary')} />
            </Button>
            <Button asChild variant="outline">
              <a href={compCardUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-1.5 h-4 w-4" /> Comp card
              </a>
            </Button>
            <InviteToJobDialog artistId={artist.id} artistName={artist.firstName} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="capitalize">{artist.artistType}</Badge>
        {/* Everyone in the directory is admin-approved, which verifies their ID. */}
        <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
          <BadgeCheck className="h-4 w-4" /> Verified
        </span>
        <StatusBadge status={artist.availabilityStatus === 'available' ? 'active' : 'closed'} label={artist.availabilityStatus === 'available' ? 'Available' : 'Unavailable'} />
        {artist.ratingCount > 0 ? (
          <span className="flex items-center gap-1.5">
            <Stars value={artist.ratingAvg ?? 0} size={14} />
            <span className="text-sm text-muted-foreground">
              {(artist.ratingAvg ?? 0).toFixed(1)} ({artist.ratingCount})
            </span>
          </span>
        ) : (
          <Badge variant="outline">New to Platform</Badge>
        )}
        <span className="text-sm text-muted-foreground">{artist.jobsCompleted} jobs completed</span>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        You’ll see {artist.firstName}’s full name and contact details once you’ve booked them.
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {artist.bio ? (
            <Card className="space-y-2 p-6">
              <h2 className="text-sm font-semibold text-foreground">About</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>
            </Card>
          ) : null}

          {portfolio.length > 0 ? (
            <Card className="space-y-3 p-6">
              <h2 className="text-sm font-semibold text-foreground">Portfolio</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolio.map((item) => (
                  <div key={item.id} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                    <RemoteImage src={item.url} alt={item.caption ?? artist.firstName} fill sizes="200px" className="object-cover" />
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Reviews</h2>
            {reviews.isPending ? (
              <LoadingState rows={2} />
            ) : reviews.data && reviews.data.length > 0 ? (
              <ul className="space-y-3">
                {reviews.data.map((r) => (
                  <li key={r.id} className="space-y-1 border-b border-border pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <Stars value={r.rating} size={14} />
                      <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.comment ? <p className="text-sm text-foreground">{r.comment}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {model ? (
            <Card className="space-y-3 p-6">
              <h2 className="text-sm font-semibold text-foreground">Model stats</h2>
              <dl className="space-y-2 text-sm">
                <Stat label="Height" value={`${model.heightCm} cm`} />
                <Stat label="Dress size" value={model.dressSize} />
                <Stat label="Shoe size" value={model.shoeSize} />
                {model.bustCm ? <Stat label="Bust" value={`${model.bustCm} cm`} /> : null}
                {model.waistCm ? <Stat label="Waist" value={`${model.waistCm} cm`} /> : null}
                {model.hipCm ? <Stat label="Hip" value={`${model.hipCm} cm`} /> : null}
                <Stat label="Hair" value={model.hairColour} />
                <Stat label="Eyes" value={model.eyeColour} />
                <Stat label="Skin tone" value={model.skinTone} />
              </dl>
            </Card>
          ) : null}

          {actor ? (
            <Card className="space-y-3 p-6">
              <h2 className="text-sm font-semibold text-foreground">Actor profile</h2>
              <dl className="space-y-2 text-sm">
                <Stat label="Height" value={`${actor.heightCm} cm`} />
                <Stat label="Hair" value={actor.hairColour} />
                <Stat label="Eyes" value={actor.eyeColour} />
                {actor.voiceType ? <Stat label="Voice" value={actor.voiceType} /> : null}
                <Stat label="Plays age" value={`${actor.ageRangeMin}–${actor.ageRangeMax}`} />
                <Stat label="Equity member" value={actor.equityMember ? 'Yes' : 'No'} />
              </dl>
              {actor.spotlightUrl ? (
                <a href={actor.spotlightUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  View Spotlight profile
                </a>
              ) : null}
            </Card>
          ) : null}

          {skills.length > 0 ? (
            <Card className="space-y-3 p-6">
              <h2 className="text-sm font-semibold text-foreground">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s.id} variant="secondary">{s.skillValue}</Badge>
                ))}
              </div>
            </Card>
          ) : null}

          {artist.instagramHandle ? (
            <>
              <Separator />
              <a
                href={`https://instagram.com/${artist.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                @{artist.instagramHandle}
              </a>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize text-foreground">{value}</dd>
    </div>
  )
}
