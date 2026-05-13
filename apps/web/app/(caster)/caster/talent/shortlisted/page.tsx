import { PageHeader, EmptyState } from '@/components/dashboard'

export default function CasterTalentShortlistedPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Shortlisted talent" description="Artists you've saved across jobs." />
      <EmptyState
        title="Coming soon"
        description="Cross-job shortlists are not yet enabled. Use the per-job bid view to shortlist."
      />
    </div>
  )
}
