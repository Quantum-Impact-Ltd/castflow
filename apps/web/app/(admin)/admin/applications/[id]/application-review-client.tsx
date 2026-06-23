'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, Check, X, ShieldCheck, ShieldAlert, CalendarDays } from 'lucide-react'
import type { ArtistProfile, ModelStats, ActorStats, ArtistSkill } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/dashboard'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { Stars } from '@/components/dashboard/stars'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useApplication,
  useApplicationIdDocumentUrl,
  useApproveApplication,
  useRejectApplication,
} from '@/lib/hooks/use-admin'
import { formatDate, formatRating } from '@/lib/utils'

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

const REJECT_REASONS: { value: string; label: string }[] = [
  { value: 'portfolio_quality', label: 'Portfolio quality too low' },
  { value: 'id_unclear', label: 'ID document unclear or invalid' },
  { value: 'info_incomplete', label: 'Profile information incomplete' },
  { value: 'suspected_duplicate', label: 'Suspected duplicate account' },
  { value: 'other', label: 'Other' },
]

export function ApplicationReviewClient({ profileId }: { profileId: string }) {
  const { data: application, isPending, isError, refetch } = useApplication(profileId)

  if (isPending) return <LoadingState variant="detail" />
  if (isError) {
    return (
      <ErrorState message="We couldn’t load this application." onRetry={() => void refetch()} />
    )
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState
          title="Application not found"
          description="It may have already been actioned or removed from the queue."
          icon={<ShieldAlert className="h-6 w-6" />}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/applications">Back to queue</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return <ReviewBody application={application} />
}

function BackLink() {
  return (
    <Link
      href="/admin/applications"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to queue
    </Link>
  )
}

function ReviewBody({ application }: { application: ArtistProfile }) {
  const portfolio = application.portfolioItems ?? []
  const primary = portfolio.find((p) => p.isPrimary) ?? portfolio[0]
  const skills = application.skills ?? []
  const isPending = application.approvalStatus === 'pending'

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={`${application.firstName} ${application.lastName}`}
        description={`${application.city} · ${EXPERIENCE_LABEL[application.experienceLevel] ?? application.experienceLevel}`}
        actions={
          isPending ? (
            <div className="flex items-center gap-2">
              <RejectDialog id={application.id} name={application.firstName} />
              <ApproveDialog id={application.id} name={application.firstName} />
            </div>
          ) : (
            <StatusBadge status={application.approvalStatus} />
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="capitalize">
          {application.artistType}
        </Badge>
        <StatusBadge status={application.approvalStatus} />
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {application.city}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Submitted {formatDate(application.createdAt)}
        </span>
        {application.ratingCount > 0 ? (
          <span className="flex items-center gap-1.5">
            <Stars value={application.ratingAvg ?? 0} size={14} />
            <span className="text-sm text-muted-foreground">
              {formatRating(application.ratingAvg)} ({application.ratingCount})
            </span>
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left — primary image + identity */}
        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-[3/4] bg-muted">
              {primary ? (
                <RemoteImage
                  src={primary.url}
                  alt={`${application.firstName}’s primary photo`}
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
            <div className="space-y-2 p-5">
              <h2 className="text-lg font-semibold text-foreground">
                {application.firstName} {application.lastName}
              </h2>
              {application.pronouns ? (
                <p className="text-sm text-muted-foreground">{application.pronouns}</p>
              ) : null}
              <dl className="space-y-1.5 pt-1 text-sm">
                <Row label="Gender" value={application.gender} />
                <Row label="Date of birth" value={formatDate(application.dob)} />
                {application.instagramHandle ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Instagram</dt>
                    <dd>
                      <a
                        href={`https://instagram.com/${application.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        @{application.instagramHandle}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </Card>

          <IdentityCard application={application} />
        </div>

        {/* Right — details */}
        <div className="space-y-6">
          <Card className="space-y-3 p-6">
            <Row label="Experience">
              {EXPERIENCE_LABEL[application.experienceLevel] ?? application.experienceLevel}
            </Row>
            {application.bio ? (
              <div className="border-t border-border pt-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Bio</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {application.bio}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bio provided.</p>
            )}
          </Card>

          {application.artistType === 'model' ? (
            <ModelStatsCard stats={application.modelStats ?? null} />
          ) : (
            <>
              <ActorStatsCard stats={application.actorStats ?? null} />
              <SkillsCard skills={skills} />
            </>
          )}

          <PortfolioCard application={application} />
        </div>
      </div>
    </div>
  )
}

function IdentityCard({ application }: { application: ArtistProfile }) {
  const hasId =
    application.idVerified || Boolean((application as { idDocumentUrl?: string }).idDocumentUrl)

  // Only fetch the short-lived presigned read once the admin asks to see it.
  const [reveal, setReveal] = useState(false)
  const idDoc = useApplicationIdDocumentUrl(application.id, reveal && hasId)

  return (
    <Card className="space-y-3 p-5">
      <h3 className="text-sm font-semibold text-foreground">Identity</h3>
      <div className="flex items-center gap-2 text-sm">
        {hasId ? (
          <>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-foreground">ID document uploaded</span>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          </>
        ) : (
          <>
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-foreground">No ID on file</span>
          </>
        )}
      </div>

      {hasId ? (
        !reveal ? (
          <Button variant="outline" size="sm" onClick={() => setReveal(true)}>
            View ID document
          </Button>
        ) : idDoc.isPending ? (
          <p className="text-xs text-muted-foreground">Loading secure preview…</p>
        ) : idDoc.isError || !idDoc.data ? (
          <p className="text-xs text-destructive">Could not load the ID document.</p>
        ) : idDoc.data.contentTypeHint === 'image' ? (
          // Plain <img>: the source is a short-lived presigned URL we don't
          // want the Next image optimizer to cache.
          <img
            src={idDoc.data.url}
            alt={`ID document for ${application.firstName} ${application.lastName}`}
            className="max-h-72 w-full rounded-lg border border-border bg-muted object-contain"
          />
        ) : (
          <a
            href={idDoc.data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Open ID document ({idDoc.data.contentTypeHint === 'pdf' ? 'PDF' : 'file'}) ↗
          </a>
        )
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        The preview is a short-lived secure link — the raw storage key is never rendered, and the
        document is never copied into our storage.
      </p>
    </Card>
  )
}

function ApproveDialog({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const approve = useApproveApplication()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Check className="mr-1.5 h-4 w-4" /> Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve {name}?</DialogTitle>
          <DialogDescription>
            {name} will gain full access to the platform and be notified by email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="approve-notes">Internal notes (optional)</Label>
          <Textarea
            id="approve-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth recording for the audit log."
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={approve.isPending}
            onClick={() =>
              approve.mutate(
                { id, notes: notes.trim() || undefined },
                {
                  onSuccess: () => {
                    setOpen(false)
                    router.push('/admin/applications')
                  },
                }
              )
            }
          >
            {approve.isPending ? 'Approving…' : 'Approve application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RejectDialog({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const reject = useRejectApplication()

  const notesRequired = reason === 'other'
  const valid = reason !== '' && (!notesRequired || notes.trim().length >= 3)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <X className="mr-1.5 h-4 w-4" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {name}?</DialogTitle>
          <DialogDescription>
            {name} will be notified by email with the reason below. This can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reject-reason" className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reject-notes">
              Notes{' '}
              {notesRequired ? <span className="text-destructive">(required)</span> : '(optional)'}
            </Label>
            <Textarea
              id="reject-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                notesRequired
                  ? 'Explain the reason for rejection.'
                  : 'Any additional context (shared with the applicant).'
              }
            />
            {notesRequired && notes.length > 0 && notes.trim().length < 3 ? (
              <p className="text-xs text-destructive">Please give at least 3 characters.</p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!valid || reject.isPending}
            onClick={() =>
              reject.mutate(
                { id, reason, notes: notes.trim() || undefined },
                {
                  onSuccess: () => {
                    setOpen(false)
                    router.push('/admin/applications')
                  },
                }
              )
            }
          >
            {reject.isPending ? 'Rejecting…' : 'Reject application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize text-foreground">
        {children ?? value ?? '—'}
      </span>
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
        <div
          key={label}
          className="flex items-center justify-between border-b border-border/60 py-2"
        >
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium capitalize text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ModelStatsCard({ stats }: { stats: ModelStats | null }) {
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

function ActorStatsCard({ stats }: { stats: ActorStats | null }) {
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

function SkillsCard({ skills }: { skills: ArtistSkill[] }) {
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

function PortfolioCard({ application }: { application: ArtistProfile }) {
  const items = application.portfolioItems ?? []
  return (
    <Card className="space-y-4 p-6">
      <h3 className="text-sm font-semibold text-foreground">Portfolio</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No portfolio items uploaded.</p>
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
                  alt={item.caption ?? `${application.firstName}’s portfolio item`}
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
