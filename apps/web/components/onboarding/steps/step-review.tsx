'use client'

import { forwardRef, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useSubmitForReview } from '@/lib/hooks/use-artist'
import { cn } from '@/lib/utils'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'
import type { ApiError } from '@/lib/fetcher'

type JumpableKey = 'craft' | 'personal' | 'stats' | 'skills' | 'experience' | 'portfolio' | 'identity'

interface StepReviewProps {
  profile: MyArtistProfile
  onBack: () => void
  onJumpTo: (key: JumpableKey) => void
}

type SectionTone = 'ok' | 'missing'

interface Section {
  key: 'craft' | 'personal' | 'stats' | 'skills' | 'experience' | 'portfolio' | 'identity'
  title: string
  rows: Array<{ label: string; value: string }>
  tone: SectionTone
}

function buildSections(profile: MyArtistProfile): Section[] {
  const sections: Section[] = []

  sections.push({
    key: 'craft',
    title: 'Craft',
    tone: 'ok',
    rows: [{ label: 'Type', value: profile.artistType === 'model' ? 'Model' : 'Actor' }],
  })

  const personalRows: Array<{ label: string; value: string }> = [
    { label: 'Name', value: `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || '—' },
    { label: 'Date of birth', value: profile.dob ? profile.dob.slice(0, 10) : '—' },
    { label: 'Gender', value: profile.gender ?? '—' },
    { label: 'City', value: profile.city ?? '—' },
  ]
  if (profile.bio) personalRows.push({ label: 'Bio', value: profile.bio })
  sections.push({
    key: 'personal',
    title: 'Personal',
    tone:
      profile.firstName && profile.lastName && profile.dob && profile.gender && profile.city
        ? 'ok'
        : 'missing',
    rows: personalRows,
  })

  if (profile.artistType === 'model') {
    const ms = (profile.modelStats ?? null) as
      | (Record<string, unknown> & {
          heightCm?: number
          dressSize?: string
          shoeSize?: string
          hairColour?: string
          eyeColour?: string
          skinTone?: string
        })
      | null
    sections.push({
      key: 'stats',
      title: 'Stats',
      tone: ms ? 'ok' : 'missing',
      rows: ms
        ? [
            { label: 'Height', value: ms.heightCm ? `${ms.heightCm} cm` : '—' },
            { label: 'Dress / Shoe', value: `${ms.dressSize ?? '—'} · ${ms.shoeSize ?? '—'}` },
            { label: 'Hair · Eyes', value: `${ms.hairColour ?? '—'} · ${ms.eyeColour ?? '—'}` },
            { label: 'Skin tone', value: ms.skinTone ?? '—' },
          ]
        : [{ label: 'Stats', value: 'Not provided' }],
    })
  } else {
    const as = (profile.actorStats ?? null) as
      | (Record<string, unknown> & {
          heightCm?: number
          hairColour?: string
          eyeColour?: string
          ageRangeMin?: number
          ageRangeMax?: number
          equityMember?: boolean
        })
      | null
    sections.push({
      key: 'stats',
      title: 'Stats',
      tone: as ? 'ok' : 'missing',
      rows: as
        ? [
            { label: 'Height', value: as.heightCm ? `${as.heightCm} cm` : '—' },
            { label: 'Hair · Eyes', value: `${as.hairColour ?? '—'} · ${as.eyeColour ?? '—'}` },
            {
              label: 'Playable age',
              value:
                as.ageRangeMin && as.ageRangeMax ? `${as.ageRangeMin}–${as.ageRangeMax}` : '—',
            },
            { label: 'Equity', value: as.equityMember ? 'Member' : 'Not a member' },
          ]
        : [{ label: 'Stats', value: 'Not provided' }],
    })

    const skillCount = profile.skills.length
    sections.push({
      key: 'skills',
      title: 'Skills',
      tone: skillCount > 0 ? 'ok' : 'missing',
      rows: [{ label: 'Tags', value: skillCount > 0 ? `${skillCount} added` : 'None added' }],
    })
  }

  sections.push({
    key: 'experience',
    title: 'Experience',
    tone: profile.experienceLevel ? 'ok' : 'missing',
    rows: [
      {
        label: 'Level',
        value: profile.experienceLevel
          ? profile.experienceLevel.replace('_', ' ')
          : 'Not selected',
      },
      ...(profile.instagramHandle
        ? [{ label: 'Instagram', value: `@${profile.instagramHandle}` }]
        : []),
    ],
  })

  const photoCount = profile.portfolioItems.filter(
    (i) => (i as { type?: string }).type === 'photo'
  ).length
  sections.push({
    key: 'portfolio',
    title: 'Portfolio',
    tone: photoCount >= 3 ? 'ok' : 'missing',
    rows: [{ label: 'Photos', value: `${photoCount} uploaded (3 required)` }],
  })

  sections.push({
    key: 'identity',
    title: 'Identity',
    tone: profile.idDocumentUrl ? 'ok' : 'missing',
    rows: [
      {
        label: 'Document',
        value: profile.idDocumentUrl ? 'Uploaded, awaiting admin review' : 'Not uploaded',
      },
    ],
  })

  return sections
}

/** Maps backend field names to the section key the user should fix. */
const FIELD_TO_STEP: Record<string, JumpableKey> = {
  firstName: 'personal',
  lastName: 'personal',
  dob: 'personal',
  gender: 'personal',
  city: 'personal',
  modelStats: 'stats',
  actorStats: 'stats',
  heightCm: 'stats',
  experienceLevel: 'experience',
  portfolioItems: 'portfolio',
  idDocumentUrl: 'identity',
}

export function StepReview({ profile, onBack, onJumpTo }: StepReviewProps) {
  const router = useRouter()
  const submit = useSubmitForReview()
  const sections = buildSections(profile)
  const hasMissing = sections.some((s) => s.tone === 'missing')
  const cardRefs = useRef<Partial<Record<JumpableKey, HTMLDivElement | null>>>({})

  const handleSubmit = () => {
    submit.mutate(undefined, {
      onSuccess: () => {
        toast.success('Application submitted')
        router.push('/onboarding/pending')
      },
      onError: (err) => {
        const apiErr = err as ApiError
        if (apiErr.fields) {
          // Map the first field error to the relevant section and jump there
          const firstField = Object.keys(apiErr.fields)[0]
          const stepKey = firstField ? FIELD_TO_STEP[firstField] : undefined
          if (stepKey) {
            onJumpTo(stepKey)
            toast.error(`Please complete the ${stepKey} section before submitting.`)
          } else {
            toast.error(apiErr.message)
          }
        } else if (err instanceof Error) {
          toast.error(err.message)
        }
      },
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <ReviewCard
            key={section.key}
            section={section}
            onEdit={() => {
              onJumpTo(section.key)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            ref={(el) => { cardRefs.current[section.key] = el }}
          />
        ))}
      </div>

      {hasMissing && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Some sections look incomplete. You can submit anyway, but the backend will
            reject the application if any required field is missing or there are fewer
            than 3 portfolio photos.
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 backdrop-blur-xl">
        <h3 className="text-sm font-semibold tracking-tight text-white">What happens next</h3>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-white/65">
          <li>· Your application goes to the admin review queue.</li>
          <li>· Expected turnaround is within 48 hours.</li>
          <li>· You&apos;ll get an email when there&apos;s a decision.</li>
          <li>
            · If approved, your profile goes live and you can start bidding on jobs
            straight away.
          </li>
        </ul>
      </div>

      <StepNav
        onBack={onBack}
        onNext={handleSubmit}
        nextType="button"
        nextLabel="Submit for review"
        isSubmitting={submit.isPending}
      />
    </div>
  )
}

const ReviewCard = forwardRef<HTMLDivElement, { section: Section; onEdit: () => void }>(
  function ReviewCard({ section, onEdit }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border p-4 backdrop-blur-xl transition',
          section.tone === 'ok'
            ? 'border-white/12 bg-white/[0.03]'
            : 'border-rose-400/30 bg-rose-400/[0.04]'
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {section.tone === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-300" />
            )}
            <h4 className="text-sm font-semibold text-white">{section.title}</h4>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-xs text-white/45 transition hover:text-white"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
        <dl className="space-y-1.5">
          {section.rows.map((row) => (
            <div key={row.label} className="flex items-baseline gap-2 text-sm">
              <dt className="w-20 shrink-0 text-xs text-white/45">{row.label}</dt>
              <dd className="break-words text-white/85">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    )
  }
)
