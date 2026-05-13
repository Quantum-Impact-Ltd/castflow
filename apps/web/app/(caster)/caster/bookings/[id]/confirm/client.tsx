'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useBooking, useConfirmCompletion } from '@/lib/hooks/use-bookings'
import { formatCurrency, formatDate } from '@/lib/utils'

export function ConfirmCompletionClient({ bookingId }: { bookingId: string }) {
  const booking = useBooking(bookingId)
  const confirm = useConfirmCompletion(bookingId)
  const router = useRouter()

  if (booking.isPending) return <LoadingState rows={4} />
  if (booking.isError || !booking.data) return <ErrorState onRetry={() => booking.refetch()} />
  const b = booking.data

  const shootInPast = new Date(b.shootDate) <= new Date()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Confirm completion" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Release payment to the artist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Shoot date: <strong>{formatDate(b.shootDate)}</strong>
          </p>
          <p>
            Payment to release: <strong>{formatCurrency(b.totalAmount)}</strong>
          </p>
          {!shootInPast ? (
            <p className="text-amber-600">
              You can only confirm completion after the shoot date. Payment will auto-release 48
              hours after the shoot if you do nothing.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Confirming releases the escrowed amount minus the platform commission to the artist's
              Stripe Connect account.
            </p>
          )}
          <Button
            disabled={!shootInPast || confirm.isPending}
            onClick={async () => {
              await confirm.mutateAsync()
              router.push(`/caster/bookings/${bookingId}`)
            }}
          >
            {confirm.isPending ? 'Releasing…' : 'Confirm completion'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
