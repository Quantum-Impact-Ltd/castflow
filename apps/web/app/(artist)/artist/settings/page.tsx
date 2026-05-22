import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard'
import { CalendarFeedCard } from '@/components/settings/calendar-feed'

export default function ArtistSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Change your email, password, or notification preferences via{' '}
              <Link href="/forgot-password" className="underline">
                password reset
              </Link>{' '}
              flows for now.
            </p>
            <Button asChild variant="outline">
              <Link href="/artist/settings/delete">Delete account</Link>
            </Button>
          </CardContent>
        </Card>
        <CalendarFeedCard />
      </div>
    </div>
  )
}
