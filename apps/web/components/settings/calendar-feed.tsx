'use client'

import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/dashboard'
import { getCalendarFeedUrl, regenerateCalendarFeed } from '@/lib/api/calendar'
import { queryKeys } from '@/lib/query-keys'

export function CalendarFeedCard() {
  const qc = useQueryClient()
  const feed = useQuery({
    queryKey: queryKeys.calendar.feed(),
    queryFn: ({ signal }) => getCalendarFeedUrl({ signal }),
  })
  const regen = useMutation({
    mutationFn: () => regenerateCalendarFeed(),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.calendar.feed(), data)
      toast.success('Feed regenerated — old URL is now invalid')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calendar subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Add this URL to Apple, Google, or Outlook calendar to auto-sync your shoots.
        </p>
        {feed.isPending ? (
          <LoadingState rows={1} />
        ) : feed.data ? (
          <Input readOnly value={feed.data.url} />
        ) : null}
        <div className="flex gap-2">
          {feed.data ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(feed.data.url)
                toast.success('Copied')
              }}
            >
              Copy URL
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => regen.mutate()}
            disabled={regen.isPending}
          >
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
