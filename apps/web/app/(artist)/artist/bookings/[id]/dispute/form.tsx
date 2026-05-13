'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard'
import { useRaiseDispute } from '@/lib/hooks/use-disputes'

const REASONS = [
  { value: 'no_show_caster', label: 'Caster did not show up' },
  { value: 'no_show_artist', label: 'Artist did not show up' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'other', label: 'Other' },
]

export function DisputeForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const raise = useRaiseDispute(bookingId)
  const [reason, setReason] = useState('payment_issue')
  const [description, setDescription] = useState('')

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Raise a dispute"
        description="Disputes must be raised within 72 hours of the shoot date."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispute details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">What happened?</Label>
            <Textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. An admin will review and decide."
            />
          </div>
          <Button
            disabled={!description.trim() || raise.isPending}
            onClick={async () => {
              await raise.mutateAsync({ reason, description })
              router.push(`/artist/bookings/${bookingId}`)
            }}
          >
            {raise.isPending ? 'Submitting…' : 'Open dispute'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
