'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { KeyRound, Mail, Bell, Trash2 } from 'lucide-react'
import { PageHeader, LoadingState } from '@/components/dashboard'
import { AvailabilityToggle } from '@/components/dashboard/availability-toggle'
import { CalendarFeedCard } from '@/components/dashboard/calendar-feed-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { authClient } from '@/lib/auth-client'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { useNotificationPrefs, type NotificationPrefs } from '@/lib/hooks/use-notification-prefs'

const PREF_LABELS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'bidUpdates', label: 'Bid updates', hint: 'Shortlisted, rejected, or accepted.' },
  { key: 'messages', label: 'Messages', hint: 'New messages from casters.' },
  { key: 'bookings', label: 'Bookings & contracts', hint: 'Confirmations, contracts, cancellations.' },
  { key: 'reviews', label: 'Reviews', hint: 'When a caster reviews you.' },
]

export default function ArtistSettingsPage() {
  const profile = useMyArtistProfile()
  const { prefs, setPref } = useNotificationPrefs()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwPending, setPwPending] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPending, setEmailPending] = useState(false)

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwPending(true)
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
    setPwPending(false)
    if (error) {
      toast.error(error.message ?? 'Could not change password')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    toast.success('Password updated')
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailPending(true)
    const { error } = await authClient.changeEmail({
      newEmail,
      callbackURL: '/artist/settings',
    })
    setEmailPending(false)
    if (error) {
      toast.error(error.message ?? 'Could not change email')
      return
    }
    setNewEmail('')
    toast.success('Check your inbox to confirm your new email')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      {/* Availability */}
      <Card className="p-6">
        {profile.isPending ? (
          <LoadingState rows={1} />
        ) : profile.data ? (
          <AvailabilityToggle status={profile.data.availabilityStatus} />
        ) : null}
      </Card>

      {/* Account security */}
      <Card className="space-y-6 p-6">
        <SectionHeading icon={KeyRound} title="Account security" />
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pwPending || !currentPassword || !newPassword}>
              {pwPending ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>

        <Separator />

        <form onSubmit={changeEmail} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="newEmail" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Change email
            </Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="new@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={emailPending || !newEmail}>
            {emailPending ? 'Sending…' : 'Update email'}
          </Button>
        </form>
      </Card>

      {/* Notification preferences */}
      <Card className="space-y-4 p-6">
        <SectionHeading icon={Bell} title="Email notifications" />
        <ul className="divide-y divide-border">
          {PREF_LABELS.map(({ key, label, hint }) => (
            <li key={key} className="flex items-center justify-between py-3">
              <div>
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

      {/* Calendar */}
      <CalendarFeedCard />

      {/* Danger zone */}
      <Card className="flex items-center justify-between border-destructive/30 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium text-foreground">Delete account</p>
            <p className="text-sm text-muted-foreground">
              Permanently remove your account and profile.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5">
          <Link href="/artist/settings/delete">Delete…</Link>
        </Button>
      </Card>
    </div>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: typeof KeyRound; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  )
}
