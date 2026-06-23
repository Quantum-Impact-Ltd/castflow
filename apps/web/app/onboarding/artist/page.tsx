'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OnboardingShell } from '@/components/onboarding/onboarding-shell'
import { StepCraft } from '@/components/onboarding/steps/step-craft'
import { StepPersonal } from '@/components/onboarding/steps/step-personal'
import { StepStats } from '@/components/onboarding/steps/step-stats'
import { StepSkills } from '@/components/onboarding/steps/step-skills'
import { StepExperience } from '@/components/onboarding/steps/step-experience'
import { StepPortfolio } from '@/components/onboarding/steps/step-portfolio'
import { StepLinks } from '@/components/onboarding/steps/step-links'
import { StepIdentity } from '@/components/onboarding/steps/step-identity'
import { StepReview } from '@/components/onboarding/steps/step-review'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle } from 'lucide-react'
import type { MyArtistProfile } from '@/lib/api/artists'

type StepKey =
  | 'craft'
  | 'personal'
  | 'stats'
  | 'skills'
  | 'experience'
  | 'portfolio'
  | 'links'
  | 'identity'
  | 'review'

const MODEL_STEPS = [
  { key: 'craft', label: 'Craft' },
  { key: 'personal', label: 'Personal' },
  { key: 'stats', label: 'Stats' },
  { key: 'experience', label: 'Experience' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'links', label: 'Links' },
  { key: 'identity', label: 'ID' },
  { key: 'review', label: 'Review' },
] as const satisfies ReadonlyArray<{ key: StepKey; label: string }>

const ACTOR_STEPS = [
  { key: 'craft', label: 'Craft' },
  { key: 'personal', label: 'Personal' },
  { key: 'stats', label: 'Stats' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'links', label: 'Links' },
  { key: 'identity', label: 'ID' },
  { key: 'review', label: 'Review' },
] as const satisfies ReadonlyArray<{ key: StepKey; label: string }>

interface StepCopy {
  title: string
  subtitle: string
  tips: { heading: string; bullets: ReadonlyArray<string> }
}

const STEP_COPY: Record<StepKey, StepCopy> = {
  craft: {
    title: 'Which craft are you here for?',
    subtitle:
      'Pick the one that fits you best. This shapes the rest of your application. Takes about 10 minutes start to finish.',
    tips: {
      heading: 'Not sure which to pick?',
      bullets: [
        'Model is for photography and video where the work is primarily visual — fashion, editorial, commercial, e-commerce.',
        "Actor is for jobs where you perform — TVC, film, voiceover, extra work. You'll get a skills section for accents, languages and training.",
        'You can change your craft any time before submitting for review.',
      ],
    },
  },
  personal: {
    title: 'Tell us about yourself',
    subtitle: 'Basics that appear on your profile and help casters find you.',
    tips: {
      heading: 'A few things to know',
      bullets: [
        'You must be 18 or older — this is enforced and non-negotiable.',
        "Your city helps casters filter the talent directory; pick the city you're based in, not where you're available.",
        'Bios are optional but profiles with one get more shortlists.',
      ],
    },
  },
  stats: {
    title: 'Your stats',
    subtitle: 'Measurements and physical details casters filter by.',
    tips: {
      heading: 'A few notes',
      bullets: [
        'Be accurate — casters book based on these and a no-show or mismatch on the day is grounds for a dispute.',
        'Measurements are optional but high-quality fashion casting calls filter on them.',
        "Skin tone is a visual swatch — pick the closest match; it doesn't need to be perfect.",
      ],
    },
  },
  skills: {
    title: 'Skills, accents, languages',
    subtitle: 'Multi-add the skills that show up in talent search filters.',
    tips: {
      heading: 'How casters search',
      bullets: [
        'Casters filter by these tags — being specific ("RP", "Estuary") beats generic ("British").',
        "Only list languages and skills you'd genuinely perform on a shoot. Padding triggers rejections.",
        'You can add and remove these later from your profile.',
      ],
    },
  },
  experience: {
    title: 'Experience and rates',
    subtitle: 'Your level and the rates you typically charge.',
    tips: {
      heading: 'How casters use this',
      bullets: [
        '"New face" isn\'t a downside — many brands actively look for fresh faces.',
        'Indicative rates are optional. If you set them, expect more direct invites at that level.',
        'You can always negotiate on a per-job basis through bids regardless of what you list here.',
      ],
    },
  },
  portfolio: {
    title: 'Your portfolio',
    subtitle: 'At least three photos: a headshot, a full-body, and one more.',
    tips: {
      heading: 'What casters look for',
      bullets: [
        'A clear, recent headshot (eyes to camera, neutral or natural light).',
        'A full-body shot in plain clothing so they can see your proportions.',
        'One or two "in action" shots — editorial, commercial, or a self-directed test.',
        'Avoid heavy filters and group photos. One person per frame.',
      ],
    },
  },
  links: {
    title: 'Add your links',
    subtitle:
      'Showreel, website, and social profiles casters can explore. Optional but recommended.',
    tips: {
      heading: 'Worth adding',
      bullets: [
        'A showreel or portfolio site (YouTube, Vimeo, Behance, your own domain) gives casters more to go on.',
        'Actors: add your Spotlight and IMDb. Models: Instagram and an agency/portfolio link.',
        'You can add or change these any time from your profile — this step is optional.',
      ],
    },
  },
  identity: {
    title: 'Verify your identity',
    subtitle: 'Upload a passport or UK driving licence. Admin only — never shown to casters.',
    tips: {
      heading: 'Why we need this',
      bullets: [
        "Confirms you're 18+ and a real person — required by law for anyone we pay.",
        'Stored encrypted in a private bucket. Only CastFlow admins can view it.',
        'Casters never see your document. Just a "Verified" badge on your profile.',
      ],
    },
  },
  review: {
    title: 'Review and submit',
    subtitle: 'Check everything looks right, then submit for admin approval.',
    tips: {
      heading: 'Last few things',
      bullets: [
        'You can come back and edit until you submit. After submitting, edits are locked while admin reviews.',
        'Expected turnaround is within 48 hours. We email you with the decision.',
        'Rejections come with a specific reason — you can fix and resubmit.',
      ],
    },
  },
}

