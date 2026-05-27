'use client'

import { useState, type ReactNode } from 'react'
import { Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMyJobs } from '@/lib/hooks/use-jobs'
import { useInviteToJob } from '@/lib/hooks/use-invites'

interface InviteToJobDialogProps {
  artistId: string
  artistName?: string
  /** Custom trigger; defaults to an outline "Invite to apply" button. */
  children?: ReactNode
}

/**
 * Invite an artist to apply to one of the caster's own jobs. Only active jobs
 * are offered. Used from talent search, the shortlist, and artist profiles.
 */
export function InviteToJobDialog({ artistId, artistName, children }: InviteToJobDialogProps) {
  const [open, setOpen] = useState(false)
  const [jobId, setJobId] = useState('')
  const [message, setMessage] = useState('')
  const jobs = useMyJobs({ limit: 100 })
  const invite = useInviteToJob()

  const activeJobs = (jobs.data ?? []).filter((j) => j.status === 'active')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <Send className="mr-1.5 h-4 w-4" /> Invite to apply
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite {artistName ?? 'this artist'} to apply</DialogTitle>
          <DialogDescription>
            Send a direct invitation to one of your active jobs. They’ll be notified and can submit
            a bid.
          </DialogDescription>
        </DialogHeader>

        {jobs.isPending ? (
          <p className="text-sm text-muted-foreground">Loading your jobs…</p>
        ) : activeJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no active jobs to invite to. Post a job first.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Job</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job" />
                </SelectTrigger>
                <SelectContent>
                  {activeJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-message">Message (optional)</Label>
              <Textarea
                id="invite-message"
                rows={3}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell them why you’d love them for this shoot."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!jobId || invite.isPending}
            onClick={() =>
              invite.mutate(
                { jobId, artistId, ...(message.trim() ? { message: message.trim() } : {}) },
                { onSuccess: () => setOpen(false) }
              )
            }
          >
            {invite.isPending ? 'Sending…' : 'Send invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
