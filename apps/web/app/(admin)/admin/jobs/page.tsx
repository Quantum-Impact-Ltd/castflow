'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ClipboardList } from 'lucide-react'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminJobs } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'filled', label: 'Filled' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminJobsPage() {
  const router = useRouter()
  const [status, setStatus] = useState<string>('all')
  const [query, setQuery] = useState('')

  const filters = status === 'all' ? {} : { status }
  const { data, isPending, isError, refetch } = useAdminJobs(filters)

  const jobs = useMemo(() => {
    const list = data ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((job) => {
      const haystack = [job.title, job.casterId, job.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [data, query])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Every shoot posted on the platform. Remove jobs that violate the rules."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, caster ID or category"
            className="pl-9"
            aria-label="Search jobs"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <LoadingState rows={6} />
      ) : isError ? (
        <ErrorState message="We couldn’t load jobs." onRetry={() => void refetch()} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title={query ? 'No matching jobs' : 'No jobs found'}
          description={
            query
              ? 'Try a different search term or status filter.'
              : 'No jobs match the selected status.'
          }
          icon={<ClipboardList className="h-6 w-6" />}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shoot date</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/jobs/${job.id}`)}
                >
                  <TableCell className="max-w-xs">
                    <div className="truncate font-medium text-foreground">{job.title}</div>
                    {job.caster?.companyName ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {job.caster.companyName}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{job.category}</TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(job.shootDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(job.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
