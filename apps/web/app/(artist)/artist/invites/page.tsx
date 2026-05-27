'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, MapPin, ArrowUpRight } from 'lucide-react'
import type { InviteStatus } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  LockedField,
} from '@/components/dashboard'
import type { InviteWithJob } from '@/lib/api/invites'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useMyInvites, useAcceptInvite, useDeclineInvite } from '@/lib/hooks/use-invites'

const TABS: { value: string; label: string; status: InviteStatus }[] = [
  { value: 'pending', label: 'Pending', status: 'pending' },
  { value: 'accepted', label: 'Accepted', status: 'accepted' },
  { value: 'declined', label: 'Declined', status: 'declined' },
]

export default function ArtistInvitesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        description="Casters who’ve invited you to apply for their shoots."
      />

      <Tabs defaultValue="pending">
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <InvitesTabPanel status={t.status} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function InvitesTabPanel({ status }: { status: InviteStatus }) {
  const { data, isPending, isError, refetch } = useMyInvites({ status })

  if (isPending) return <LoadingState rows={3} />
  if (isError) {
    return (
      <ErrorState message="We couldn’t load your invitations." onRetry={() => void refetch()} />
    )
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No invitations here"
        description="When a caster invites you to apply for a shoot, it’ll appear here."
        icon={<Mail className="h-6 w-6" />}
      />
    )
  }

  return (
    <ul className="space-y-3">
      {data.map((invite) => (
        <li key={invite.id}>
          <InviteCard invite={invite} />
        </li>
      ))}
    </ul>
  )
}

function InviteCard({ invite }: { invite: InviteWithJob }) {
  const isPending = invite.status === 'pending'

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-medium text-foreground">
              {invite.job?.title ?? 'A caster invited you to apply'}
            </h2>
            <StatusBadge status={invite.status} />
          </div>
          {invite.message ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {invite.message}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No message was included.</p>
          )}
        </div>
        {invite.job ? (
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href={`/artist/jobs/${invite.jobId}`}>
              View job <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" />
        <LockedField reason="Revealed once you’re booked" />
      </div>

      {isPending ? (
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <DeclineDialog inviteId={invite.id} jobTitle={invite.job?.title ?? 'this shoot'} />
          <AcceptButton inviteId={invite.id} jobId={invite.jobId} />
        </div>
      ) : null}
    </Card>
  )
}

function AcceptButton({ inviteId, jobId }: { inviteId: string; jobId: string }) {
  const router = useRouter()
  const accept = useAcceptInvite()

  return (
    <Button
      disabled={accept.isPending}
      onClick={() =>
        accept.mutate(inviteId, {
          onSuccess: () => router.push(`/artist/jobs/${jobId}/bid`),
        })
      }
    >
      {accept.isPending ? 'Accepting…' : 'Accept & bid'}
    </Button>
  )
}

function DeclineDialog({ inviteId, jobTitle }: { inviteId: string; jobTitle: string }) {
  const [open, setOpen] = useState(false)
  const decline = useDeclineInvite()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive">
          Decline
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline this invitation?</DialogTitle>
          <DialogDescription>
            You’re declining the invite to apply for “{jobTitle}”. The caster will be notified.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep it</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={decline.isPending}
            onClick={() => decline.mutate(inviteId, { onSuccess: () => setOpen(false) })}
          >
            {decline.isPending ? 'Declining…' : 'Decline invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
