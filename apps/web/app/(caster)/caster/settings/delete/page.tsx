'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDeleteCasterAccount } from '@/lib/hooks/use-account'

export default function CasterDeleteAccountPage() {
  const del = useDeleteCasterAccount()
  const [confirmText, setConfirmText] = useState('')
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/caster/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to settings
      </Link>

      <PageHeader title="Delete account" description="This is permanent and cannot be undone." />

      <Card className="space-y-4 border border-destructive/30 p-6 ring-destructive/20">
        <div className="flex items-start gap-3 rounded-lg bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-2 text-sm text-foreground">
            <p className="font-medium">Deleting your account will:</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Remove your company profile and logo</li>
              <li>Take down all jobs you’ve posted and their bid history</li>
              <li>Cancel your access to messages and bookings history</li>
              <li>Be permanent — your data cannot be recovered</li>
            </ul>
            <p className="text-muted-foreground">
              You can’t delete your account while you have active bookings or escrow funds held.
              Resolve those first, or we’ll block the request.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm
          </Label>
          <Input
            id="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href="/caster/settings">Cancel</Link>
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={!canDelete || del.isPending}
            onClick={() => del.mutate()}
          >
            {del.isPending ? 'Deleting…' : 'Permanently delete my account'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
