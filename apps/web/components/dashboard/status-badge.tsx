import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Variant = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const styles: Record<Variant, string> = {
  neutral: 'bg-muted text-foreground/80 border-transparent',
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900',
  success:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
  danger:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900',
}

const mapping: Record<string, Variant> = {
  // Generic
  pending: 'warning',
  pending_payment: 'warning',
  pending_signatures: 'warning',
  active: 'success',
  confirmed: 'success',
  completed: 'success',
  released: 'success',
  approved: 'success',
  accepted: 'success',
  fully_signed: 'success',
  partially_signed: 'info',
  shortlisted: 'info',
  open: 'info',
  under_review: 'info',
  draft: 'neutral',
  filled: 'neutral',
  expired: 'neutral',
  closed: 'neutral',
  withdrawn: 'neutral',
  refunded: 'neutral',
  partially_refunded: 'warning',
  rejected: 'danger',
  cancelled: 'danger',
  suspended: 'danger',
  banned: 'danger',
  disputed: 'danger',
  voided: 'danger',
  escalated: 'danger',
  declined: 'danger',
  held: 'info',
  awaiting_payment: 'warning',
  resolved: 'success',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant: Variant = mapping[status] ?? 'neutral'
  const label = status.replace(/_/g, ' ')
  return (
    <Badge variant="outline" className={cn(styles[variant], 'capitalize', className)}>
      {label}
    </Badge>
  )
}
