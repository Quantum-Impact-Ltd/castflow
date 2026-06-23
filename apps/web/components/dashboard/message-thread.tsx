'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Send, Flag, Lock, AlertTriangle } from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import { LoadingState, ErrorState, EmptyState } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import {
  useMessages,
  useSendMessage,
  useMarkThreadRead,
  useReportThread,
} from '@/lib/hooks/use-messages'
import { useThreadSocket } from '@/lib/hooks/use-thread-socket'
import { useAuthSession } from '@/providers/session-provider'
import type { ReportThreadReason } from '@/lib/api/messages'
import { cn } from '@/lib/utils'

interface MessageThreadViewProps {
  threadId: string
  backHref: string
}

export function MessageThreadView({ threadId, backHref }: MessageThreadViewProps) {
  const { session } = useAuthSession()
  const myUserId = session?.user.id
  const messages = useMessages(threadId)
  const send = useSendMessage(threadId)
  const markRead = useMarkThreadRead(threadId)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useThreadSocket(threadId)

  // Mark the thread read once on mount.
  const markedRef = useRef(false)
  useEffect(() => {
    if (!markedRef.current) {
      markedRef.current = true
      markRead.mutate()
    }
  }, [threadId, markRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.data?.length])

  const locked =
    messages.isError &&
    messages.error instanceof ApiError &&
    messages.error.code === 'THREAD_LOCKED'

  function submit() {
    const content = draft.trim()
    if (!content) return
    send.mutate(content, { onSuccess: () => setDraft('') })
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Inbox
        </Link>
        {!locked ? <ReportDialog threadId={threadId} /> : null}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.isPending ? (
          <LoadingState rows={4} />
        ) : locked ? (
          <EmptyState
            title="Messaging is locked"
            description="This conversation unlocks once the caster shortlists your bid."
            icon={<Lock className="h-6 w-6" />}
          />
        ) : messages.isError ? (
          <ErrorState onRetry={() => void messages.refetch()} />
        ) : messages.data && messages.data.length > 0 ? (
          <ul className="space-y-3">
            {messages.data.map((m) => {
              const mine = m.senderId === myUserId
              return (
                <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[75%] space-y-1')}>
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2 text-sm',
                        mine
                          ? 'rounded-br-sm bg-primary text-primary-foreground'
                          : 'rounded-bl-sm bg-muted text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                    {m.isFlagged ? (
                      <p className="flex items-center gap-1 text-[11px] text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        {m.flagReason
                          ? `Flagged — ${m.flagReason}`
                          : 'Flagged — sharing personal contact details off-platform breaches our terms.'}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
            <div ref={bottomRef} />
          </ul>
        ) : (
          <EmptyState
            title="No messages yet"
            description="Say hello and discuss the shoot details."
            icon={<Send className="h-6 w-6" />}
          />
        )}
      </div>

      {!locked ? (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              rows={2}
              maxLength={2000}
              placeholder="Write a message…"
              className="resize-none"
            />
            <Button
              onClick={submit}
              disabled={send.isPending || !draft.trim()}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Keep it on-platform — don’t share phone numbers or personal emails before a booking is
            confirmed. Messages are stored and used to resolve disputes.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function ReportDialog({ threadId }: { threadId: string }) {
  const report = useReportThread(threadId)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportThreadReason>('harassment')
  const [detail, setDetail] = useState('')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="mr-1.5 h-4 w-4" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this conversation</DialogTitle>
          <DialogDescription>
            Flag harassment, off-platform contact attempts, or other terms violations. Our team
            reviews reports within 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReportThreadReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="harassment">Harassment or abuse</SelectItem>
                <SelectItem value="off_platform">Trying to take it off-platform</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-detail">Details (optional)</Label>
            <Textarea
              id="report-detail"
              rows={3}
              maxLength={500}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Anything that helps us review this faster."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              report.mutate(
                { reason, ...(detail.trim() ? { detail: detail.trim() } : {}) },
                { onSuccess: () => setOpen(false) }
              )
            }
            disabled={report.isPending}
          >
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
