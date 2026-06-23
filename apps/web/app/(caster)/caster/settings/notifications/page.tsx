'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useNotificationPrefs, type NotificationPrefs } from '@/lib/hooks/use-notification-prefs'

const PREF_LABELS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'bidUpdates', label: 'New bids', hint: 'When an artist bids on one of your jobs.' },
  { key: 'messages', label: 'Messages', hint: 'New messages from shortlisted artists.' },
  {
    key: 'bookings',
    label: 'Bookings & contracts',
    hint: 'Confirmations, contracts to sign, and cancellations.',
  },
  { key: 'payments', label: 'Subscription', hint: 'Subscription renewals, receipts, and billing issues.' },
  { key: 'reviews', label: 'Reviews', hint: 'When an artist reviews you after a shoot.' },
]

export default function CasterNotificationSettingsPage() {
  const { prefs, setPref } = useNotificationPrefs()

  return (
    <div className="space-y-6">
      <Link
        href="/caster/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to settings
      </Link>

      <PageHeader
        title="Notification settings"
        description="Choose which email notifications you’d like to receive."
      />

      <Card className="p-6">
        <ul className="divide-y divide-border">
          {PREF_LABELS.map(({ key, label, hint }) => (
            <li key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="pr-4">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch
                checked={prefs[key]}
                onCheckedChange={(checked) => setPref(key, checked)}
                aria-label={label}
              />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
