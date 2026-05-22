'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/dashboard'
import { usePublicJobs } from '@/lib/hooks/use-jobs'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { formatCurrency, formatDate } from '@/lib/utils'

export function JobFeed() {
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<string>('')

  // Debounce the free-text city filter; category is a Select (discrete), so
  // it can hit the API immediately on change.
  const debouncedCity = useDebouncedValue(city, 300)

  const jobs = usePublicJobs({
    ...(debouncedCity ? { city: debouncedCity } : {}),
    ...(category ? { category } : {}),
    limit: 50,
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. London"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v === 'any' ? '' : v)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="model">Model</SelectItem>
                <SelectItem value="actor">Actor</SelectItem>
                <SelectItem value="voiceover">Voiceover</SelectItem>
                <SelectItem value="extra">Extra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {jobs.isPending ? (
        <LoadingState rows={5} />
      ) : jobs.isError ? (
        <ErrorState onRetry={() => jobs.refetch()} />
      ) : !jobs.data?.length ? (
        <EmptyState title="No matching jobs" description="Try adjusting your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {jobs.data.map((job) => (
            <li key={job.id}>
              <Link href={`/artist/jobs/${job.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <p className="text-muted-foreground text-sm capitalize">
                        {job.category} · {job.locationCity} · Shoot {formatDate(job.shootDate)}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm">
                    <span className="capitalize">
                      {job.paymentType === 'hourly' ? 'Hourly' : 'Fixed'} ·{' '}
                      {job.rateSetBy === 'open'
                        ? 'Open to bids'
                        : job.rateAmount
                          ? formatCurrency(job.rateAmount)
                          : '—'}
                    </span>
                    <span className="text-muted-foreground">
                      {job.headcountFilled}/{job.headcountRequired} filled
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