function StepTips({ stepKey }: { stepKey: StepKey }) {
  const copy = STEP_COPY[stepKey].tips
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-tight">{copy.heading}</h3>
      <ul className="text-muted-foreground space-y-2 text-sm leading-relaxed">
        {copy.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-foreground/40 mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-current" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function clampStep(n: number, max: number) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(n, max))
}

/**
 * Returns the index of the first step the artist has NOT yet completed.
 * Used to (a) resume from the right place and (b) lock forward steps.
 */
function deriveFirstIncompleteStep(
  profile: MyArtistProfile,
  steps: ReadonlyArray<{ key: StepKey }>
): number {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    if (!step) break
    switch (step.key) {
      case 'craft':
        // Always considered done — you have a type from registration
        continue
      case 'personal':
        if (
          !profile.firstName ||
          !profile.lastName ||
          !profile.dob ||
          !profile.gender ||
          !profile.city
        )
          return i
        break
      case 'stats':
        if (profile.artistType === 'model' && !profile.modelStats) return i
        if (profile.artistType === 'actor' && !profile.actorStats) return i
        break
      case 'skills':
        // Optional for actors — treat as always passable
        continue
      case 'experience':
        if (!profile.experienceLevel) return i
        break
      case 'portfolio': {
        const photoCount = profile.portfolioItems.filter(
          (item) => (item as { type?: string }).type === 'photo'
        ).length
        if (photoCount < 3) return i
        break
      }
      case 'links':
        // Optional — never blocks forward progress.
        continue
      case 'identity':
        if (!profile.idDocumentUrl) return i
        break
      case 'review':
        return i
    }
  }
  return steps.length - 1
}

