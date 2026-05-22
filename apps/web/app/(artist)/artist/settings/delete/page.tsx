import { PageHeader } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Pre-composed mailto — see caster equivalent for rationale.
const SUPPORT_EMAIL = 'support@castflow.co.uk'
const DELETE_SUBJECT = 'Delete my artist account'
const DELETE_BODY = [
  'Hi CastFlow support,',
  '',
  'Please delete my artist account.',
  '',
  'Account email: (please send from the email tied to your account)',
  'First name:',
  '',
  'Thanks.',
].join('\n')
const DELETE_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  DELETE_SUBJECT,
)}&body=${encodeURIComponent(DELETE_BODY)}`

export default function ArtistSettingsDeletePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Delete account" />
      <Card>
        <CardContent className="text-sm pt-6 space-y-4">
          <p>
            Account deletion is processed manually for safety. Active bookings or pending payouts
            block deletion until they&apos;re resolved.
          </p>
          <p className="text-muted-foreground">
            Send the request from the email address tied to your account so we can verify it&apos;s
            you. We aim to action deletions within 2 working days.
          </p>
          <div>
            <Button asChild>
              <a href={DELETE_MAILTO}>Email a deletion request</a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Or copy <code className="rounded bg-muted px-1.5 py-0.5">{SUPPORT_EMAIL}</code> if
            your mail client doesn&apos;t open from the button.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
