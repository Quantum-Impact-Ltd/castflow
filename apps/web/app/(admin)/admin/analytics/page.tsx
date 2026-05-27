'use client'

import {
  Users,
  ClipboardList,
  Scale,
  PoundSterling,
  CalendarCheck,
  TrendingUp,
  Briefcase,
  Timer,
} from 'lucide-react'
import {
  PageHeader,
  StatCard,
  LoadingState,
  ErrorState,
  Money,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { useAdminAnalytics } from '@/lib/hooks/use-admin'

interface WeeklyPoint {
  weekStart: string
  count: number
}

// The /summary endpoint currently returns totals; the weekly series is a
// planned addition, so the arrays may be missing or empty at runtime.
function hasSeries(series: WeeklyPoint[] | undefined | null): series is WeeklyPoint[] {
  return Array.isArray(series) && series.length > 0
}

function formatWeek(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(d)
}

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  // Accept either a 0–1 fraction or an already-scaled percentage.
  const pct = value <= 1 ? value * 100 : value
  return `${pct.toFixed(1)}%`
}

function formatTimeToBooking(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || !Number.isFinite(hours)) return '—'
  if (hours < 48) return `${Math.round(hours)}h`
  return `~${Math.round(hours / 24)} days`
}

export default function AdminAnalyticsPage() {
  const { data, isPending, isError, refetch } = useAdminAnalytics()

  if (isPending) return <LoadingState rows={5} variant="grid" />
  if (isError || !data) {
    return (
      <ErrorState
        message="We couldn’t load analytics right now."
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Platform health, growth, and marketplace efficiency."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Reporting
          </span>
        }
      />

      {/* ── Headline totals ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={data.totalUsers}
          icon={Users}
          hint={`${data.totalArtists} artists · ${data.totalCasters} casters`}
        />
        <StatCard
          label="Pending applications"
          value={data.pendingApplications}
          icon={ClipboardList}
          accent={data.pendingApplications > 0}
        />
        <StatCard
          label="Open disputes"
          value={data.openDisputes}
          icon={Scale}
          accent={data.openDisputes > 0}
        />
        <StatCard
          label="Revenue this month"
          value={<Money amount={data.revenueThisMonth} />}
          icon={PoundSterling}
        />
        <StatCard
          label="Bookings this week"
          value={data.bookingsThisWeek}
          icon={CalendarCheck}
        />
      </div>

      {/* ── Trends ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Trends</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <BarChartCard
            title="New users per week"
            icon={Users}
            series={data.newUsersWeekly}
          />
          <BarChartCard
            title="Jobs posted per week"
            icon={Briefcase}
            series={data.jobsWeekly}
          />
        </div>
      </section>

      {/* ── Marketplace efficiency ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Marketplace efficiency</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Booking fill rate"
            value={formatPct(data.bookingFillRate)}
            hint="Share of jobs that resulted in a booking."
            icon={CalendarCheck}
          />
          <MetricCard
            label="Dispute rate"
            value={formatPct(data.disputeRate)}
            hint="Share of bookings that ended in a dispute."
            icon={Scale}
          />
          <MetricCard
            label="Avg. time to booking"
            value={formatTimeToBooking(data.avgTimeToBookingHours)}
            hint="From job posted to booking confirmed."
            icon={Timer}
          />
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: typeof Scale
}) {
  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-3xl font-semibold tracking-[-0.02em] text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </Card>
  )
}

function BarChartCard({
  title,
  icon: Icon,
  series,
}: {
  title: string
  icon: typeof Users
  series: WeeklyPoint[] | undefined | null
}) {
  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {hasSeries(series) ? <BarChart series={series} /> : <NoSeries />}
    </Card>
  )
}

function NoSeries() {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
      Weekly reporting data isn’t available yet.
    </p>
  )
}

// Plain CSS bar chart — no chart library is installed.
function BarChart({ series }: { series: WeeklyPoint[] }) {
  const max = Math.max(...series.map((p) => p.count), 1)

  return (
    <div className="flex items-end gap-2" style={{ height: 160 }}>
      {series.map((point) => {
        const heightPct = max > 0 ? (point.count / max) * 100 : 0
        return (
          <div key={point.weekStart} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-medium tabular-nums text-foreground">{point.count}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-[var(--brand-500)] transition-[height]"
                style={{ height: `${Math.max(heightPct, 2)}%` }}
                title={`${point.count} · week of ${formatWeek(point.weekStart)}`}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {formatWeek(point.weekStart)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
