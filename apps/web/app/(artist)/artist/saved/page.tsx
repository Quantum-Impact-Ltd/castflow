'use client'

import Link from 'next/link'
import { Bookmark, X } from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import { PageHeader, EmptyState } from '@/components/dashboard'
import { JobCard } from '@/components/dashboard/job-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useSavedJobs } from '@/lib/hooks/use-saved-jobs'
import { useJob } from '@/lib/hooks/use-jobs'

export default function ArtistSavedJobsPage() {
  const { savedIds } = useSavedJobs()

  return (
    <div className="space-y-6">
      <PageHeader title="Saved jobs" description="Shoots you’ve bookmarked to revisit later." />

      {savedIds.length === 0 ? (
        <EmptyState
          title="No saved jobs yet"
          description="Tap the bookmark on any job to save it here for later."
          icon={<Bookmark className="h-6 w-6" />}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/artist/jobs">Browse the job feed</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedIds.map((id) => (
            <SavedJobItem key={id} id={id} />
          ))}
        </div>
      )}
    </div>
  )
}

function SavedJobItem({ id }: { id: string }) {
  const { data, isPending, isError, error } = useJob(id)
  const { remove } = useSavedJobs()

  if (isPending) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>
    )
  }

  if (isError || !data) {
    const status = error instanceof ApiError ? error.status : 0
    const gone = status === 404 || status === 410
    return (
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-border bg-card/50 p-5">
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            {gone ? 'No longer available' : 'Couldn’t load this job'}
          </p>
          <p className="text-sm text-muted-foreground">
            {gone
              ? 'This shoot was filled, expired, or removed.'
              : 'We couldn’t load this saved job right now.'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="self-start" onClick={() => remove(id)}>
          <X className="mr-1.5 h-4 w-4" /> Remove
        </Button>
      </div>
    )
  }

  return <JobCard job={data} href={`/artist/jobs/${id}`} showSave />
}
