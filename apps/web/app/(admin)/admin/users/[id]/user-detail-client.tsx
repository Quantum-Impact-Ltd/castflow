'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Mail,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Ban,
  PauseCircle,
  PlayCircle,
} from 'lucide-react'
import type { AdminUserRow } from '@/lib/api/admin'
import { PageHeader, LoadingState, ErrorState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAdminUser, useSetUserStatus } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  pending: { label: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  suspended: { label: 'Suspended', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  banned: {
    label: 'Banned',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
}

export function UserDetailClient({ userId }: { userId: string }) {
  const { data: user, isPending, isError, refetch } = useAdminUser(userId)

  if (isPending) return <LoadingState variant="detail" />
  if (isError || !user) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState message="We couldn’t load this user." onRetry={() => void refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={user.email}
        description={`${capitalize(user.role)} account`}
        actions={<StatusPill status={user.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Account</h2>
            <dl className="space-y-2.5 text-sm">
              <Row label="Email">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {user.email}
                </span>
              </Row>
              <Row label="Role" value={capitalize(user.role)} />
              <Row label="Status">
                <StatusPill status={user.status} />
              </Row>
              <Row label="Email verified">
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    {user.emailVerifiedAt ? ` · ${formatDate(user.emailVerifiedAt)}` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-600">
                    <ShieldAlert className="h-3.5 w-3.5" /> Not verified
                  </span>
                )}
              </Row>
              <Row label="Registered" value={formatDate(user.createdAt)} />
              <Row label="Last login" value={formatDate(user.lastLoginAt)} />
            </dl>
          </Card>

          <LinkedProfileCard user={user} />

          <Card className="space-y-2 p-6">
            <h2 className="text-sm font-semibold text-foreground">Activity & moderation</h2>
            <p className="text-sm text-muted-foreground">
              Booking history, bid history, strikes, and payment history require a
              dedicated user-detail endpoint. They aren’t carried on the current
              admin user record, so they’re intentionally not shown here rather than
              fabricated.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <ActionsCard user={user} />
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/admin/users"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to users
    </Link>
  )
}

function LinkedProfileCard({ user }: { user: AdminUserRow }) {
  return (
    <Card className="space-y-3 p-6">
      <h2 className="text-sm font-semibold text-foreground">Linked profile</h2>
      {user.artistProfile ? (
        <dl className="space-y-2.5 text-sm">
          <Row
            label="Name"
            value={`${user.artistProfile.firstName} ${user.artistProfile.lastName}`}
          />
          <Row label="Profile type" value="Artist" />
        </dl>
      ) : user.casterProfile ? (
        <dl className="space-y-2.5 text-sm">
          <Row label="Company" value={user.casterProfile.companyName} />
          <Row label="Profile type" value="Caster" />
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          No profile is linked to this account.
        </p>
      )}
    </Card>
  )
}

function ActionsCard({ user }: { user: AdminUserRow }) {
  const isActive = user.status === 'active'
  const isSuspended = user.status === 'suspended'
  const isBanned = user.status === 'banned'

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Actions</h2>
      </div>
      <div className="flex flex-col gap-2">
        {!isSuspended ? (
          <StatusActionDialog
            userId={user.id}
            email={user.email}
            target="suspended"
            reasonRequired
            triggerLabel="Suspend"
            triggerIcon={<PauseCircle className="mr-1.5 h-4 w-4" />}
            triggerVariant="outline"
            title="Suspend this account?"
            description="The user will be blocked from accessing the platform until reactivated."
            confirmLabel="Suspend account"
          />
        ) : null}

        {!isBanned ? (
          <StatusActionDialog
            userId={user.id}
            email={user.email}
            target="banned"
            reasonRequired
            triggerLabel="Ban"
            triggerIcon={<Ban className="mr-1.5 h-4 w-4" />}
            triggerVariant="destructive"
            title="Ban this account?"
            description="This permanently blocks the account. A reason is required for the audit log."
            confirmLabel="Ban account"
          />
        ) : null}

        {!isActive ? (
          <StatusActionDialog
            userId={user.id}
            email={user.email}
            target="active"
            triggerLabel="Reactivate"
            triggerIcon={<PlayCircle className="mr-1.5 h-4 w-4" />}
            triggerVariant="default"
            title="Reactivate this account?"
            description="The user will regain full access to the platform."
            confirmLabel="Reactivate account"
          />
        ) : null}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Status changes are recorded in the admin audit log.
      </p>
    </Card>
  )
}

function StatusActionDialog({
  userId,
  email,
  target,
  reasonRequired = false,
  triggerLabel,
  triggerIcon,
  triggerVariant,
  title,
  description,
  confirmLabel,
}: {
  userId: string
  email: string
  target: 'active' | 'suspended' | 'banned'
  reasonRequired?: boolean
  triggerLabel: string
  triggerIcon: React.ReactNode
  triggerVariant: 'default' | 'outline' | 'destructive'
  title: string
  description: string
  confirmLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const setStatus = useSetUserStatus(userId)

  const valid = !reasonRequired || reason.trim().length >= 3

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="justify-start">
          {triggerIcon}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {email} — {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="status-reason">
            Reason{' '}
            {reasonRequired ? (
              <span className="text-destructive">(required)</span>
            ) : (
              '(optional)'
            )}
          </Label>
          <Textarea
            id="status-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Recorded in the audit log."
          />
          {reasonRequired && reason.length > 0 && reason.trim().length < 3 ? (
            <p className="text-xs text-destructive">Please give at least 3 characters.</p>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant={triggerVariant === 'default' ? 'default' : triggerVariant}
            disabled={!valid || setStatus.isPending}
            onClick={() =>
              setStatus.mutate(
                { status: target, reason: reason.trim() || undefined },
                {
                  onSuccess: () => {
                    setOpen(false)
                    setReason('')
                  },
                }
              )
            }
          >
            {setStatus.isPending ? 'Updating…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusPill({ status }: { status: string }) {
  const entry = STATUS_BADGE[status]
  return (
    <Badge
      variant="outline"
      className={entry?.className ?? 'border-border bg-muted text-muted-foreground'}
    >
      {entry?.label ?? status}
    </Badge>
  )
}

function Row({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children ?? value ?? '—'}</dd>
    </div>
  )
}

function capitalize(value: string): string {
  return value.length ? `${value[0]!.toUpperCase()}${value.slice(1)}` : value
}
