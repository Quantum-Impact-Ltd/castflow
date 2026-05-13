'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useAdminUser, useSetUserStatus } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

export function UserDetailClient({ id }: { id: string }) {
  const user = useAdminUser(id)
  const setStatus = useSetUserStatus(id)
  const [reason, setReason] = useState('')

  if (user.isPending) return <LoadingState rows={5} />
  if (user.isError || !user.data) return <ErrorState onRetry={() => user.refetch()} />
  const u = user.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={u.email}
        description={`${u.role} · Joined ${formatDate(u.createdAt)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/users">Back</Link>
            </Button>
            <StatusBadge status={u.status} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Email verified" value={u.emailVerified ? 'Yes' : 'No'} />
            <Row label="Last login" value={u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'} />
            {u.artistProfile ? (
              <Row
                label="Artist"
                value={`${u.artistProfile.firstName} ${u.artistProfile.lastName ?? ''}`}
              />
            ) : null}
            {u.casterProfile ? <Row label="Caster" value={u.casterProfile.companyName} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Textarea
              placeholder="Reason for action"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus.mutate({ status: 'active', reason })}
                disabled={setStatus.isPending}
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus.mutate({ status: 'suspended', reason })}
                disabled={setStatus.isPending}
              >
                Suspend
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setStatus.mutate({ status: 'banned', reason })}
                disabled={setStatus.isPending}
              >
                Ban
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
