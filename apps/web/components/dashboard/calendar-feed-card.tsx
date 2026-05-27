'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/dashboard'
import { useCalendarFeed, useRegenerateCalendarFeed } from '@/lib/hooks/use-calendar'

/**
 * Subscribe-to-shoots iCal feed card. The token in the URL is the auth, so
 * regenerating it invalidates the old link. Shared by artist + caster settings.
 */
export function CalendarFeedCard() {
  const feed = useCalendarFeed()
  const regenerate = useRegenerateCalendarFeed()
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!feed.data?.url) return
    try {
      await navigator.clipboard.writeText(feed.data.url)
      setCopied(true)
      toast.success('Calendar link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Couldn’t copy — select and copy the link manually')
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarClock className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-medium text-foreground">Calendar subscription</h3>
          <p className="text-sm text-muted-foreground">
            Subscribe in Google Calendar, Apple Calendar, or Outlook to see your confirmed shoots.
          </p>
        </div>
      </div>

      {feed.isPending ? (
        <LoadingState rows={1} />
      ) : feed.isError ? (
        <p className="text-sm text-destructive">Couldn’t load your calendar link.</p>
      ) : (
        <div className="flex items-center gap-2">
          <Input readOnly value={feed.data?.url ?? ''} className="bg-muted font-mono text-xs" />
          <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy link">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => regenerate.mutate()}
        disabled={regenerate.isPending}
        className="text-muted-foreground"
      >
        <RefreshCw className="mr-1.5 h-4 w-4" /> Regenerate link
      </Button>
    </Card>
  )
}
