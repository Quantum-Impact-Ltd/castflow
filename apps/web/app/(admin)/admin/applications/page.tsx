'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, MapPin, ArrowRight, Search } from 'lucide-react'
import type { ArtistType } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApplications } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

type StatusFilter = 'pending' | 'approved' | 'rejected'
type TypeFilter = 'all' | ArtistType

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'model', label: 'Models' },
  { value: 'actor', label: 'Actors' },
]

export default function AdminApplicationsPage() {
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [type, setType] = useState<TypeFilter>('all')
  const [city, setCity] = useState('')

  // The query swaps whenever the status filter changes; type + city are
  // applied client-side over the returned list.
  const { data, isPending, isError, refetch } = useApplications({ status })

  const filtered = useMemo(() => {
    const cityTerm = city.trim().toLowerCase()
    return (data ?? []).filter((app) => {
      if (type !== 'all' && app.artistType !== type) return false
      if (cityTerm && !app.city.toLowerCase().includes(cityTerm)) return false
      return true
    })
  }, [data, type, city])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application queue"
        description="Review and approve new artists before they reach the platform."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => setType(v as TypeFilter)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filter by artist type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Filter by city"
            className="pl-9"
            aria-label="Filter by city"
          />
        </div>
      </div>

      {isPending ? (
        <LoadingState rows={5} />
      ) : isError ? (
        <ErrorState
          message="We couldn’t load the application queue."
          onRetry={() => void refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={status === 'pending' ? 'Queue clear' : 'Nothing here'}
          description={
            status === 'pending'
              ? 'No applications are waiting for review right now.'
              : 'No applications match the current filters.'
          }
          icon={<ClipboardList className="h-6 w-6" />}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((app) => (
            <li key={app.id}>
              <Link href={`/admin/applications/${app.id}`} className="block">
                <Card className="flex flex-col gap-3 p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {app.firstName} {app.lastName}
                      </span>
                      <Badge variant="secondary" className="capitalize">
                        {app.artistType}
                      </Badge>
                      <StatusBadge status={app.approvalStatus} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {app.city}
                      </span>
                      <span>Submitted {formatDate(app.createdAt)}</span>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center text-sm text-primary">
                    Review <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
