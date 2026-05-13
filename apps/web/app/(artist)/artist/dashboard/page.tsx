import Link from 'next/link'
import { PageHeader } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { ArtistDashboardClient } from './client'
import { ArtistStats } from './stats'

export default function ArtistDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back"
        description="Here is what's happening with your bookings, bids, and earnings."
        actions={
          <Button asChild>
            <Link href="/artist/jobs">Browse jobs</Link>
          </Button>
        }
      />

      <ArtistStats />

      <ArtistDashboardClient />
    </div>
  )
}
