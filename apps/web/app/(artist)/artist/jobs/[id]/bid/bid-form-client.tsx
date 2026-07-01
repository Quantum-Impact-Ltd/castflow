'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ChevronLeft, Check } from 'lucide-react'
import { submitBidSchema, type SubmitBidInput } from '@castflow/validators'
import type { PortfolioItem } from '@castflow/types'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/dashboard'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useJob } from '@/lib/hooks/use-jobs'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { useSubmitBid } from '@/lib/hooks/use-bids'
import { cn, formatDate } from '@/lib/utils'
import { numberOrUndefined } from '@/lib/forms'

const MAX_HIGHLIGHTS = 5

const ENTRY_TYPE_LABEL: Record<string, string> = {
  shoot: 'Shoot',
  film: 'Film',
  editorial: 'Editorial',
  campaign: 'Campaign',
  runway: 'Runway',
  commercial: 'Commercial',
  other: 'Other',
}

export function BidFormClient({ jobId }: { jobId: string }) {
  const router = useRouter()
  const job = useJob(jobId)
  const profile = useMyArtistProfile()
  const submit = useSubmitBid(jobId)
  const [confirmedAvailable, setConfirmedAvailable] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    watch,
    formState: { errors },
  } = useForm<SubmitBidInput>({
    resolver: zodResolver(submitBidSchema),
    defaultValues: { coverNote: '', highlightedPortfolioItems: [] },
  })

  const selected = watch('highlightedPortfolioItems') ?? []
  const coverNote = watch('coverNote') ?? ''

  // Pre-fill the rate + hours once the job loads. CRITICAL: rateAmount and
  // shootDurationHours arrive as Prisma Decimal → JSON *strings*, and zodResolver's
  // `z.number()` rejects a string — which silently fails handleSubmit's validation
  // so "Submit bid" appeared to do nothing on prefilled (caster-set) jobs. Coerce
  // to Number here, and only seed empty fields so we never clobber user edits.
  const jobData = job.data
  useEffect(() => {
    if (!jobData) return
    const rateByCaster = jobData.rateSetBy === 'caster'
    const hourly = jobData.paymentType === 'hourly'
    if (rateByCaster && jobData.rateAmount !== null && getValues('proposedRate') === undefined) {
      setValue('proposedRate', Number(jobData.rateAmount), { shouldValidate: true })
    }
    if (hourly && getValues('estimatedHours') === undefined) {
      setValue('estimatedHours', Number(jobData.shootDurationHours), { shouldValidate: true })
    }
  }, [jobData, getValues, setValue])

  if (job.isPending || profile.isPending) return <LoadingState variant="detail" />
  if (job.isError || !job.data) return <ErrorState onRetry={() => void job.refetch()} />
  if (profile.isError || !profile.data) return <ErrorState onRetry={() => void profile.refetch()} />

  const j = job.data
  const isRateSetByCaster = j.rateSetBy === 'caster'
  const isHourly = j.paymentType === 'hourly'
  // For hourly + caster-set, both the rate AND the hours are the caster's to set —
  // the artist shouldn't invent hours when the job already states its duration.
  const hoursLocked = isHourly && isRateSetByCaster
  const portfolio = profile.data.portfolioItems ?? []

  function toggleHighlight(id: string) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : selected.length < MAX_HIGHLIGHTS
        ? [...selected, id]
        : selected
    setValue('highlightedPortfolioItems', next, { shouldValidate: true })
  }

  const onSubmit = handleSubmit(
    (data) => {
      if (!confirmedAvailable) {
        setAvailabilityError(true)
        toast.error('Please confirm your availability before submitting.')
        return
      }
      // Only send hours for hourly jobs, and guard against a non-finite value.
      const estimatedHours =
        isHourly && Number.isFinite(data.estimatedHours) ? data.estimatedHours : undefined
      if (isHourly && estimatedHours === undefined) {
        setError('estimatedHours', {
          type: 'manual',
          message: 'Estimated hours are required for hourly jobs',
        })
        return
      }
      const payload: SubmitBidInput = { ...data, estimatedHours }
      submit.mutate(payload, { onSuccess: () => router.push('/artist/bids') })
    },
    // onInvalid — guarantees the click is never a silent no-op. Surfaces the
    // availability error too (it lives outside the zod form) and points the
    // artist at the highlighted fields.
    () => {
      if (!confirmedAvailable) setAvailabilityError(true)
      toast.error('Please fix the highlighted fields before submitting.')
    }
  )

  if (portfolio.length === 0) {
    return (
      <div className="space-y-4">
        <BackLink jobId={jobId} />
        <EmptyState
          title="Add portfolio items first"
          description="You must highlight at least one portfolio item with your bid. Add some to your profile, then come back."
          action={
            <Button asChild size="sm">
              <Link href="/artist/profile/edit">Manage portfolio</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink jobId={jobId} />
      <PageHeader title="Submit a bid" description={j.title} />

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="space-y-5 p-6">
          {/* Rate */}
          <div className="space-y-1.5">
            <Label htmlFor="proposedRate">
              {isRateSetByCaster
                ? `Fixed ${isHourly ? 'hourly rate' : 'fee'} set by the caster`
                : isHourly
                  ? 'Your proposed hourly rate (£)'
                  : 'Your proposed fee (£)'}
            </Label>
            <Input
              id="proposedRate"
              type="number"
              step="0.01"
              inputMode="decimal"
              readOnly={isRateSetByCaster}
              className={cn(isRateSetByCaster && 'bg-muted')}
              {...register('proposedRate', { setValueAs: numberOrUndefined })}
            />
            {isRateSetByCaster ? (
              <p className="text-xs text-muted-foreground">
                This rate is set by the caster and can’t be changed.
              </p>
            ) : null}
            {errors.proposedRate ? (
              <p className="text-xs text-destructive">{errors.proposedRate.message}</p>
            ) : null}
          </div>

          {/* Estimated hours (hourly only) */}
          {isHourly ? (
            <div className="space-y-1.5">
              <Label htmlFor="estimatedHours">Estimated hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                inputMode="decimal"
                readOnly={hoursLocked}
                className={cn(hoursLocked && 'bg-muted')}
                {...register('estimatedHours', { setValueAs: numberOrUndefined })}
              />
              <p className="text-xs text-muted-foreground">
                {hoursLocked
                  ? `Set by the caster’s ${j.shootDurationHours}-hour shoot. Total = rate × hours.`
                  : `Pre-filled from the ${j.shootDurationHours}-hour shoot duration — adjust if your estimate differs. Total = rate × hours.`}
              </p>
              {errors.estimatedHours ? (
                <p className="text-xs text-destructive">{errors.estimatedHours.message}</p>
              ) : null}
            </div>
          ) : null}

          {/* Cover note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="coverNote">Cover note</Label>
              <span className="text-xs text-muted-foreground">{coverNote.length}/500</span>
            </div>
            <Textarea
              id="coverNote"
              rows={5}
              maxLength={500}
              placeholder="Tell the caster why you’re right for this job."
              {...register('coverNote')}
            />
            {errors.coverNote ? (
              <p className="text-xs text-destructive">{errors.coverNote.message}</p>
            ) : null}
          </div>
        </Card>

        {/* Portfolio highlights */}
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Highlight portfolio items</Label>
              <p className="text-xs text-muted-foreground">
                Choose up to {MAX_HIGHLIGHTS} to show with this bid.
              </p>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {selected.length}/{MAX_HIGHLIGHTS}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {portfolio.map((item: PortfolioItem) => {
              const isSelected = selected.includes(item.id)
              const atLimit = !isSelected && selected.length >= MAX_HIGHLIGHTS
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleHighlight(item.id)}
                  disabled={atLimit}
                  className={cn(
                    'group relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-colors',
                    isSelected ? 'border-primary' : 'border-transparent hover:border-border',
                    atLimit && 'cursor-not-allowed opacity-40'
                  )}
                >
                  <RemoteImage
                    src={item.url}
                    alt={item.title ?? item.caption ?? 'Portfolio item'}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  {item.title || item.entryType ? (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4 text-left">
                      {item.title ? (
                        <span className="block truncate text-[10px] font-medium text-white">
                          {item.title}
                        </span>
                      ) : null}
                      {item.entryType ? (
                        <span className="block text-[9px] uppercase tracking-wide text-white/70">
                          {ENTRY_TYPE_LABEL[item.entryType] ?? item.entryType}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          {errors.highlightedPortfolioItems ? (
            <p className="text-xs text-destructive">{errors.highlightedPortfolioItems.message}</p>
          ) : null}
        </Card>

        {/* Availability confirmation — prevents accepting a bid only to find the
            artist isn't free, which would force a cancellation after booking. */}
        <Card className="space-y-2 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmedAvailable}
              onChange={(e) => {
                setConfirmedAvailable(e.target.checked)
                if (e.target.checked) setAvailabilityError(false)
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">
              I confirm I’m available for the shoot on{' '}
              <span className="font-medium">{formatDate(j.shootDate)}</span>.
            </span>
          </label>
          {availabilityError ? (
            <p className="pl-7 text-xs text-destructive">
              Please confirm your availability before submitting.
            </p>
          ) : null}
        </Card>

        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            One bid per job — you can edit it while it’s still pending.
          </p>
          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending ? 'Submitting…' : 'Submit bid'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function BackLink({ jobId }: { jobId: string }) {
  return (
    <Link
      href={`/artist/jobs/${jobId}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to job
    </Link>
  )
}
