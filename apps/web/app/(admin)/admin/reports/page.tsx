'use client'

import Link from 'next/link'
import { Flag, MessageSquare, Star, ShieldCheck, X, ArrowUpRight } from 'lucide-react'
import type { AdminReportRow } from '@/lib/api/admin'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useReports, useResolveReport, useDismissReport } from '@/lib/hooks/use-admin'

const STATUS_TABS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'all', label: 'All' },
] as const

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

const STATUS_STYLES: Record<AdminReportRow['status'], string> = {
  open: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  dismissed: 'bg-muted text-muted-foreground',
}

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="User-submitted reports on messages and reviews — investigate and resolve."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Flag className="h-3.5 w-3.5" /> Moderation
          </span>
        }
      />

      <Tabs defaultValue="open">
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUS_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <ReportList status={t.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ReportList({ status }: { status: string }) {
  // 'all' → no status filter; otherwise filter to the tab.
  const { data, isPending, isError, refetch } = useReports(
    status === 'all' ? { limit: 100 } : { status, limit: 100 }
  )

  if (isPending) return <LoadingState rows={4} />
  if (isError) {
    return <ErrorState message="We couldn’t load reports." onRetry={() => void refetch()} />
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No reports"
        description="There are no reports in this view."
        icon={<Flag className="h-6 w-6" />}
      />
    )
  }
  return (
    <div className="space-y-3">
      {data.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  )
}

function ReportCard({ report }: { report: AdminReportRow }) {
  const resolve = useResolveReport()
  const dismiss = useDismissReport()
  const busy = resolve.isPending || dismiss.isPending
  const isOpen = report.status === 'open' || report.status === 'reviewing'

  const investigateHref =
    report.targetType === 'review'
      ? `/admin/flagged/${report.targetId}?type=review`
      : '/admin/flagged'

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium capitalize text-muted-foreground">
              {report.targetType === 'review' ? (
                <Star className="h-3.5 w-3.5" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
              {report.targetType === 'review' ? 'Review' : 'Conversation'}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                STATUS_STYLES[report.status]
              )}
            >
              {report.status}
            </span>
          </div>
          <p className="font-medium text-foreground">{report.targetLabel}</p>
          <p className="text-xs text-muted-foreground">
            Reported by <span className="font-medium">{report.reporterName ?? 'Unknown'}</span> ·{' '}
            {formatDateTime(report.createdAt)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium capitalize text-amber-700">
          {report.reason.replace(/_/g, ' ')}
        </span>
      </div>

      {report.detail ? (
        <blockquote className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
          {report.detail}
        </blockquote>
      ) : null}

      {report.resolutionNote ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Resolution note:</span>{' '}
          {report.resolutionNote}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {isOpen ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => resolve.mutate({ id: report.id })}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />{' '}
              {resolve.isPending ? 'Resolving…' : 'Mark resolved'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => dismiss.mutate({ id: report.id })}
            >
              <X className="mr-1.5 h-4 w-4" /> {dismiss.isPending ? 'Dismissing…' : 'Dismiss'}
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            No actions — already {report.status}.
          </span>
        )}
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link href={investigateHref}>
            Investigate <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}
