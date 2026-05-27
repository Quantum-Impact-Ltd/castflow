'use client'

import Link from 'next/link'
import {
  MapPin,
  Star,
  BadgeCheck,
  Sparkles,
  Pencil,
  Eye,
  Briefcase,
} from 'lucide-react'
import type { ModelStats, ActorStats, PortfolioItem, ArtistSkill } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/dashboard'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import type { MyArtistProfile } from '@/lib/api/artists'

const EXPERIENCE_LABEL: Record<string, string> = {
  new_face: 'New face',
  semi_pro: 'Semi-pro',
  professional: 'Professional',
}

const SKILL_TYPE_LABEL: Record<string, string> = {
  accent: 'Accents',
  language: 'Languages',
  special_skill: 'Special skills',
  training: 'Training',
}

export default function ArtistProfilePage() {
  const profile = useMyArtistProfile()

  if (profile.isPending) return <LoadingState rows={3} variant="detail" />
  if (profile.isError || !profile.data) {
    return (
      <ErrorState
        message="We couldn’t load your profile."
        onRetry={() => void profile.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="This is how your profile reads to casters. Keep it sharp."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/artist/profile/preview">
                <Eye className="mr-1.5 h-4 w-4" /> Public preview
              </Link>
            </Button>
            <Button asChild>
              <Link href="/artist/profile/edit">
                <Pencil className="mr-1.5 h-4 w-4" /> Edit profile
              </Link>
            </Button>
          </>
        }
      />
      <ProfileSummary profile={profile.data} />
    </div>
  )
}

export function ProfileSummary({ profile }: { profile: MyArtistProfile }) {
  const portfolio = profile.portfolioItems ?? []
  const primary = portfolio.find((p) => p.isPrimary) ?? portfolio[0]
  const isNew = profile.ratingCount === 0
  const ratingDisplay =
    profile.ratingAvg != null ? Number(profile.ratingAvg).toFixed(1) : '–'

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Left — identity card */}
      <div className="space-y-4">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[3/4] bg-muted">
            {primary ? (
              <RemoteImage
                src={primary.url}
                alt={`${profile.firstName}’s primary photo`}
                fill
                sizes="320px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No primary photo
              </div>
            )}
          </div>
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
              >
                {profile.artistType}
              </Badge>
              {profile.idVerified ? (
                <Badge className="bg-emerald-600 text-white">
                  <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                </Badge>
              ) : null}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </h2>
              {profile.city ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {profile.city}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Stat
                label="Rating"
                value={
                  isNew ? (
                    <Badge variant="outline" className="font-normal">
                      <Sparkles className="mr-1 h-3 w-3" /> New
                    </Badge>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {ratingDisplay}
                    </span>
                  )
                }
                sub={
                  isNew
                    ? 'New to Platform'
                    : `${profile.ratingCount} review${profile.ratingCount === 1 ? '' : 's'}`
                }
              />
              <Stat
                label="Booked"
                value={
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {profile.jobsCompleted}
                  </span>
                }
                sub="jobs completed"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Right — details */}
      <div className="space-y-6">
        <Card className="space-y-3 p-6">
          <DetailRow label="Experience">
            {profile.experienceLevel
              ? (EXPERIENCE_LABEL[profile.experienceLevel] ?? profile.experienceLevel)
              : '—'}
          </DetailRow>
          <DetailRow label="Availability">
            <Badge
              variant="outline"
              className={
                profile.availabilityStatus === 'available'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'font-normal'
              }
            >
              {profile.availabilityStatus === 'available'
                ? 'Available for work'
                : 'Not available'}
            </Badge>
          </DetailRow>
          {profile.bio ? (
            <div className="border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Bio</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{profile.bio}</p>
            </div>
          ) : null}
        </Card>

        {profile.artistType === 'model' ? (
          <ModelStatsCard stats={profile.modelStats} />
        ) : (
          <>
            <ActorStatsCard stats={profile.actorStats} />
            <SkillsCard skills={profile.skills ?? []} />
          </>
        )}

        <PortfolioCard items={portfolio} />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: React.ReactNode
  sub: string
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  )
}

function StatGrid({ rows }: { rows: Array<[string, string | null]> }) {
  const visible = rows.filter((r): r is [string, string] => r[1] !== null && r[1] !== '')
  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No details provided yet.</p>
  }
  return (
    <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {visible.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between border-b border-border/60 py-2">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ModelStatsCard({ stats }: { stats: ModelStats | null }) {
  const rows: Array<[string, string | null]> = stats
    ? [
        ['Height', `${stats.heightCm} cm`],
        ['Weight', stats.weightKg != null ? `${stats.weightKg} kg` : null],
        ['Dress size', stats.dressSize],
        ['Shoe size', stats.shoeSize],
        [
          'Measurements',
          stats.bustCm && stats.waistCm && stats.hipCm
            ? `${stats.bustCm} / ${stats.waistCm} / ${stats.hipCm} cm`
            : null,
        ],
        ['Hair', stats.hairColour],
        ['Eyes', stats.eyeColour],
        ['Skin tone', stats.skinTone],
      ]
    : []
  return (
    <Card className="space-y-4 p-6">
      <h3 className="text-sm font-semibold text-foreground">Model stats</h3>
      <StatGrid rows={rows} />
    </Card>
  )
}

export function ActorStatsCard({ stats }: { stats: ActorStats | null }) {
  const rows: Array<[string, string | null]> = stats
    ? [
        ['Height', `${stats.heightCm} cm`],
        ['Hair', stats.hairColour],
        ['Eyes', stats.eyeColour],
        ['Voice type', stats.voiceType],
        ['Age range', `${stats.ageRangeMin}–${stats.ageRangeMax}`],
        ['Equity member', stats.equityMember ? 'Yes' : 'No'],
      ]
    : []
  return (
    <Card className="space-y-4 p-6">
      <h3 className="text-sm font-semibold text-foreground">Actor stats</h3>
      <StatGrid rows={rows} />
      {stats?.spotlightUrl ? (
        <a
          href={stats.spotlightUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm text-primary hover:underline"
        >
          View Spotlight profile
        </a>
      ) : null}
    </Card>
  )
}

export function SkillsCard({ skills }: { skills: ArtistSkill[] }) {
  const grouped = skills.reduce<Record<string, ArtistSkill[]>>((acc, skill) => {
    ;(acc[skill.skillType] ??= []).push(skill)
    return acc
  }, {})
  const groups = Object.entries(grouped)

  return (
    <Card className="space-y-4 p-6">
      <h3 className="text-sm font-semibold text-foreground">Skills</h3>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No skills listed yet.</p>
      ) : (
        <div className="space-y-3">
          {groups.map(([type, items]) => (
            <div key={type}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {SKILL_TYPE_LABEL[type] ?? type}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {items.map((s) => (
                  <li key={s.id}>
                    <Badge variant="outline" className="font-normal">
                      {s.skillValue}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function PortfolioCard({ items }: { items: PortfolioItem[] }) {
  return (
    <Card className="space-y-4 p-6">
      <h3 className="text-sm font-semibold text-foreground">Portfolio</h3>
      {items.length === 0 ? (
        <EmptyState
          title="No portfolio items"
          description="Add photos in the editor so casters can see your work."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted"
            >
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  poster={item.thumbnailUrl ?? undefined}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <RemoteImage
                  src={item.url}
                  alt={item.caption ?? 'Portfolio item'}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              )}
              {item.isPrimary ? (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Primary
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
