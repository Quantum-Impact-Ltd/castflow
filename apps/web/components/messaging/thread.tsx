'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorState, LoadingState } from '@/components/dashboard'
import { useMarkThreadRead, useMessages, useSendMessage } from '@/lib/hooks/use-messages'

interface MessageThreadProps {
  threadId: string
  backHref: string
}

export function MessageThread({ threadId, backHref }: MessageThreadProps) {
  const messages = useMessages(threadId)
  const send = useSendMessage(threadId)
  const markRead = useMarkThreadRead(threadId)
  const [content, setContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    markRead.mutate()
  }, [threadId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.data])

  if (messages.isPending) return <LoadingState rows={6} />
  if (messages.isError) return <ErrorState onRetry={() => messages.refetch()} />

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Conversation</h1>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.data?.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">
              No messages yet — say hello.
            </p>
          ) : (
            messages.data?.map((m) => (
              <div key={m.id} className="space-y-1">
                <div className="bg-muted inline-block max-w-[80%] rounded-md p-2 text-sm whitespace-pre-wrap">
                  {m.content}
                </div>
                {m.isFlagged ? (
                  <div className="text-amber-600 text-xs">
                    Contact details may have been redacted.
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
        <CardContent className="border-border border-t pt-3">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!content.trim()) return
              await send.mutateAsync(content)
              setContent('')
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Type a message…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button type="submit" size="icon" disabled={send.isPending || !content.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
          <p className="text-muted-foreground mt-2 text-xs">
            Sharing personal contact details before booking is against our terms.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
