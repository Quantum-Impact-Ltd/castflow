'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react'
import { createJobSchema, type CreateJobInput } from '@castflow/validators'
import { PageHeader } from '@/components/dashboard'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateJob } from '@/lib/hooks/use-jobs'
import { useUploadJobCover } from '@/lib/hooks/use-uploads'
import { formatCurrency, cn } from '@/lib/utils'
import { numberOrUndefined } from '@/lib/forms'

const STEPS = ['Basics', 'Requirements', 'Shoot', 'Legal', 'Visibility', 'Review'] as const

const STEP_FIELDS: Path<CreateJobInput>[][] = [
  ['title', 'category', 'subcategory', 'description'],
  ['genderRequired', 'ageMin', 'ageMax', 'locationCity', 'skillsRequired'],
  [
    'shootDate',
    'shootDurationHours',
    'paymentType',
    'rateSetBy',
    'rateAmount',
    'headcountRequired',
    'applicationDeadline',
  ],
  ['requiresNda', 'exclusivity', 'usageRights'],
  ['visibility'],
  [],
]

/** datetime-local → ISO-8601 (zod .datetime() requires the full ISO string). */
function toIso(local: string): string {
  if (!local) return ''
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

export function JobWizard() {
  const router = useRouter()
  const create = useCreateJob()
  const [step, setStep] = useState(0)
  const [shootLocal, setShootLocal] = useState('')
  const [deadlineLocal, setDeadlineLocal] = useState('')
  const [skillsText, setSkillsText] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema) as Resolver<CreateJobInput>,
    defaultValues: {
      visibility: 'public',
      skillsRequired: [],
      requiresNda: false,
      exclusivity: false,
      headcountRequired: 1,
      paymentType: 'fixed',
      rateSetBy: 'caster',
    },
  })

  const values = watch()

  async function next() {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const onSubmit = handleSubmit((data) => {
    create.mutate(data, { onSuccess: (job) => router.push(`/caster/jobs/${job.id}`) })
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Post a job" description="Takes about five minutes." />

      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1',
                i === step
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                    ? 'text-primary hover:underline'
                    : 'text-muted-foreground'
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 ? (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            ) : null}
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit}>
        <Card className="space-y-5 p-6">
          {/* Step 1 — Basics */}
          {step === 0 ? (
            <>
              <Field label="Job title" htmlFor="title" error={errors.title?.message}>
                <Input
                  id="title"
                  placeholder="Female model for summer campaign"
                  {...register('title')}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" error={errors.category?.message}>
                  <Select
                    value={values.category}
                    onValueChange={(v) =>
                      setValue('category', v as CreateJobInput['category'], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="model">Model</SelectItem>
                      <SelectItem value="actor">Actor</SelectItem>
                      <SelectItem value="voiceover">Voiceover</SelectItem>
                      <SelectItem value="extra">Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="Subcategory (optional)"
                  htmlFor="subcategory"
                  error={errors.subcategory?.message}
                >
                  <Input
                    id="subcategory"
                    placeholder="Fashion, Commercial, Editorial…"
                    {...register('subcategory')}
                  />
                </Field>
              </div>
              <Field label="Description" htmlFor="description" error={errors.description?.message}>
                <Textarea
                  id="description"
                  rows={6}
                  placeholder="Brand context, mood, references, what the day looks like…"
                  {...register('description')}
                />
              </Field>
              <CoverField
                value={values.coverImageUrl}
                onChange={(url) =>
                  setValue('coverImageUrl', url, { shouldValidate: false, shouldDirty: true })
                }
              />
            </>
          ) : null}

          {/* Step 2 — Requirements */}
          {step === 1 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gender required" error={errors.genderRequired?.message}>
                  <Select
                    value={values.genderRequired}
                    onValueChange={(v) =>
                      setValue('genderRequired', v as CreateJobInput['genderRequired'], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="non_binary">Non-binary</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="City" htmlFor="locationCity" error={errors.locationCity?.message}>
                  <Input id="locationCity" placeholder="London" {...register('locationCity')} />
                </Field>
                <Field label="Age min" htmlFor="ageMin" error={errors.ageMin?.message}>
                  <Input
                    id="ageMin"
                    type="number"
                    {...register('ageMin', { setValueAs: numberOrUndefined })}
                  />
                </Field>
                <Field label="Age max" htmlFor="ageMax" error={errors.ageMax?.message}>
                  <Input
                    id="ageMax"
                    type="number"
                    {...register('ageMax', { setValueAs: numberOrUndefined })}
                  />
                </Field>
              </div>
              <Field
                label="Skills required (optional, comma-separated)"
                htmlFor="skills"
                error={errors.skillsRequired?.message}
              >
                <Input
                  id="skills"
                  placeholder="e.g. RP accent, horse riding, French"
                  value={skillsText}
                  onChange={(e) => {
                    setSkillsText(e.target.value)
                    setValue(
                      'skillsRequired',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }}
                />
              </Field>
            </>
          ) : null}

          {/* Step 3 — Shoot */}
          {step === 2 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Shoot date & time" error={errors.shootDate?.message}>
                  <Input
                    type="datetime-local"
                    value={shootLocal}
                    onChange={(e) => {
                      setShootLocal(e.target.value)
                      setValue('shootDate', toIso(e.target.value), { shouldValidate: true })
                    }}
                  />
                </Field>
                <Field label="Application deadline" error={errors.applicationDeadline?.message}>
                  <Input
                    type="datetime-local"
                    value={deadlineLocal}
                    onChange={(e) => {
                      setDeadlineLocal(e.target.value)
                      setValue('applicationDeadline', toIso(e.target.value), {
                        shouldValidate: true,
                      })
                    }}
                  />
                </Field>
                <Field
                  label="Duration (hours)"
                  htmlFor="dur"
                  error={errors.shootDurationHours?.message}
                >
                  <Input
                    id="dur"
                    type="number"
                    step="0.5"
                    {...register('shootDurationHours', { setValueAs: numberOrUndefined })}
                  />
                </Field>
                <Field
                  label="Artists needed"
                  htmlFor="headcount"
                  error={errors.headcountRequired?.message}
                >
                  <Input
                    id="headcount"
                    type="number"
                    {...register('headcountRequired', { setValueAs: numberOrUndefined })}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Payment type" error={errors.paymentType?.message}>
                  <Select
                    value={values.paymentType}
                    onValueChange={(v) =>
                      setValue('paymentType', v as CreateJobInput['paymentType'], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed (flat fee)</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Rate" error={errors.rateSetBy?.message}>
                  <Select
                    value={values.rateSetBy}
                    onValueChange={(v) => {
                      const nextRateSetBy = v as CreateJobInput['rateSetBy']
                      setValue('rateSetBy', nextRateSetBy, { shouldValidate: true })
                      // Rate amount is hidden + irrelevant when open to bids.
                      // Clear it (and any error) so a lingering value can't
                      // silently fail step validation and block Next.
                      if (nextRateSetBy === 'open') {
                        setValue('rateAmount', undefined, { shouldValidate: false })
                        clearErrors('rateAmount')
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caster">I set the rate</SelectItem>
                      <SelectItem value="open">Open to bids</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {values.rateSetBy === 'caster' ? (
                <Field
                  label={values.paymentType === 'hourly' ? 'Hourly rate (£)' : 'Flat fee (£)'}
                  htmlFor="rateAmount"
                  error={errors.rateAmount?.message}
                >
                  <Input
                    id="rateAmount"
                    type="number"
                    step="0.01"
                    {...register('rateAmount', { setValueAs: numberOrUndefined })}
                  />
                </Field>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Artists will propose their own rate in their bid.
                </p>
              )}
            </>
          ) : null}

          {/* Step 4 — Legal */}
          {step === 3 ? (
            <>
              <ToggleRow
                label="NDA required"
                hint="Artists agree to a non-disclosure clause in the contract."
                checked={values.requiresNda ?? false}
                onChange={(v) => setValue('requiresNda', v)}
              />
              <ToggleRow
                label="Exclusivity clause"
                hint="e.g. can’t work with direct competitors for a period."
                checked={values.exclusivity ?? false}
                onChange={(v) => setValue('exclusivity', v)}
              />
              <Field label="Usage rights" htmlFor="usageRights" error={errors.usageRights?.message}>
                <Textarea
                  id="usageRights"
                  rows={3}
                  placeholder="e.g. UK digital + social, 12 months"
                  {...register('usageRights')}
                />
              </Field>
            </>
          ) : null}

          {/* Step 5 — Visibility */}
          {step === 4 ? (
            <div className="space-y-3">
              {(['public', 'invite_only'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setValue('visibility', v)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                    values.visibility === v
                      ? 'border-primary bg-accent/30'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border',
                      values.visibility === v
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}
                  >
                    {values.visibility === v ? (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    ) : null}
                  </span>
                  <span>
                    <span className="block font-medium text-foreground">
                      {v === 'public' ? 'Public' : 'Invite only'}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {v === 'public'
                        ? 'Anyone who matches can see and bid. Matching artists are notified.'
                        : 'Hidden from the feed — you invite specific artists from talent search.'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {/* Step 6 — Review */}
          {step === 5 ? (
            <dl className="space-y-3 text-sm">
              <Review label="Title" value={values.title} />
              <Review
                label="Category"
                value={`${values.category}${values.subcategory ? ` · ${values.subcategory}` : ''}`}
              />
              <Review
                label="Gender / age"
                value={`${values.genderRequired} · ${values.ageMin ?? 'any'}–${values.ageMax ?? 'any'}`}
              />
              <Review label="City" value={values.locationCity} />
              <Review
                label="Shoot"
                value={`${shootLocal || '—'} · ${values.shootDurationHours ?? '—'}h`}
              />
              <Review
                label="Rate"
                value={
                  values.rateSetBy === 'open'
                    ? 'Open to bids'
                    : `${formatCurrency(values.rateAmount)}${values.paymentType === 'hourly' ? '/hr' : ' flat'}`
                }
              />
              <Review label="Headcount" value={String(values.headcountRequired ?? 1)} />
              <Review
                label="Legal"
                value={`NDA: ${values.requiresNda ? 'Yes' : 'No'} · Exclusivity: ${values.exclusivity ? 'Yes' : 'No'}`}
              />
              <Review
                label="Visibility"
                value={values.visibility === 'public' ? 'Public' : 'Invite only'}
              />
            </dl>
          ) : null}
        </Card>

        {/* Nav */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Next <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Posting…' : 'Post job'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

function CoverField({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (url: string | undefined) => void
}) {
  const upload = useUploadJobCover()

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    const res = await upload.mutateAsync({ file }).catch(() => null)
    if (res) onChange(res.publicUrl)
  }

  return (
    <Field label="Cover image (optional)">
      {value ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="relative aspect-[16/9] w-full bg-[var(--surface-50)]">
            <RemoteImage
              src={value}
              alt="Job cover"
              fill
              sizes="(min-width: 640px) 600px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <p className="text-xs text-muted-foreground">
              Shown as the hero on your public shoot page.
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-[var(--surface-50)] px-6 py-10 text-center transition-colors hover:border-primary/40">
          <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium text-foreground">
            {upload.isPending ? 'Uploading…' : 'Upload a cover image'}
          </span>
          <span className="text-xs text-muted-foreground">JPG, PNG or WebP · up to 10 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onPick}
            disabled={upload.isPending}
          />
        </label>
      )}
    </Field>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

function Review({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value || '—'}</dd>
    </div>
  )
}
