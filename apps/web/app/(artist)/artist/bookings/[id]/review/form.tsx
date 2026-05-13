'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard'
import { useSubmitReview } from '@/lib/hooks/use-reviews'

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const submit = useSubmitReview(bookingId)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Leave a review" description="Rate the caster you worked with." />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className={`size-10 rounded-md border text-lg ${
                    rating >= n ? 'bg-primary text-primary-foreground' : 'border-border'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <Button
            disabled={submit.isPending}
            onClick={async () => {
              await submit.mutateAsync({ rating, comment: comment || undefined })
              router.push(`/artist/bookings/${bookingId}`)
            }}
          >
            {submit.isPending ? 'Submitting…' : 'Submit review'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
