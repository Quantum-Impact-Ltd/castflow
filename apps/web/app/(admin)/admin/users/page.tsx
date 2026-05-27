'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search } from 'lucide-react'
import type { UserRole, UserStatus } from '@castflow/types'
import type { AdminUserRow } from '@/lib/api/admin'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdminUsers } from '@/lib/hooks/use-admin'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { formatDate } from '@/lib/utils'

type RoleFilter = 'all' | UserRole
type StatusFilter = 'all' | UserStatus

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'artist', label: 'Artists' },
  { value: 'caster', label: 'Casters' },
  { value: 'admin', label: 'Admins' },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
]

// 'banned' and 'suspended' aren't in StatusBadge's map, so users get a plain
// Badge with an explicit colour here.
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  pending: { label: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  suspended: { label: 'Suspended', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  banned: {
    label: 'Banned',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'border-violet-200 bg-violet-50 text-violet-700',
  caster: 'border-sky-200 bg-sky-50 text-sky-700',
  artist: 'border-border bg-muted text-muted-foreground',
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const debouncedQ = useDebouncedValue(q, 300)

  const { data, isPending, isError, refetch } = useAdminUsers({
    q: debouncedQ.trim() || undefined,
    role: role === 'all' ? undefined : role,
    status: status === 'all' ? undefined : status,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="All users"
        description="Every account on the platform — search, filter, and drill in."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email"
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as RoleFilter)}>
          <SelectTrigger className="w-full lg:w-40" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-full lg:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <LoadingState rows={6} />
      ) : isError ? (
        <ErrorState message="We couldn’t load users." onRetry={() => void refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="No users found"
          description="No accounts match the current filters."
          icon={<Users className="h-6 w-6" />}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <TableCell className="font-medium text-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize ${ROLE_BADGE[user.role] ?? ''}`}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={user.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {profileName(user)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const entry = STATUS_BADGE[status]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        entry?.className ?? 'border-border bg-muted text-muted-foreground'
      }`}
    >
      {entry?.label ?? status}
    </span>
  )
}

function profileName(user: AdminUserRow): string {
  if (user.artistProfile) {
    return `${user.artistProfile.firstName} ${user.artistProfile.lastName}`
  }
  if (user.casterProfile) {
    return user.casterProfile.companyName
  }
  return '—'
}
