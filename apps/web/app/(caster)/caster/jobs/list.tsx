'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/dashboard'
import { useMyJobs } from '@/lib/hooks/use-jobs'
import { formatDate } from '@/lib/utils'

export function CasterJobsList() {
  const jobs = useMyJobs({ limit: 100 })
  if (jobs.isPending) return <LoadingState rows={5} />
  if (jobs.isError) return <ErrorState onRetry={() => jobs.refetch()} />
  if (!jobs.data?.length)
    return (
      <EmptyState
        title="No jobs posted yet"
        description="Post your first job to begin."
        action={
          <Button asChild>
            <Link href="/caster/jobs/new">Post a job</Link>
          </Button>
        }
      />
    )
  return (
    <ul className="space-y-3">
      {jobs.data.map((j) => (
        <li key={j.id}>
          <Link href={`/caster/jobs/${j.id}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="flex items-center justify-between gap-3 pt-6 text-sm">
                <div className="space-y-1">
                  <div className="font-medium">{j.title}</div>
                  <div className="text-muted-foreground text-xs">
                    Shoot {formatDate(j.shootDate)} · {j.locationCity} · {j.headcountFilled}/
                    {j.headcountRequired} filled
                  </div>
                </div>
                <StatusBadge status={j.status} />
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}
