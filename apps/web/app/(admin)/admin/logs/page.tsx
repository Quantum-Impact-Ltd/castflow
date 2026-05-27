'use client'

import { useState } from 'react'
import { ScrollText, Search, X, Lock } from 'lucide-react'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminLogs } from '@/lib/hooks/use-admin'

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}

function humanise(value: string): string {
  return value
    .split('_')
    .map((w) => (w.length ? `${w[0]!.toUpperCase()}${w.slice(1)}` : w))
    .join(' ')
}

export default function AdminLogsPage() {
  // Draft holds the input value; `adminId` is the committed filter (applied on submit).
  const [draft, setDraft] = useState('')
  const [adminId, setAdminId] = useState('')

  const { data, isPending, isError, refetch } = useAdminLogs(
    adminId ? { adminId, limit: 100 } : { limit: 100 }
  )

  const apply = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminId(draft.trim())
  }

  const clear = () => {
    setDraft('')
    setAdminId('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="A permanent, append-only record of every admin action."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <ScrollText className="h-3.5 w-3.5" /> Compliance
          </span>
        }
      />

      <form onSubmit={apply} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Filter by admin ID"
            className="pl-9"
            aria-label="Filter by admin ID"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
        {adminId ? (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        ) : null}
      </form>

      {isPending ? (
        <LoadingState rows={6} />
      ) : isError ? (
        <ErrorState
          message="We couldn’t load the audit log right now."
          onRetry={() => void refetch()}
        />
      ) : data && data.length > 0 ? (
        <Card className="p-0">
          <Table>
            <TableCaption className="flex items-center justify-center gap-1.5 pb-4">
              <Lock className="h-3.5 w-3.5" /> Permanent record — entries cannot be edited or
              deleted.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell
                    className="font-mono text-xs text-foreground"
                    title={log.adminId}
                  >
                    {shortId(log.adminId)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {humanise(log.action)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="text-foreground">{humanise(log.entityType)}</span>{' '}
                    <span className="font-mono text-xs" title={log.entityId}>
                      {shortId(log.entityId)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                    {log.notes ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          title={adminId ? 'No matching entries' : 'No audit entries yet'}
          description={
            adminId
              ? 'No actions have been logged for that admin ID.'
              : 'Admin actions will appear here as they happen.'
          }
          icon={<ScrollText className="h-6 w-6" />}
          action={
            adminId ? (
              <Button variant="outline" size="sm" onClick={clear}>
                Clear filter
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  )
}
