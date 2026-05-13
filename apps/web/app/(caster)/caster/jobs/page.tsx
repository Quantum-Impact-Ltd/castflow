import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard'
import { CasterJobsList } from './list'

export default function CasterJobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My jobs"
        actions={
          <Button asChild>
            <Link href="/caster/jobs/new/basics">Post new job</Link>
          </Button>
        }
      />
      <CasterJobsList />
    </div>
  )
}
