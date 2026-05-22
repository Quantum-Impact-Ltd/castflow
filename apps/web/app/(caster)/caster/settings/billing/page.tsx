import { PageHeader } from '@/components/dashboard'
import { Card, CardContent } from '@/components/ui/card'

export default function CasterSettingsBillingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Billing" />
      <Card>
        <CardContent className="text-sm pt-6 space-y-3">
          <p>
            Casters pay per booking via Stripe escrow at the time of accepting a bid. There is no
            recurring subscription in the current platform tier.
          </p>
          <p className="text-muted-foreground">
            How a booking charge breaks down:
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Agreed rate</strong> goes to the artist in
              full. Artists keep 100% — no platform deduction.
            </li>
            <li>
              <strong className="text-foreground">Platform fee</strong> is added on top of the
              agreed rate and charged to the caster.
            </li>
            <li>
              <strong className="text-foreground">Stripe processing</strong> (2.2% + £0.30 UK,
              higher on non-UK cards) is also added on top.
            </li>
            <li>
              Funds are held in escrow from booking confirmation until the shoot is confirmed
              complete, or auto-release fires 48 hours after the shoot date.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Itemised invoices for every booking are downloadable from the booking detail page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
