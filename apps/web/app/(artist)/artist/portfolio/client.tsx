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

export function PortfolioClient() {
  const profile = useMyArtistProfile()
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      await uploadFile(file, 'portfolio_photo')
      void qc.invalidateQueries({ queryKey: queryKeys.artist.me() })
      toast.success('Photo uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
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
              {uploading ? 'Uploading…' : 'Upload photo'}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You need at least 3 photos including a headshot and a full-body shot.
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
                    <div className="absolute bottom-1 left-1 bg-amber-500/90 text-white rounded px-1.5 py-0.5 text-xs">
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