export default function ArtistOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: profile, isLoading, isError } = useMyArtistProfile()

  useEffect(() => {
    if (profile?.submittedAt && profile.approvalStatus !== 'rejected') {
      router.replace('/onboarding/pending')
    }
  }, [profile?.submittedAt, profile?.approvalStatus, router])

  const isActor = profile?.artistType === 'actor'
  const steps = useMemo<ReadonlyArray<{ key: StepKey; label: string }>>(
    () => (isActor ? ACTOR_STEPS : MODEL_STEPS),
    [isActor]
  )

  const [currentIndex, setCurrentIndex] = useState(() =>
    clampStep(Number(searchParams.get('step') ?? '0'), steps.length - 1)
  )

  // On first profile load: if no URL step was provided, jump to the first
  // incomplete step so returning artists resume where they left off.
  const profileLoadedRef = useRef(false)
  useEffect(() => {
    if (!profile || profileLoadedRef.current) return
    profileLoadedRef.current = true
    if (searchParams.get('step') === null) {
      const derived = deriveFirstIncompleteStep(profile, steps)
      setCurrentIndex(derived)
    }
  }, [profile, steps, searchParams])

  // Sync current index → URL (one-way, no loop)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (currentIndex === 0) params.delete('step')
    else params.set('step', String(currentIndex))
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?', { scroll: false })
  }, [currentIndex, router])

  // If artist type changes, clamp index inside new step list
  useEffect(() => {
    setCurrentIndex((i) => clampStep(i, steps.length - 1))
  }, [steps.length])

  // Max step the stepper allows clicking — derived from profile completeness
  const maxUnlockedIndex = useMemo(() => {
    if (!profile) return currentIndex
    return deriveFirstIncompleteStep(profile, steps)
  }, [profile, steps, currentIndex])

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-[var(--ink-900)] text-white">
        <div className="mx-auto max-w-5xl space-y-6 p-8">
          <Skeleton className="h-10 w-full bg-white/[0.04]" />
          <Skeleton className="h-64 w-full bg-white/[0.04]" />
        </div>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--ink-900)] text-white">
        <div className="text-center">
          <p className="text-sm text-white/55">
            Couldn&apos;t load your profile. Please refresh and try again.
          </p>
        </div>
      </div>
    )
  }

  const currentStep = steps[currentIndex]
  if (!currentStep) return null
  const copy = STEP_COPY[currentStep.key]

  const goNext = () => setCurrentIndex((i) => Math.min(steps.length - 1, i + 1))
  const goBack = () => setCurrentIndex((i) => Math.max(0, i - 1))

  return (
    <OnboardingShell
      steps={steps}
      currentIndex={currentIndex}
      onStepClick={setCurrentIndex}
      maxUnlockedIndex={maxUnlockedIndex}
      title={copy.title}
      subtitle={copy.subtitle}
      tips={<StepTips stepKey={currentStep.key} />}
    >
      {/* Rejection banner. Surfaces admin notes so the artist knows what
          to fix before resubmitting — avoids resubmit-and-get-rejected
          loops. (Audit H15.) */}
      {profile.approvalStatus === 'rejected' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-white">Your last application needs changes</p>
            {profile.approvalNotes ? (
              <p className="whitespace-pre-wrap leading-relaxed text-white/75">
                {profile.approvalNotes}
              </p>
            ) : (
              <p className="leading-relaxed text-white/65">
                The admin didn&apos;t leave specific notes. Tighten anything that feels weak and
                resubmit.
              </p>
            )}
            <p className="pt-1 text-xs text-white/55">
              Once you&apos;ve fixed this, head to the Review step and resubmit.
            </p>
          </div>
        </div>
      )}

      {currentStep.key === 'craft' && (
        <StepCraft currentType={profile.artistType} onNext={goNext} />
      )}
      {currentStep.key === 'personal' && (
        <StepPersonal profile={profile} onBack={goBack} onNext={goNext} />
      )}
      {currentStep.key === 'stats' && (
        <StepStats profile={profile} onBack={goBack} onNext={goNext} />
      )}
      {currentStep.key === 'skills' && (
        <StepSkills profile={profile} onBack={goBack} onNext={goNext} />
      )}
      {currentStep.key === 'experience' && (
        <StepExperience profile={profile} onBack={goBack} onNext={goNext} />
      )}
      {currentStep.key === 'portfolio' && (
        <StepPortfolio profile={profile} onBack={goBack} onNext={goNext} />
      )}
      {currentStep.key === 'links' && (
        <StepLinks profile={profile} onBack={goBack} onNext={goNext} />
      )}
      {currentStep.key === 'identity' && (
        <StepIdentity profile={profile} onBack={goBack} onNext={goNext} />
      )}
      {currentStep.key === 'review' && (
        <StepReview
          profile={profile}
          onBack={goBack}
          onJumpTo={(key) => {
            const idx = steps.findIndex((s) => s.key === key)
            if (idx >= 0) setCurrentIndex(idx)
          }}
        />
      )}
    </OnboardingShell>
  )
}
