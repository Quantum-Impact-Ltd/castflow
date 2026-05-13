import { PageHeader } from '@/components/dashboard'
import { Card, CardContent } from '@/components/ui/card'

export default function CasterSettingsNotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Notification preferences" />
      <Card>
        <CardContent className="text-sm pt-6 space-y-2">
          <p>
            Notification toggles are coming soon. For now, every key event triggers both an email
            and an in-app notification.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
