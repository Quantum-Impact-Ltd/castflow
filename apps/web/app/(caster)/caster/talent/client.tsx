'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/dashboard'
import { useTalentSearch } from '@/lib/hooks/use-talent'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'

export function CasterTalentClient() {
  const [q, setQ] = useState('')
  const [type, setType] = useState<'model' | 'actor' | 'any'>('any')
  const [city, setCity] = useState('')

  // Debounce free-text inputs so the talent-search query doesn't fire on
  // every keystroke. The select stays sync — discrete choices don't burst.
  const debouncedQ = useDebouncedValue(q, 300)
  const debouncedCity = useDebouncedValue(city, 300)

  const filters: Parameters<typeof useTalentSearch>[0] = {
    limit: 50,
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(type !== 'any' ? { artistType: type } : {}),
    ...(debouncedCity ? { city: debouncedCity } : {}),
  }
  const talent = useTalentSearch(filters)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find talent"
        description="Browse approved artists and invite them directly to your job."
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="q">Search</Label>
            <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="model">Model</SelectItem>
                <SelectItem value="actor">Actor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="London" />
          </div>
        </CardContent>
      </Card>

      {talent.isPending ? (
        <LoadingState rows={5} />
      ) : talent.isError ? (
        <ErrorState onRetry={() => talent.refetch()} />
      ) : !talent.data?.length ? (
        <EmptyState title="No matching artists" description="Try widening your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {talent.data.map((a) => {
            const primary = a.portfolioItems?.find((p) => p.isPrimary) ?? a.portfolioItems?.[0]
            return (
              <li key={a.id}>
                <Link href={`/artists/${a.id}`}>
                  <Card className="hover:border-primary/40 overflow-hidden transition-colors">
                    {primary ? (
                      <img src={primary.url} alt="" className="aspect-[4/5] w-full object-cover" />
                    ) : (
                      <div className="bg-muted aspect-[4/5] w-full" />
                    )}
                    <CardContent className="space-y-1 pt-4">
                      <div className="font-medium text-sm">
                        {a.firstName} {a.lastName ?? ''}
                      </div>
                      <div className="text-muted-foreground text-xs capitalize">
                        {a.artistType} · {a.city ?? '–'}
                      </div>
                      <div className="pt-1">
                        <StatusBadge status={a.availabilityStatus} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
