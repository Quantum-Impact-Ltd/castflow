interface StepTipsProps {
  heading: string
  bullets: ReadonlyArray<string>
}

/**
 * Right-rail contextual tips shown beside each onboarding step. Presentational
 * only — each flow keeps its own copy and passes the resolved tips in. (#5.)
 */
export function StepTips({ heading, bullets }: StepTipsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-tight">{heading}</h3>
      <ul className="text-muted-foreground space-y-2 text-sm leading-relaxed">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-foreground/40 mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-current" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
