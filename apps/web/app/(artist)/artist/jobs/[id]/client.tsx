'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useJob } from '@/lib/hooks/use-jobs'
import { formatCurrency, formatDate } from '@/lib/utils'

export function JobDetailClient({ id }: { id: string }) {
  const job = useJob(id)

  if (job.isPending) return <LoadingState rows={6} />
  if (job.isError || !job.data) return <ErrorState onRetry={() => job.refetch()} />
  const j = job.data

  const rateLabel =
    j.rateSetBy === 'open'
      ? 'Open to bids'
      : j.rateAmount != null
        ? `${formatCurrency(j.rateAmount)}${j.paymentType === 'hourly' ? '/hr' : ''}`
        : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title={j.title}
        description={`${j.category} · ${j.locationCity}`}
        actions={
          j.status === 'active' ? (
            <Button asChild>
              <Link href={`/artist/jobs/${j.id}/bid`}>Submit bid</Link>
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{j.description}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Gender" value={j.genderRequired} />
              <Field
                label="Age range"
                value={j.ageMin && j.ageMax ? `${j.ageMin}–${j.ageMax}` : 'Any'}
              />
              <Field label="Headcount" value={`${j.headcountFilled}/${j.headcountRequired}`} />
              <Field label="Skills" value={j.skillsRequired?.join(', ') || '—'} />
              <Field label="NDA required" value={j.requiresNda ? 'Yes' : 'No'} />
              <Field label="Exclusivity" value={j.exclusivity ? 'Yes' : 'No'} />
              <Field label="Usage rights" value={j.usageRights || '—'} className="col-span-2" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">At a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={j.status} />
              </div>
              <Separator />
              <Field label="Payment" value={`${j.paymentType} · ${rateLabel}`} inline />
              <Field label="Shoot date" value={formatDate(j.shootDate)} inline />
              <Field label="Duration" value={`${j.shootDurationHours}h`} inline />
              <Field label="Applications close" value={formatDate(j.applicationDeadline)} inline />
              <Field label="Visibility" value={j.visibility} inline />
            </CardContent>
          </Card>

          {j.shootLocationDetail ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shoot location</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{j.shootLocationDetail}</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-muted-foreground pt-6 text-xs">
                Exact location is revealed after the contract is fully signed.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  inline,
  className,
}: {
  label: string
  value: string
  inline?: boolean
  className?: string
}) {
  if (inline) {
    return (
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-right capitalize">{value}</span>
      </div>
    )
  }
  return (
    <div className={className}>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="capitalize">{value}</div>
    </div>
  )
}
