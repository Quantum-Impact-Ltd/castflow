'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { ChevronLeft, ShieldCheck, Lock } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState, Money } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/lib/hooks/use-bookings'
import { useCreateEscrowIntent } from '@/lib/hooks/use-payments'
import { errorMessage } from '@/lib/hooks/util'

const publishableKey = process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']
let stripePromise: Promise<Stripe | null> | null = null
function getStripe() {
  if (!publishableKey) return null
  stripePromise ??= loadStripe(publishableKey)
  return stripePromise
}

export function PayClient({ bookingId }: { bookingId: string }) {
  const booking = useBooking(bookingId)
  const createIntent = useCreateEscrowIntent()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [intentError, setIntentError] = useState<string | null>(null)
  const startedRef = useRef(false)

  // Create the escrow PaymentIntent exactly once for this booking.
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    createIntent.mutate(bookingId, {
      onSuccess: (data) => setClientSecret(data.clientSecret),
      onError: (err) => setIntentError(errorMessage(err)),
    })
  }, [bookingId, createIntent])

  const stripe = getStripe()

  if (booking.isPending) return <LoadingState variant="detail" />
  if (booking.isError || !booking.data) {
    return <ErrorState onRetry={() => void booking.refetch()} />
  }

  const b = booking.data

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/caster/bookings/${bookingId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to booking
      </Link>

      <PageHeader title="Pay into escrow" description={b.job?.title ?? 'Confirm your booking'} />

      <Card className="space-y-3 p-6">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Artist</span>
          <span className="font-medium text-foreground">{b.artist?.firstName ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-muted-foreground">Total into escrow</span>
          <span className="text-xl font-semibold text-foreground">
            <Money amount={b.totalAmount} />
          </span>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Funds are held securely. They’re only released to the artist after the shoot is confirmed
          complete. Platform commission comes out of the artist’s side — you pay the agreed rate in
          full.
        </p>
      </Card>

      {!publishableKey ? (
        <ErrorState
          title="Payments not configured"
          message="Stripe isn’t set up in this environment yet."
        />
      ) : intentError ? (
        <ErrorState title="Couldn’t start payment" message={intentError} />
      ) : !clientSecret || !stripe ? (
        <LoadingState rows={2} />
      ) : (
        <Elements stripe={stripe} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <CheckoutForm bookingId={bookingId} />
        </Elements>
      )}
    </div>
  )
}

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/caster/bookings/${bookingId}?paid=1`,
      },
    })
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card className="p-6">
        <PaymentElement />
      </Card>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        <Lock className="mr-1.5 h-4 w-4" />
        {submitting ? 'Processing…' : 'Pay into escrow'}
      </Button>
    </form>
  )
}
