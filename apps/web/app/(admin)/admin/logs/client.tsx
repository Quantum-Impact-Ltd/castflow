'use client'

import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useAdminLogs } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

export function AdminLogsClient() {
  const logs = useAdminLogs({ limit: 200 })
  if (logs.isPending) return <LoadingState rows={5} />
  if (logs.isError) return <ErrorState onRetry={() => logs.refetch()} />
  if (!logs.data?.length) return <EmptyState title="No admin actions recorded" />
  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Every admin action is permanently recorded." />
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2">Action</th>
                  <th className="py-2">Entity</th>
                  <th className="py-2">Admin</th>
                  <th className="py-2">Notes</th>
                  <th className="py-2 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.data.map((l) => (
                  <tr key={l.id} className="border-border border-b">
                    <td className="py-3 capitalize">{l.action.replace(/_/g, ' ')}</td>
                    <td className="py-3 text-muted-foreground">
                      {l.entityType} · {l.entityId.slice(0, 8)}
                    </td>
                    <td className="py-3 text-muted-foreground">{l.adminId.slice(0, 8)}</td>
                    <td className="py-3">{l.notes ?? '—'}</td>
                    <td className="py-3 text-right text-muted-foreground text-xs">
                      {formatDate(l.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
