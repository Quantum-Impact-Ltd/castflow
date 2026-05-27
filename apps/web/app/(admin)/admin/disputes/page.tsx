'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scale } from 'lucide-react'
import type { Dispute, DisputeReason, DisputeStatus } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminDisputes } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
]

const REASON_LABEL: Record<DisputeReason, string> = {
  no_show_artist: 'Artist did not show up',
  no_show_caster: 'Caster did not show up',
  payment_issue: 'Payment issue',
  quality_issue: 'Quality issue',
  other: 'Other',
}

// Surface actionable disputes first when the API doesn't pre-sort.
const STATUS_RANK: Record<DisputeStatus, number> = {
  open: 0,
  under_review: 1,
  escalated: 2,
  resolved: 3,
}

export default function AdminDisputesPage() {
  const router = useRouter()
  const [status, setStatus] = useState<string>('all')

  const filters = status === 'all' ? {} : { status }
  const { data, isPending, isError, refetch } = useAdminDisputes(filters)

  const disputes = useMemo(() => {
    const list = [...(data ?? [])]
    return list.sort((a, b) => {
      const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      if (rank !== 0) return rank
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="Resolve open and in-review disputes. Open and under-review surface first."
      />

      <div className="flex justify-end">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <LoadingState rows={6} />
      ) : isError ? (
        <ErrorState message="We couldn’t load disputes." onRetry={() => void refetch()} />
      ) : disputes.length === 0 ? (
        <EmptyState
          title="No disputes"
          description="No disputes match the selected status."
          icon={<Scale className="h-6 w-6" />}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <DisputeRow
                  key={dispute.id}
                  dispute={dispute}
                  onOpen={() => router.push(`/admin/disputes/${dispute.bookingId}`)}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

function DisputeRow({ dispute, onOpen }: { dispute: Dispute; onOpen: () => void }) {
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="font-medium text-foreground">{REASON_LABEL[dispute.reason]}</TableCell>
      <TableCell>
        <StatusBadge status={dispute.status} />
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(dispute.createdAt)}</TableCell>
      <TableCell className="text-muted-foreground">
        {dispute.resolution ? resolutionLabel(dispute.resolution) : '—'}
      </TableCell>
    </TableRow>
  )
}

function resolutionLabel(resolution: string): string {
  switch (resolution) {
    case 'full_release_to_artist':
      return 'Full release to artist'
    case 'full_refund_to_caster':
      return 'Full refund to caster'
    case 'split':
      return 'Split'
    case 'escalated':
      return 'Escalated'
    default:
      return '—'
  }
}
