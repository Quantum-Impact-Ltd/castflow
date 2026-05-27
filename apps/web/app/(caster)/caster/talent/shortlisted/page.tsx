'use client'

import { BookmarkCheck, X } from 'lucide-react'
import { PageHeader, LoadingState, EmptyState } from '@/components/dashboard'
import { TalentCard } from '@/components/dashboard/talent-card'
import { Button } from '@/components/ui/button'
import { useTalentShortlist } from '@/lib/hooks/use-talent-shortlist'
import { useTalentProfile } from '@/lib/hooks/use-talent'

export default function ShortlistedTalentPage() {
  const { shortlistedIds } = useTalentShortlist()

  return (
    <div className="space-y-6">
      <PageHeader title="Shortlist" description="Artists you’ve saved across all your jobs." />

      {shortlistedIds.length === 0 ? (
        <EmptyState
          title="No shortlisted talent yet"
          description="Save artists from talent search to compare and invite them later."
          icon={<BookmarkCheck className="h-6 w-6" />}
          action={
            <Button asChild size="sm" variant="outline">
              <a href="/caster/talent">Browse talent</a>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shortlistedIds.map((id) => (
            <ShortlistItem key={id} id={id} />
          ))}
        </div>
      )}
    </div>
  )
}

function ShortlistItem({ id }: { id: string }) {
  const { data, isPending, isError } = useTalentProfile(id)
  const { remove } = useTalentShortlist()

  if (isPending) return <LoadingState rows={1} variant="grid" />
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">This artist is no longer available.</p>
        <Button variant="ghost" size="sm" onClick={() => remove(id)}>
          <X className="mr-1.5 h-4 w-4" /> Remove
        </Button>
      </div>
    )
  }
  return <TalentCard artist={data} />
}
