import { PageHeader } from '@/components/dashboard'
import { Card, CardContent } from '@/components/ui/card'

export default function ArtistSettingsDeletePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Delete account" />
      <Card>
        <CardContent className="text-sm pt-6 space-y-3">
          <p>
            Account deletion is processed manually for safety. Active bookings or pending payouts
            block deletion until they're resolved.
          </p>
          <p className="text-muted-foreground">
            Email{' '}
            <a className="underline" href="mailto:support@castflow.co.uk">
              support@castflow.co.uk
            </a>{' '}
            from your account email to request deletion.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
