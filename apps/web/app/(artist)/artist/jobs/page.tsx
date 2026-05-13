import { PageHeader } from '@/components/dashboard'
import { JobFeed } from './job-feed'

export default function ArtistJobsPage() {
  return (
    <div>
      <PageHeader
        title="Find Jobs"
        description="Browse open castings and submit bids."
      />
      <JobFeed />
    </div>
  )
}
