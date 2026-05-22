interface Stat {
  value: number
  prefix?: string
  suffix?: string
  label: string
  sublabel?: string
}

// Honest pre-launch numbers — swap with real platform figures when available.
const STATS: Stat[] = [
  {
    value: 247,
    label: 'Verified UK artists',
    sublabel: 'ID + portfolio checked',
  },
  {
    value: 11,
    label: 'Shoots posted this week',
    sublabel: 'Live across the platform',
  },
  {
    value: 23,
    label: 'Bookings this month',
    sublabel: 'Paid, contracted, completed',
  },
  {
    value: 48,
    suffix: 'h',
    label: 'Auto payout window',
    sublabel: 'No artist chases an invoice',
  },
]

export function NumbersStripSection() {
  return (
    <section className="w-full border-b border-border/60 bg-[var(--surface-50)]">
      <div className="mx-auto w-full max-w-[90rem] px-6 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground">
            <span
              className="animate-live-pulse inline-block h-2 w-2 rounded-full bg-primary"
              aria-hidden
            />
            Live · The platform right now
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            As of {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-3 bg-background p-8 lg:p-10"
            >
              <p className="text-5xl font-medium tracking-[-0.03em] text-foreground lg:text-6xl">
                {stat.prefix ? <span>{stat.prefix}</span> : null}
                <span className="font-medium text-foreground">{stat.value}</span>
                {stat.suffix ? <span>{stat.suffix}</span> : null}
              </p>
              <dt className="text-base font-medium text-foreground">
                {stat.label}
              </dt>
              {stat.sublabel ? (
                <dd className="text-sm text-muted-foreground">{stat.sublabel}</dd>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
