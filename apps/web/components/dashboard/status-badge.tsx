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

// Native `title` tooltips — accessible without a tooltip provider. The map
// covers every status referenced across artist/caster/admin lists so users
// can hover to see what each one actually means before they click in.
const tooltip: Record<string, string> = {
  draft: 'Not yet published. Only you can see this.',
  open: 'Accepting bids from artists.',
  under_review: 'Submitted and waiting on an admin reviewer.',
  pending: 'Action required by you or the other party.',
  pending_payment: 'Waiting for the caster to confirm payment.',
  pending_signatures: 'Contract issued — waiting for both parties to sign.',
  partially_signed: 'Contract signed by one party; the other has not signed yet.',
  fully_signed: 'Both parties have signed. Shoot location is now revealed.',
  shortlisted: 'You have been shortlisted on this job — messaging is unlocked.',
  awaiting_payment: 'Escrow is pending — funds have not yet been captured.',
  active: 'Live on the platform.',
  confirmed: 'Booking is confirmed by both sides.',
  accepted: 'Bid accepted — the booking is being created.',
  approved: 'Approved by an admin.',
  completed: 'Shoot is done.',
  released: 'Escrow released. The artist has been paid.',
  resolved: 'Dispute has been resolved.',
  refunded: 'Payment was refunded to the caster.',
  partially_refunded: 'Part of the payment was refunded.',
  filled: 'Headcount is full — no more bids accepted.',
  expired: 'Closed automatically because the deadline passed.',
  closed: 'No longer accepting bids.',
  withdrawn: 'Withdrawn by the artist.',
  rejected: 'Declined — see the message for next steps.',
  cancelled: 'Cancelled. A cancellation fee may apply if under 48 hours of the shoot.',
  declined: 'The bid was declined.',
  suspended: 'Account on hold pending Trust & Safety review.',
  banned: 'Account banned. Contact support if you believe this is an error.',
  disputed: 'A dispute has been raised within the 72-hour window.',
  escalated: 'Escalated to an admin for review.',
  voided: 'Voided. No further action will be taken.',
  held: 'Funds are held in escrow until the shoot completes.',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant: Variant = mapping[status] ?? 'neutral'
  const label = status.replace(/_/g, ' ')
  const description = tooltip[status]
  return (
    <Badge
      variant="outline"
      className={cn(styles[variant], 'capitalize', className)}
      title={description}
    >
      {label}
    </Badge>
  )
}
