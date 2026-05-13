import { PageHeader, EmptyState } from '@/components/dashboard'

export default function ArtistSavedJobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Saved jobs" description="Jobs you've bookmarked." />
      <EmptyState
        title="Saved jobs coming soon"
        description="This feature is not yet enabled. Use the job feed to find work."
      />
    </div>
  )
}
