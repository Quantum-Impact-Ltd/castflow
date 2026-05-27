'use client'

import { useRef, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Lock,
  Upload,
  Star,
  Trash2,
  Plus,
  X,
  Info,
} from 'lucide-react'
import {
  artistPersonalInfoSchema,
  modelStatsSchema,
  actorStatsSchema,
  artistExperienceSchema,
  replaceSkillsSchema,
  type ArtistPersonalInfoInput,
  type ModelStatsInput,
  type ActorStatsInput,
  type ArtistExperienceInput,
  type ReplaceSkillsInput,
} from '@castflow/validators'
import type { MyArtistProfile } from '@/lib/api/artists'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { AvailabilityToggle } from '@/components/dashboard/availability-toggle'
import { EmptyState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useUpdatePersonal,
  useUpdateModelStats,
  useUpdateActorStats,
  useUpdateExperience,
  useReplaceSkills,
  useUpdateArtistType,
  useSubmitForReview,
} from '@/lib/hooks/use-artist'
import {
  useUploadFile,
  useDeletePortfolioItem,
  useSetPrimaryPortfolioItem,
} from '@/lib/hooks/use-uploads'

const REVIEW_NOTE = 'Some changes may require admin re-review.'

export function EditClient({ profile }: { profile: MyArtistProfile }) {
  const rejected = profile.approvalStatus === 'rejected'

  return (
    <div className="space-y-6">
      {rejected ? <RejectionBanner profile={profile} /> : null}

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="experience">Experience &amp; rates</TabsTrigger>
          <TabsTrigger value="stats">
            {profile.artistType === 'model' ? 'Model stats' : 'Actor stats'}
          </TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="type">Artist type</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalSection profile={profile} />
        </TabsContent>
        <TabsContent value="experience" className="mt-6">
          <ExperienceSection profile={profile} />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          {profile.artistType === 'model' ? (
            <ModelStatsSection profile={profile} />
          ) : (
            <div className="space-y-6">
              <ActorStatsSection profile={profile} />
              <SkillsSection profile={profile} />
            </div>
          )}
        </TabsContent>
        <TabsContent value="availability" className="mt-6">
          <AvailabilitySection profile={profile} />
        </TabsContent>
        <TabsContent value="portfolio" className="mt-6">
          <PortfolioSection profile={profile} />
        </TabsContent>
        <TabsContent value="type" className="mt-6">
          <ArtistTypeSection profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* --------------------------------- shared --------------------------------- */

function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </Card>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function ReReviewNote() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5" /> {REVIEW_NOTE}
    </p>
  )
}

