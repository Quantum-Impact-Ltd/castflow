import { formatCurrency, cn } from '@/lib/utils'

interface MoneyProps {
  amount: number | string | null | undefined
  className?: string
}

/** Renders a GBP amount with tabular figures so columns line up. */
export function Money({ amount, className }: MoneyProps) {
  return <span className={cn('tabular-nums', className)}>{formatCurrency(amount)}</span>
}
