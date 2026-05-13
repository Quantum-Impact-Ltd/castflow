'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { formatDate } from '@/lib/utils'

export function ProfileViewClient() {
  const profile = useMyArtistProfile()
  if (profile.isPending) return <LoadingState rows={5} />
  if (profile.isError || !profile.data) return <ErrorState onRetry={() => profile.refetch()} />
  const p = profile.data
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${p.firstName} ${p.lastName}`}
        description={`${p.artistType === 'model' ? 'Model' : 'Actor'} · ${p.city ?? '—'}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/artist/profile/edit">Edit profile</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/artist/profile/stats">Edit stats</Link>
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Approval status</div>
            <StatusBadge status={p.approvalStatus} />
          </div>
          <div>
            <div className="text-muted-foreground text-xs">ID verified</div>
            <StatusBadge status={p.idVerified ? 'active' : 'pending'} />
          </div>
          <div>
            <div className="text-muted-foreground text-xs">DOB</div>
            <div>{p.dob ? formatDate(p.dob) : '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Experience</div>
            <div className="capitalize">{p.experienceLevel?.replace(/_/g, ' ') ?? '—'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-muted-foreground text-xs">Bio</div>
            <p className="whitespace-pre-wrap">{p.bio ?? '—'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