function RejectionBanner({ profile }: { profile: MyArtistProfile }) {
  const submit = useSubmitForReview()
  return (
    <Card className="space-y-3 border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">Your profile wasn’t approved</p>
          {profile.approvalNotes ? (
            <p className="text-sm text-muted-foreground">{profile.approvalNotes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Update the details below, then resubmit for review.
            </p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        disabled={submit.isPending}
        onClick={() =>
          submit.mutate(undefined, {
            onSuccess: () => toast.success('Resubmitted for review'),
          })
        }
      >
        {submit.isPending ? 'Resubmitting…' : 'Resubmit for review'}
      </Button>
    </Card>
  )
}

/* ------------------------------- personal -------------------------------- */

function PersonalSection({ profile }: { profile: MyArtistProfile }) {
  const update = useUpdatePersonal()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ArtistPersonalInfoInput>({
    resolver: zodResolver(artistPersonalInfoSchema),
    defaultValues: {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      dob: profile.dob ? profile.dob.slice(0, 10) : '',
      gender: profile.gender ?? '',
      pronouns: profile.pronouns ?? '',
      city: profile.city ?? '',
      bio: profile.bio ?? '',
    },
  })

  const bio = watch('bio') ?? ''

  const onSubmit = handleSubmit((data) =>
    update.mutate(data, { onSuccess: () => toast.success('Personal details saved') }),
  )

  return (
    <SectionShell title="Personal details" description="Your name, location, and bio.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
            <Input id="firstName" {...register('firstName')} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
            <Input id="lastName" {...register('lastName')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Date of birth"
            htmlFor="dob"
            error={errors.dob?.message}
            hint="You must be 18 or older."
          >
            <Input id="dob" type="date" {...register('dob')} />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
            <Input id="gender" {...register('gender')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pronouns (optional)" htmlFor="pronouns" error={errors.pronouns?.message}>
            <Input id="pronouns" placeholder="e.g. she/her" {...register('pronouns')} />
          </Field>
          <Field label="City" htmlFor="city" error={errors.city?.message}>
            <Input id="city" {...register('city')} />
          </Field>
        </div>
        <Field
          label="Bio (optional)"
          htmlFor="bio"
          error={errors.bio?.message}
          hint={`${bio.length}/300`}
        >
          <Textarea id="bio" rows={4} maxLength={300} {...register('bio')} />
        </Field>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <ReReviewNote />
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save personal details'}
          </Button>
        </div>
      </form>
    </SectionShell>
  )
}

/* ------------------------------ experience ------------------------------- */

function ExperienceSection({ profile }: { profile: MyArtistProfile }) {
  const update = useUpdateExperience()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ArtistExperienceInput>({
    resolver: zodResolver(artistExperienceSchema),
    defaultValues: {
      experienceLevel: profile.experienceLevel ?? 'new_face',
      instagramHandle: profile.instagramHandle ?? '',
    },
  })

  const level = watch('experienceLevel')

  const onSubmit = handleSubmit((data) =>
    update.mutate(data, { onSuccess: () => toast.success('Experience & rates saved') }),
  )

  return (
    <SectionShell
      title="Experience & rates"
      description="Your level, socials, and optional day rates."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field
          label="Experience level"
          error={errors.experienceLevel?.message}
        >
          <Select
            value={level}
            onValueChange={(v) =>
              setValue('experienceLevel', v as ArtistExperienceInput['experienceLevel'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new_face">New face</SelectItem>
              <SelectItem value="semi_pro">Semi-pro</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Instagram handle (optional)"
          htmlFor="instagramHandle"
          error={errors.instagramHandle?.message}
          hint="Letters, numbers, dots and underscores only — no @."
        >
          <Input id="instagramHandle" placeholder="yourhandle" {...register('instagramHandle')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Hourly rate (£)" htmlFor="hourlyRate" error={errors.hourlyRate?.message}>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              inputMode="decimal"
              {...register('hourlyRate', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Half-day rate (£)" htmlFor="halfDayRate" error={errors.halfDayRate?.message}>
            <Input
              id="halfDayRate"
              type="number"
              step="0.01"
              inputMode="decimal"
              {...register('halfDayRate', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Full-day rate (£)" htmlFor="fullDayRate" error={errors.fullDayRate?.message}>
            <Input
              id="fullDayRate"
              type="number"
              step="0.01"
              inputMode="decimal"
              {...register('fullDayRate', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <ReReviewNote />
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save experience & rates'}
          </Button>
        </div>
      </form>
    </SectionShell>
  )
}

/* ------------------------------ model stats ------------------------------ */

const SKIN_TONES: ModelStatsInput['skinTone'][] = [
  'fair',
  'light',
  'medium',
  'olive',
  'tan',
  'deep',
]

function ModelStatsSection({ profile }: { profile: MyArtistProfile }) {
  const update = useUpdateModelStats()
  const stats = profile.modelStats
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ModelStatsInput>({
    resolver: zodResolver(modelStatsSchema),
    defaultValues: {
      heightCm: stats?.heightCm,
      weightKg: stats?.weightKg ?? undefined,
      dressSize: stats?.dressSize ?? '',
      shoeSize: stats?.shoeSize ?? '',
      bustCm: stats?.bustCm ?? undefined,
      waistCm: stats?.waistCm ?? undefined,
      hipCm: stats?.hipCm ?? undefined,
      hairColour: stats?.hairColour ?? '',
      eyeColour: stats?.eyeColour ?? '',
      skinTone: stats?.skinTone ?? 'medium',
    },
  })

  const skinTone = watch('skinTone')

  const onSubmit = handleSubmit((data) =>
    update.mutate(data, { onSuccess: () => toast.success('Model stats saved') }),
  )

  return (
    <SectionShell title="Model stats" description="Casters filter talent on these.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Height (cm)" htmlFor="heightCm" error={errors.heightCm?.message}>
            <Input id="heightCm" type="number" {...register('heightCm', { valueAsNumber: true })} />
          </Field>
          <Field label="Weight (kg, optional)" htmlFor="weightKg" error={errors.weightKg?.message}>
            <Input id="weightKg" type="number" step="0.1" {...register('weightKg', { valueAsNumber: true })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dress size" htmlFor="dressSize" error={errors.dressSize?.message}>
            <Input id="dressSize" {...register('dressSize')} />
          </Field>
          <Field label="Shoe size" htmlFor="shoeSize" error={errors.shoeSize?.message}>
            <Input id="shoeSize" {...register('shoeSize')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bust (cm, optional)" htmlFor="bustCm" error={errors.bustCm?.message}>
            <Input id="bustCm" type="number" {...register('bustCm', { valueAsNumber: true })} />
          </Field>
          <Field label="Waist (cm, optional)" htmlFor="waistCm" error={errors.waistCm?.message}>
            <Input id="waistCm" type="number" {...register('waistCm', { valueAsNumber: true })} />
          </Field>
          <Field label="Hip (cm, optional)" htmlFor="hipCm" error={errors.hipCm?.message}>
            <Input id="hipCm" type="number" {...register('hipCm', { valueAsNumber: true })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Hair colour" htmlFor="hairColour" error={errors.hairColour?.message}>
            <Input id="hairColour" {...register('hairColour')} />
          </Field>
          <Field label="Eye colour" htmlFor="eyeColour" error={errors.eyeColour?.message}>
            <Input id="eyeColour" {...register('eyeColour')} />
          </Field>
          <Field label="Skin tone" error={errors.skinTone?.message}>
            <Select
              value={skinTone}
              onValueChange={(v) =>
                setValue('skinTone', v as ModelStatsInput['skinTone'], { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {SKIN_TONES.map((tone) => (
                  <SelectItem key={tone} value={tone} className="capitalize">
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <ReReviewNote />
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save model stats'}
          </Button>
        </div>
      </form>
    </SectionShell>
  )
}

/* ------------------------------ actor stats ------------------------------ */

function ActorStatsSection({ profile }: { profile: MyArtistProfile }) {
  const update = useUpdateActorStats()
  const stats = profile.actorStats
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActorStatsInput>({
    // actorStatsSchema combines .default() (equityMember) + .refine(), so its
    // zod input/output types diverge; cast the resolver to the output type.
    resolver: zodResolver(actorStatsSchema) as Resolver<ActorStatsInput>,
    defaultValues: {
      heightCm: stats?.heightCm,
      hairColour: stats?.hairColour ?? '',
      eyeColour: stats?.eyeColour ?? '',
      voiceType: stats?.voiceType ?? '',
      spotlightUrl: stats?.spotlightUrl ?? '',
      equityMember: stats?.equityMember ?? false,
      ageRangeMin: stats?.ageRangeMin,
      ageRangeMax: stats?.ageRangeMax,
    },
  })

  const equity = watch('equityMember')

  const onSubmit = handleSubmit((data) =>
    update.mutate(data, { onSuccess: () => toast.success('Actor stats saved') }),
  )

  return (
    <SectionShell title="Actor stats" description="The casting essentials for actors.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Height (cm)" htmlFor="actorHeightCm" error={errors.heightCm?.message}>
            <Input id="actorHeightCm" type="number" {...register('heightCm', { valueAsNumber: true })} />
          </Field>
          <Field label="Voice type (optional)" htmlFor="voiceType" error={errors.voiceType?.message}>
            <Input id="voiceType" {...register('voiceType')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hair colour" htmlFor="actorHairColour" error={errors.hairColour?.message}>
            <Input id="actorHairColour" {...register('hairColour')} />
          </Field>
          <Field label="Eye colour" htmlFor="actorEyeColour" error={errors.eyeColour?.message}>
            <Input id="actorEyeColour" {...register('eyeColour')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Playable age — min" htmlFor="ageRangeMin" error={errors.ageRangeMin?.message}>
            <Input id="ageRangeMin" type="number" {...register('ageRangeMin', { valueAsNumber: true })} />
          </Field>
          <Field label="Playable age — max" htmlFor="ageRangeMax" error={errors.ageRangeMax?.message}>
            <Input id="ageRangeMax" type="number" {...register('ageRangeMax', { valueAsNumber: true })} />
          </Field>
        </div>
        <Field
          label="Spotlight URL (optional)"
          htmlFor="spotlightUrl"
          error={errors.spotlightUrl?.message}
        >
          <Input id="spotlightUrl" type="url" placeholder="https://" {...register('spotlightUrl')} />
        </Field>
        <div className="flex items-center gap-3">
          <Switch
            checked={equity ?? false}
            onCheckedChange={(checked) =>
              setValue('equityMember', checked, { shouldValidate: true })
            }
            aria-label="Equity member"
          />
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">Equity member</p>
            <p className="text-xs text-muted-foreground">Member of the UK actors’ union.</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <ReReviewNote />
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save actor stats'}
          </Button>
        </div>
      </form>
    </SectionShell>
  )
}

/* -------------------------------- skills --------------------------------- */

const SKILL_TYPES: ReplaceSkillsInput['skills'][number]['skillType'][] = [
  'accent',
  'language',
  'special_skill',
  'training',
]

const SKILL_TYPE_LABEL: Record<string, string> = {
  accent: 'Accent',
  language: 'Language',
  special_skill: 'Special skill',
  training: 'Training',
}

function SkillsSection({ profile }: { profile: MyArtistProfile }) {
  const replace = useReplaceSkills()
  const [skills, setSkills] = useState<ReplaceSkillsInput['skills']>(
    () =>
      (profile.skills ?? []).map((s) => ({
        skillType: s.skillType as ReplaceSkillsInput['skills'][number]['skillType'],
        skillValue: s.skillValue,
      })),
  )
  const [draftType, setDraftType] =
    useState<ReplaceSkillsInput['skills'][number]['skillType']>('special_skill')
  const [draftValue, setDraftValue] = useState('')

  const addSkill = () => {
    const value = draftValue.trim()
    if (!value) return
    if (skills.length >= 50) {
      toast.error('You can list up to 50 skills.')
      return
    }
    setSkills((prev) => [...prev, { skillType: draftType, skillValue: value }])
    setDraftValue('')
  }

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index))
  }

  const save = () => {
    const result = replaceSkillsSchema.safeParse({ skills })
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Invalid skills')
      return
    }
    replace.mutate(result.data, { onSuccess: () => toast.success('Skills saved') })
  }

  return (
    <SectionShell title="Skills" description="Accents, languages, special skills, and training.">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={draftType}
            onValueChange={(v) =>
              setDraftType(v as ReplaceSkillsInput['skills'][number]['skillType'])
            }
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKILL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {SKILL_TYPE_LABEL[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill()
              }
            }}
            placeholder="e.g. RP accent, French, horse riding…"
            maxLength={100}
          />
          <Button type="button" variant="outline" onClick={addSkill} className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" /> Add
          </Button>
        </div>

        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills added yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <li key={`${skill.skillType}-${skill.skillValue}-${i}`}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1.5 text-sm">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {SKILL_TYPE_LABEL[skill.skillType]}
                  </span>
                  <span className="font-medium text-foreground">{skill.skillValue}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(i)}
                    aria-label={`Remove ${skill.skillValue}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <ReReviewNote />
          <Button type="button" onClick={save} disabled={replace.isPending}>
            {replace.isPending ? 'Saving…' : 'Save skills'}
          </Button>
        </div>
      </div>
    </SectionShell>
  )
}

/* ----------------------------- availability ------------------------------ */

function AvailabilitySection({ profile }: { profile: MyArtistProfile }) {
  return (
    <SectionShell
      title="Availability"
      description="Casters only find available artists in talent search."
    >
      <AvailabilityToggle status={profile.availabilityStatus} />
    </SectionShell>
  )
}

/* ------------------------------- portfolio ------------------------------- */

function PortfolioSection({ profile }: { profile: MyArtistProfile }) {
  const items = profile.portfolioItems ?? []
  const upload = useUploadFile()
  const remove = useDeletePortfolioItem()
  const setPrimary = useSetPrimaryPortfolioItem()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [caption, setCaption] = useState('')

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setProgress(0)
    upload.mutate(
      {
        file,
        type: 'portfolio_photo',
        caption: caption.trim() || undefined,
        isPrimary: items.length === 0,
        onProgress: (p) => setProgress(p),
      },
      {
        onSuccess: () => {
          toast.success('Photo uploaded')
          setCaption('')
        },
        onSettled: () => {
          setProgress(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
      },
    )
  }

  return (
    <SectionShell
      title="Portfolio"
      description="Upload your strongest shots. Set one as the primary image casters see first."
    >
      <div className="space-y-5">
        <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <Field label="Caption (optional)" htmlFor="portfolioCaption">
            <Input
              id="portfolioCaption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Editorial — London, 2026"
              maxLength={120}
            />
          </Field>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {upload.isPending ? 'Uploading…' : 'Upload photo'}
          </Button>
          {progress !== null ? (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}% uploaded</p>
            </div>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No portfolio items yet"
            description="Add at least one photo — you need one to submit a bid."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {items.map((item) => {
              const busy =
                (setPrimary.isPending && setPrimary.variables === item.id) ||
                (remove.isPending && remove.variables === item.id)
              return (
                <div
                  key={item.id}
                  className="space-y-2 rounded-xl border border-border bg-card p-2"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
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
                        sizes="200px"
                        className="object-cover"
                      />
                    )}
                    {item.isPrimary ? (
                      <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        <Star className="h-2.5 w-2.5 fill-current" /> Primary
                      </span>
                    ) : null}
                  </div>
                  {item.caption ? (
                    <p className="truncate px-1 text-xs text-muted-foreground">{item.caption}</p>
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    {!item.isPrimary ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={busy}
                        onClick={() =>
                          setPrimary.mutate(item.id, {
                            onSuccess: () => toast.success('Primary photo updated'),
                          })
                        }
                      >
                        <Star className="mr-1 h-3.5 w-3.5" /> Set primary
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="flex-1 justify-center font-normal">
                        Primary
                      </Badge>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busy}
                      aria-label="Remove portfolio item"
                      onClick={() =>
                        remove.mutate(item.id, {
                          onSuccess: () => toast.success('Photo removed'),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </SectionShell>
  )
}

/* ------------------------------ artist type ------------------------------ */

function ArtistTypeSection({ profile }: { profile: MyArtistProfile }) {
  const update = useUpdateArtistType()
  const locked = Boolean(profile.submittedAt) || profile.approvalStatus === 'approved'
  const other = profile.artistType === 'model' ? 'actor' : 'model'

  return (
    <SectionShell
      title="Artist type"
      description="Switch between a model and an actor profile."
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current type:</span>
          <Badge variant="secondary" className="capitalize">
            {profile.artistType}
          </Badge>
        </div>

        {locked ? (
          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Locked after submission — your artist type can’t be changed once your profile has been submitted for review.</p>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <ReReviewNote />
            <Button
              type="button"
              variant="outline"
              disabled={update.isPending}
              onClick={() =>
                update.mutate(
                  { artistType: other },
                  { onSuccess: () => toast.success(`Switched to ${other} profile`) },
                )
              }
            >
              Switch to {other} profile
            </Button>
          </div>
        )}
      </div>
    </SectionShell>
  )
}
