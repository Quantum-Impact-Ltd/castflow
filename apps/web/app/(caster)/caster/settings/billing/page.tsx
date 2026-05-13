import { PageHeader } from '@/components/dashboard'
import { Card, CardContent } from '@/components/ui/card'

export default function CasterSettingsBillingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Billing" />
      <Card>
        <CardContent className="text-sm pt-6 space-y-2">
          <p>
            Casters pay per booking via Stripe escrow at the time of accepting a bid. There is no
            recurring subscription in the current platform tier.
          </p>
          <p className="text-muted-foreground">
            Invoices for each booking are downloadable from the booking detail page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
