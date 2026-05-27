'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, Copy, Check, Download, Eye } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { ProfileSummary } from '../page'

export default function ArtistProfilePreviewPage() {
  const profile = useMyArtistProfile()
  const [copied, setCopied] = useState(false)

  if (profile.isPending) return <LoadingState rows={3} variant="detail" />
  if (profile.isError || !profile.data) {
    return (
      <ErrorState
        message="We couldn’t load your profile preview."
        onRetry={() => void profile.refetch()}
      />
    )
  }

  const me = profile.data
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/artists/${me.id}` : ''
  const compCardUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/artists/${me.id}/comp-card?download=1`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Profile link copied to clipboard')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Couldn’t copy the link — copy it manually instead.')
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/artist/profile"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to profile
      </Link>

      <PageHeader
        title="Public preview"
        description="Share your profile and download your comp card."
      />

      <Card className="flex items-start gap-3 border-[var(--brand-200)] bg-[var(--brand-50)] p-4">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-700)]" />
        <p className="text-sm text-[var(--brand-700)]">
          This is how casters see your profile. Sensitive details like contact info stay
          hidden until a booking is confirmed.
        </p>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="share-url">Shareable URL</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="share-url" readOnly value={shareUrl} className="bg-muted font-mono text-sm" />
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" /> Copy link
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            A one-page comp card with your headline stats and key shots.
          </p>
          <Button asChild variant="outline" className="shrink-0">
            <a href={compCardUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-1.5 h-4 w-4" /> Download comp card
            </a>
          </Button>
        </div>
      </Card>

      <ProfileSummary profile={me} />
    </div>
  )
}
