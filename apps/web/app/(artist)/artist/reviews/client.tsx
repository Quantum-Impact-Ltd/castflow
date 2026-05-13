'use client'

import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { useArtistReviews } from '@/lib/hooks/use-reviews'
import { formatDate } from '@/lib/utils'

export function ReviewsClient() {
  const profile = useMyArtistProfile()
  const reviews = useArtistReviews(profile.data?.id)

  if (profile.isPending || reviews.isPending) return <LoadingState rows={4} />
  if (profile.isError || reviews.isError) return <ErrorState onRetry={() => reviews.refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description={
          profile.data?.id ? `Casters have left ${reviews.data?.length ?? 0} reviews.` : undefined
        }
      />
      {!reviews.data?.length ? (
        <EmptyState
          title="No reviews yet"
          description="Reviews appear here after you complete shoots."
        />
      ) : (
        <ul className="space-y-3">
          {reviews.data.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="pt-6 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-medium">{'★'.repeat(r.rating)}</div>
                    <div className="text-muted-foreground text-xs">{formatDate(r.createdAt)}</div>
                  </div>
                  {r.comment ? <p className="whitespace-pre-wrap">{r.comment}</p> : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
