'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState } from '@/components/dashboard'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { EditClient } from './edit-client'

export default function ArtistProfileEditPage() {
  const profile = useMyArtistProfile()

  return (
    <div className="space-y-6">
      <Link
        href="/artist/profile"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to profile
      </Link>

      <PageHeader
        title="Edit profile"
        description="Update your details, stats, and portfolio. Each section saves on its own."
      />

      {profile.isPending ? (
        <LoadingState rows={4} variant="detail" />
      ) : profile.isError || !profile.data ? (
        <ErrorState
          message="We couldn’t load your profile to edit."
          onRetry={() => void profile.refetch()}
        />
      ) : (
        <EditClient profile={profile.data} />
      )}
    </div>
  )
}
