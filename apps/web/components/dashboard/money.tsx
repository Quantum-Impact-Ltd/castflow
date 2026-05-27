import { formatCurrency, cn } from '@/lib/utils'

interface MoneyProps {
  amount: number | string | null | undefined
  className?: string
}

/** Renders a GBP amount with tabular figures so columns line up. */
export function Money({ amount, className }: MoneyProps) {
  return <span className={cn('tabular-nums', className)}>{formatCurrency(amount)}</span>
}

interface CommissionBreakdownProps {
  gross: number | string | null | undefined
  commissionRate?: number | string | null
  commissionAmount: number | string | null | undefined
  net: number | string | null | undefined
  className?: string
}

/**
 * The gross → commission → net payout breakdown. Per PRD §11.2 the commission
 * is shown clearly at every step — never hidden. Used on bid confirmation,
 * booking detail, and the earnings dashboard.
 */
export function CommissionBreakdown({
  gross,
  commissionRate,
  commissionAmount,
  net,
  className,
}: CommissionBreakdownProps) {
  const ratePct =
    commissionRate === null || commissionRate === undefined ? null : Number(commissionRate)

  return (
    <dl className={cn('space-y-2 text-sm', className)}>
      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground">Gross rate</dt>
        <dd>
          <Money amount={gross} />
        </dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground">
          Platform commission{ratePct !== null ? ` (${ratePct}%)` : ''}
        </dt>
        <dd className="text-muted-foreground">
          −<Money amount={commissionAmount} />
        </dd>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2 font-medium text-foreground">
        <dt>Net payout</dt>
        <dd>
          <Money amount={net} />
        </dd>
      </div>
    </dl>
  )
}
