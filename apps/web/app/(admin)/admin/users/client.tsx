'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/dashboard'
import { useAdminUsers } from '@/lib/hooks/use-admin'

export function UsersClient() {
  const [role, setRole] = useState<'all' | 'artist' | 'caster' | 'admin'>('all')
  const [status, setStatus] = useState<'all' | 'active' | 'suspended' | 'banned' | 'pending'>('all')
  const [q, setQ] = useState('')

  const filters: Parameters<typeof useAdminUsers>[0] = {
    limit: 100,
    ...(role !== 'all' ? { role } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(q ? { q } : {}),
  }
  const users = useAdminUsers(filters)

  return (
    <div className="space-y-6">
      <PageHeader title="Users" />

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Search</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email or name" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="caster">Caster</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {users.isPending ? (
        <LoadingState rows={5} />
      ) : users.isError ? (
        <ErrorState onRetry={() => users.refetch()} />
      ) : !users.data?.length ? (
        <EmptyState title="No matching users" />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((u) => (
                    <tr key={u.id} className="border-border border-b">
                      <td className="py-3">
                        <Link href={`/admin/users/${u.id}`} className="hover:underline">
                          {u.email}
                        </Link>
                      </td>
                      <td className="py-3 capitalize">{u.role}</td>
                      <td className="py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="text-muted-foreground py-3">
                        {u.artistProfile
                          ? `${u.artistProfile.firstName} ${u.artistProfile.lastName ?? ''}`
                          : u.casterProfile
                            ? u.casterProfile.companyName
                            : '—'}
                      </td>
                    </tr>
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
