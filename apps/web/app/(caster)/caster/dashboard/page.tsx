import Link from 'next/link'
import { PageHeader } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { CasterDashboardClient } from './client'
import { CasterStats } from './stats'

export default function CasterDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Caster dashboard"
        description="Manage your jobs, bids, and bookings."
        actions={
          <Button asChild>
            <Link href="/caster/jobs/new/basics">Post a new job</Link>
          </Button>
        }
      />

      <CasterStats />

      <CasterDashboardClient />
    </div>
  )
}
