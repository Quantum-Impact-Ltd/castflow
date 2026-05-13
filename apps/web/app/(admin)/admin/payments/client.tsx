'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/dashboard'
import { useAdminPayments, useForceRefund, useForceRelease } from '@/lib/hooks/use-admin'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUSES = ['all', 'awaiting_payment', 'held', 'released', 'refunded', 'disputed'] as const

export function AdminPaymentsClient() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all')
  const payments = useAdminPayments(
    status === 'all' ? { limit: 100 } : { escrowStatus: status, limit: 100 }
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Escrow balances and audit actions." />
      <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof STATUSES)[number])}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {payments.isPending ? (
        <LoadingState rows={5} />
      ) : payments.isError ? (
        <ErrorState onRetry={() => payments.refetch()} />
      ) : !payments.data?.length ? (
        <EmptyState title="No payments in this status" />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                    <th className="py-2">Booking</th>
                    <th className="py-2">Gross</th>
                    <th className="py-2">Net</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.data.map((p) => (
                    <PaymentRow key={p.id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PaymentRow({
  p,
}: {
  p: NonNullable<ReturnType<typeof useAdminPayments>['data']>[number]
}) {
  const release = useForceRelease()
  const refund = useForceRefund()
  const [notes, setNotes] = useState('')
  const [open, setOpen] = useState<null | 'release' | 'refund'>(null)
  const bookingId = p.bookingId

  return (
    <tr className="border-border border-b">
      <td className="py-3">
        <Link href={`/admin/bookings/${bookingId}`} className="hover:underline">
          {p.booking ? formatDate(p.booking.shootDate) : bookingId.slice(0, 8)}
        </Link>
      </td>
      <td className="py-3">{formatCurrency(p.grossAmount)}</td>
      <td className="py-3">{formatCurrency(p.netArtistAmount)}</td>
      <td className="py-3">
        <StatusBadge status={p.escrowStatus} />
      </td>
      <td className="py-3 text-right">
        {p.escrowStatus === 'held' ? (
          <div className="flex justify-end gap-2">
            <Dialog open={open === 'release'} onOpenChange={(o) => setOpen(o ? 'release' : null)}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Force release
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Force-release escrow to artist?</DialogTitle>
                </DialogHeader>
                <Textarea
                  placeholder="Admin notes (required, ≥3 chars)"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await release.mutateAsync({ bookingId, notes })
                      setOpen(null)
                      setNotes('')
                    }}
                    disabled={notes.trim().length < 3 || release.isPending}
                  >
                    Release
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={open === 'refund'} onOpenChange={(o) => setOpen(o ? 'refund' : null)}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Force-refund escrow to caster?</DialogTitle>
                </DialogHeader>
                <Textarea
                  placeholder="Admin notes (required, ≥3 chars)"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await refund.mutateAsync({ bookingId, notes })
                      setOpen(null)
                      setNotes('')
                    }}
                    disabled={notes.trim().length < 3 || refund.isPending}
                  >
                    Refund
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
    </tr>
  )
}
