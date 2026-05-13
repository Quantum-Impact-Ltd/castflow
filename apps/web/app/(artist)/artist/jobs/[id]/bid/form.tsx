'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitBidSchema, type SubmitBidInput } from '@castflow/validators'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useJob } from '@/lib/hooks/use-jobs'
import { useSubmitBid } from '@/lib/hooks/use-bids'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { formatCurrency } from '@/lib/utils'

export function BidForm({ jobId }: { jobId: string }) {
  const router = useRouter()
  const job = useJob(jobId)
  const profile = useMyArtistProfile()
  const submit = useSubmitBid(jobId)

  const form = useForm<SubmitBidInput>({
    resolver: zodResolver(submitBidSchema),
    defaultValues: {
      proposedRate: 0,
      coverNote: '',
      highlightedPortfolioItems: [],
    },
  })

  useEffect(() => {
    if (job.data && job.data.rateSetBy === 'caster' && job.data.rateAmount) {
      form.setValue('proposedRate', job.data.rateAmount)
    }
  }, [job.data, form])

  if (job.isPending || profile.isPending) return <LoadingState rows={5} />
  if (job.isError || !job.data) return <ErrorState onRetry={() => job.refetch()} />

  const j = job.data
  const isHourly = j.paymentType === 'hourly'
  const rateLocked = j.rateSetBy === 'caster'
  const portfolio = (profile.data?.portfolioItems ?? []) as Array<{
    id: string
    url: string
    caption: string | null
    isApproved?: boolean
  }>

  const selected = form.watch('highlightedPortfolioItems') ?? []

  function togglePortfolio(id: string) {
    const current = form.getValues('highlightedPortfolioItems') ?? []
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : current.length < 5
        ? [...current, id]
        : current
    form.setValue('highlightedPortfolioItems', next, { shouldValidate: true })
  }

  async function onSubmit(values: SubmitBidInput) {
    await submit.mutateAsync(values)
    router.push('/artist/bids')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Submit bid" description={j.title} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="proposedRate">
                {isHourly ? 'Hourly rate (£)' : 'Flat fee (£)'}
                {rateLocked ? ' — set by caster' : ''}
              </Label>
              <Input
                id="proposedRate"
                type="number"
                step="0.01"
                disabled={rateLocked}
                {...form.register('proposedRate', { valueAsNumber: true })}
              />
              {form.formState.errors.proposedRate ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.proposedRate.message}
                </p>
              ) : null}
            </div>

            {isHourly ? (
              <div className="space-y-1.5">
                <Label htmlFor="estimatedHours">Estimated hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  {...form.register('estimatedHours', { valueAsNumber: true })}
                />
                <p className="text-muted-foreground text-xs">
                  Total estimate:{' '}
                  {formatCurrency(
                    (form.watch('proposedRate') || 0) * (form.watch('estimatedHours') || 0)
                  )}
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="coverNote">Cover note</Label>
              <Textarea
                id="coverNote"
                rows={6}
                placeholder="Tell the caster why you're right for this job."
                {...form.register('coverNote')}
              />
              {form.formState.errors.coverNote ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.coverNote.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Highlight up to 5 portfolio items</Label>
              {portfolio.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Add items to your portfolio to highlight them with this bid.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {portfolio.map((p) => {
                    const isSelected = selected.includes(p.id)
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => togglePortfolio(p.id)}
                        className={`group border-border relative aspect-square overflow-hidden rounded-md border ${
                          isSelected ? 'ring-primary ring-2' : ''
                        }`}
                      >
                        <img src={p.url} alt={p.caption ?? ''} className="size-full object-cover" />
                      </button>
                    )
                  })}
                </div>
              )}
              {form.formState.errors.highlightedPortfolioItems ? (
                <p className="text-destructive text-xs">Select 1–5 portfolio items.</p>
              ) : null}
            </div>

            <Button type="submit" disabled={submit.isPending} className="w-full">
              {submit.isPending ? 'Submitting…' : 'Submit bid'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
