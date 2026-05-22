import { PageHeader } from '@/components/dashboard'
import { Card, CardContent } from '@/components/ui/card'

export default function CasterSettingsNotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Notification preferences" />
      <Card>
        <CardContent className="text-sm pt-6 space-y-3">
          <p>
            Per-event toggles are coming soon. For now, every key event sends both an email and
            an in-app notification.
          </p>
          <p className="text-muted-foreground">
            What sends right now:
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Job matches</strong> arrive as a daily digest
              around 9am UK time, so artists don&apos;t get pinged for every new brief.
            </li>
            <li>
              <strong className="text-foreground">Bids, shortlists, bookings, contract signatures,
              payouts, and messages</strong> arrive in real time as they happen.
            </li>
            <li>
              <strong className="text-foreground">Disputes and admin actions</strong> always send
              an email regardless of in-app status.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
