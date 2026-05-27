'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/dashboard'
import { TalentCard } from '@/components/dashboard/talent-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTalentSearch } from '@/lib/hooks/use-talent'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import type { TalentFilters } from '@/lib/api/talent'

type SortKey = 'most_reviewed' | 'highest_rated' | 'most_completed' | 'newest'

export default function TalentSearchPage() {
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')
  const [artistType, setArtistType] = useState<'all' | 'model' | 'actor'>('all')
  const [experience, setExperience] = useState<'all' | 'new_face' | 'semi_pro' | 'professional'>('all')
  const [minRating, setMinRating] = useState<'0' | '3' | '4' | '4.5'>('0')
  const [sort, setSort] = useState<SortKey>('most_reviewed')

  const debouncedQ = useDebouncedValue(q, 250)
  const debouncedCity = useDebouncedValue(city, 250)

  const filters: TalentFilters = {
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(debouncedCity ? { city: debouncedCity } : {}),
    ...(artistType !== 'all' ? { artistType } : {}),
    ...(experience !== 'all' ? { experienceLevel: experience } : {}),
  }

  const { data, isPending, isError, refetch } = useTalentSearch(filters)

  const results = useMemo(() => {
    const min = Number(minRating)
    const list = (data ?? []).filter((a) => (min === 0 ? true : (a.ratingAvg ?? 0) >= min))
    const sorted = [...list]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'highest_rated':
          return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0)
        case 'most_completed':
          return (b.jobsCompleted ?? 0) - (a.jobsCompleted ?? 0)
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'most_reviewed':
        default:
          return (b.ratingCount ?? 0) - (a.ratingCount ?? 0)
      }
    })
    return sorted
  }, [data, minRating, sort])

  const clearAll = () => {
    setQ('')
    setCity('')
    setArtistType('all')
    setExperience('all')
    setMinRating('0')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Talent search" description="Browse approved, available artists." />

      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="q">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="q" placeholder="Name or keyword" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="talent-city">City</Label>
          <Input id="talent-city" placeholder="Any city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={artistType} onValueChange={(v) => setArtistType(v as typeof artistType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="model">Model</SelectItem>
              <SelectItem value="actor">Actor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Experience</Label>
          <Select value={experience} onValueChange={(v) => setExperience(v as typeof experience)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any experience</SelectItem>
              <SelectItem value="new_face">New face</SelectItem>
              <SelectItem value="semi_pro">Semi-pro</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Min rating</Label>
          <Select value={minRating} onValueChange={(v) => setMinRating(v as typeof minRating)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any rating</SelectItem>
              <SelectItem value="3">3.0+</SelectItem>
              <SelectItem value="4">4.0+</SelectItem>
              <SelectItem value="4.5">4.5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Sort by</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="most_reviewed">Most reviewed</SelectItem>
              <SelectItem value="highest_rated">Highest rated</SelectItem>
              <SelectItem value="most_completed">Most jobs completed</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <LoadingState variant="grid" rows={8} />
      ) : isError ? (
        <ErrorState message="We couldn’t load the talent directory." onRetry={() => void refetch()} />
      ) : results.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? 'artist' : 'artists'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((artist) => (
              <TalentCard key={artist.id} artist={artist} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No artists match"
          description="Try widening your filters."
          icon={<Search className="h-6 w-6" />}
          action={
            <Button variant="outline" size="sm" onClick={clearAll}>
              <X className="mr-1.5 h-4 w-4" /> Clear filters
            </Button>
          }
        />
      )}
    </div>
  )
}
