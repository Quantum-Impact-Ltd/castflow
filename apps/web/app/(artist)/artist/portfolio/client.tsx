'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { uploadFile } from '@/lib/api/uploads'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'

const MIN_PHOTOS = 3

export function PortfolioClient() {
  const profile = useMyArtistProfile()
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  // 0–100 progress on the in-flight R2 PUT. Surfaces as an inline bar +
  // percentage label so the artist knows the upload isn't stuck.
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setProgress(0)
    try {
      await uploadFile(file, 'portfolio_photo', {
        onProgress: (p) => setProgress(p),
      })
      void qc.invalidateQueries({ queryKey: queryKeys.artist.me() })
      toast.success('Photo uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  if (profile.isPending) return <LoadingState rows={4} />
  if (profile.isError || !profile.data) return <ErrorState onRetry={() => profile.refetch()} />

  const items = (profile.data.portfolioItems ?? []) as Array<{
    id: string
    url: string
    caption: string | null
    isPrimary?: boolean
    isApproved?: boolean
  }>

  const count = items.length
  const gateMet = count >= MIN_PHOTOS
  const gatePct = Math.min(100, Math.round((count / MIN_PHOTOS) * 100))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Upload photos and videos for casters to review."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
                e.target.value = ''
              }}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? `Uploading ${progress}%` : 'Upload photo'}
            </Button>
          </>
        }
      />

      {/* In-flight upload progress — slim hairline bar so it doesn't shout. */}
      {uploading ? (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Uploading photo"
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {/* Minimum-photo gate — shows progress to 3, gates the rest of onboarding. */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium">
              {gateMet
                ? 'You meet the portfolio minimum'
                : `Add ${MIN_PHOTOS - count} more ${
                    MIN_PHOTOS - count === 1 ? 'photo' : 'photos'
                  } to meet the minimum`}
            </p>
            <span className="text-muted-foreground text-xs tabular-nums">
              {count} / {MIN_PHOTOS}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={MIN_PHOTOS}
            aria-valuenow={Math.min(count, MIN_PHOTOS)}
            aria-label="Portfolio minimum progress"
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                'h-full transition-[width] duration-300 ease-out',
                gateMet ? 'bg-emerald-500' : 'bg-primary',
              )}
              style={{ width: `${gatePct}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Casters need at least one headshot and one full-body shot. Aim for {MIN_PHOTOS}+ photos
            that show your range.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No photos yet. Upload your first one with the button above.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="border-border relative aspect-square overflow-hidden rounded-md border"
                >
                  <img src={p.url} alt={p.caption ?? ''} className="size-full object-cover" />
                  {!p.isApproved ? (
                    <div className="absolute bottom-1 left-1 rounded bg-amber-500 px-1.5 py-0.5 text-xs text-amber-50">
                      Pending review
                    </div>
                  ) : null}
                  {p.isPrimary ? (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">
                      Primary
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
