'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/dashboard'
import { useMyJobs } from '@/lib/hooks/use-jobs'
import { formatDate } from '@/lib/utils'

export function CasterDashboardClient() {
  const jobs = useMyJobs({ limit: 5 })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent jobs</CardTitle>
      </CardHeader>
      <CardContent>
        {jobs.isPending ? (
          <LoadingState rows={3} />
        ) : jobs.isError ? (
          <ErrorState onRetry={() => jobs.refetch()} />
        ) : !jobs.data?.length ? (
          <EmptyState
            title="No jobs yet"
            description="Post your first job to start receiving bids."
            action={
              <Button asChild size="sm">
                <Link href="/caster/jobs/new/basics">Post a job</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-border divide-y">
            {jobs.data.map((j) => (
              <li key={j.id} className="flex items-center justify-between py-3 text-sm">
                <Link href={`/caster/jobs/${j.id}`} className="flex-1 hover:underline">
                  <div className="font-medium">{j.title}</div>
                  <div className="text-muted-foreground text-xs">
                    Shoot {formatDate(j.shootDate)} · {j.headcountFilled}/{j.headcountRequired}{' '}
                    filled
                  </div>
                </Link>
                <StatusBadge status={j.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
