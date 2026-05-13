'use client'

import { useEffect, useState } from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useBooking } from '@/lib/hooks/use-bookings'
import { useCreateEscrowIntent } from '@/lib/hooks/use-payments'
import { formatCurrency, formatDate } from '@/lib/utils'

let stripePromise: Promise<Stripe | null> | null = null
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']
    stripePromise = key ? loadStripe(key) : Promise.resolve(null)
  }
  return stripePromise
}

export function CasterPayClient({ bookingId }: { bookingId: string }) {
  const booking = useBooking(bookingId)
  const createIntent = useCreateEscrowIntent()
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    if (booking.data && booking.data.payment?.escrowStatus === 'awaiting_payment') {
      createIntent.mutate(bookingId, {
        onSuccess: (res) => setClientSecret(res.clientSecret),
      })
    }
  }, [booking.data?.id])

  if (booking.isPending) return <LoadingState rows={5} />
  if (booking.isError || !booking.data) return <ErrorState onRetry={() => booking.refetch()} />
  const b = booking.data

  const alreadyHeld = b.payment && b.payment.escrowStatus !== 'awaiting_payment'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Pay into escrow" description={`Booking for ${formatDate(b.shootDate)}`} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="text-lg font-semibold">{formatCurrency(b.totalAmount)}</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Funds are held in escrow and released to the artist after the shoot is confirmed
            complete (or automatically 48 hours after the shoot date).
          </p>
          {alreadyHeld ? (
            <p>This booking has already been paid into escrow.</p>
          ) : !clientSecret ? (
            <LoadingState rows={1} />
          ) : (
            <Button
              onClick={async () => {
                const stripe = await getStripe()
                if (!stripe) return
                await stripe.confirmPayment({
                  clientSecret,
                  confirmParams: {
                    return_url: `${window.location.origin}/caster/bookings/${bookingId}`,
                  },
                })
              }}
            >
              Continue to payment
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
