'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, TriangleAlert } from 'lucide-react'
import { updateJobSchema, type UpdateJobInput } from '@castflow/validators'
import type { Job } from '@castflow/types'
import { ApiError } from '@/lib/fetcher'
import { PageHeader, LoadingState, ErrorState } from '@/components/dashboard'
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
import { useJob, useUpdateJob } from '@/lib/hooks/use-jobs'

/** datetime-local → ISO-8601 (zod .datetime() requires the full ISO string). */
function toIso(local: string): string {
  if (!local) return ''
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

/** ISO-8601 → datetime-local (YYYY-MM-DDTHH:mm) in the browser's local zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditJobClient({ jobId }: { jobId: string }) {
  const { data: job, isPending, isError, error, refetch } = useJob(jobId)

  if (isPending) return <LoadingState variant="detail" />

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0
    if (status === 404 || status === 410) {
      return (
        <div className="space-y-4">
          <BackLink jobId={jobId} />
          <ErrorState
            title="This job is no longer available"
            message="It may have been removed or no longer exists."
          />
        </div>
      )
    }
    return <ErrorState onRetry={() => void refetch()} />
  }

  return <EditJobForm jobId={jobId} job={job} />
}

function EditJobForm({ jobId, job }: { jobId: string; job: Job }) {
  const router = useRouter()
  const update = useUpdateJob(jobId)

  const [shootLocal, setShootLocal] = useState(toLocalInput(job.shootDate))
  const [deadlineLocal, setDeadlineLocal] = useState(toLocalInput(job.applicationDeadline))
  const [skillsText, setSkillsText] = useState(job.skillsRequired.join(', '))

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateJobInput>({
    resolver: zodResolver(updateJobSchema) as Resolver<UpdateJobInput>,
    defaultValues: {
      title: job.title,
      description: job.description,
      subcategory: job.subcategory ?? undefined,
      genderRequired: job.genderRequired as UpdateJobInput['genderRequired'],
      ageMin: job.ageMin ?? undefined,
      ageMax: job.ageMax ?? undefined,
      locationCity: job.locationCity,
      skillsRequired: job.skillsRequired,
      shootDate: job.shootDate,
      shootDurationHours: job.shootDurationHours,
      rateAmount: job.rateAmount ?? undefined,
      requiresNda: job.requiresNda,
      exclusivity: job.exclusivity,
      usageRights: job.usageRights,
      headcountRequired: job.headcountRequired,
      applicationDeadline: job.applicationDeadline,
    },
  })

  // Keep RHF in sync with the datetime-local pickers (registered fields hold ISO).
  useEffect(() => {
    setValue('shootDate', toIso(shootLocal) || undefined, { shouldValidate: true })
  }, [shootLocal, setValue])
  useEffect(() => {
    setValue('applicationDeadline', toIso(deadlineLocal) || undefined, { shouldValidate: true })
  }, [deadlineLocal, setValue])

  const values = watch()
  const openRate = job.rateSetBy === 'open'

  const onSubmit = handleSubmit((data) => {
    update.mutate(data, { onSuccess: () => router.push(`/caster/jobs/${jobId}`) })
  })

  return (
    <div className="space-y-6">
      <BackLink jobId={jobId} />

      <PageHeader title="Edit job" description={job.title} />

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        Changing the shoot date, rate, location, or deadline notifies all existing bidders and lets
        them withdraw.
      </div>

      <form onSubmit={onSubmit}>
        <Card className="space-y-5 p-6">
          {/* Read-only context */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnly label="Payment type" value={titleCase(job.paymentType)} />
            <ReadOnly label="Category" value={titleCase(job.category)} />
          </div>

          <Field label="Job title" htmlFor="title" error={errors.title?.message}>
            <Input id="title" {...register('title')} />
          </Field>

          <Field label="Subcategory (optional)" htmlFor="subcategory" error={errors.subcategory?.message}>
            <Input id="subcategory" {...register('subcategory')} />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" rows={6} {...register('description')} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gender required" error={errors.genderRequired?.message}>
              <Select
                value={values.genderRequired}
                onValueChange={(v) =>
                  setValue('genderRequired', v as UpdateJobInput['genderRequired'], {
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
              <Input id="locationCity" {...register('locationCity')} />
            </Field>
            <Field label="Age min" htmlFor="ageMin" error={errors.ageMin?.message}>
              <Input id="ageMin" type="number" {...register('ageMin', { valueAsNumber: true })} />
            </Field>
            <Field label="Age max" htmlFor="ageMax" error={errors.ageMax?.message}>
              <Input id="ageMax" type="number" {...register('ageMax', { valueAsNumber: true })} />
            </Field>
          </div>

          <Field
            label="Skills required (comma-separated)"
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
                    .filter(Boolean),
                )
              }}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shoot date & time" error={errors.shootDate?.message}>
              <Input
                type="datetime-local"
                value={shootLocal}
                onChange={(e) => setShootLocal(e.target.value)}
              />
            </Field>
            <Field label="Application deadline" error={errors.applicationDeadline?.message}>
              <Input
                type="datetime-local"
                value={deadlineLocal}
                onChange={(e) => setDeadlineLocal(e.target.value)}
              />
            </Field>
            <Field label="Duration (hours)" htmlFor="dur" error={errors.shootDurationHours?.message}>
              <Input
                id="dur"
                type="number"
                step="0.5"
                {...register('shootDurationHours', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Artists needed" htmlFor="headcount" error={errors.headcountRequired?.message}>
              <Input
                id="headcount"
                type="number"
                {...register('headcountRequired', { valueAsNumber: true })}
              />
            </Field>
          </div>

          {openRate ? (
            <p className="text-sm text-muted-foreground">
              This job is open to bids — artists propose their own rate, so there’s no fixed rate to
              edit.
            </p>
          ) : (
            <Field
              label={job.paymentType === 'hourly' ? 'Hourly rate (£)' : 'Flat fee (£)'}
              htmlFor="rateAmount"
              error={errors.rateAmount?.message}
            >
              <Input
                id="rateAmount"
                type="number"
                step="0.01"
                {...register('rateAmount', { valueAsNumber: true })}
              />
            </Field>
          )}

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
            <Textarea id="usageRights" rows={3} {...register('usageRights')} />
          </Field>
        </Card>

        <div className="mt-4 flex items-center justify-between">
          <Button asChild type="button" variant="ghost">
            <Link href={`/caster/jobs/${jobId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function BackLink({ jobId }: { jobId: string }) {
  return (
    <Link
      href={`/caster/jobs/${jobId}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to job
    </Link>
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

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Can’t be changed after posting.</p>
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

function titleCase(s: string): string {
  return s.replace(/(^|_)([a-z])/g, (_, _sep: string, c: string) => ` ${c.toUpperCase()}`).trim()
}
