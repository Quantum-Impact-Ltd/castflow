// Maps every domain status string CastFlow can emit to a label, a colour
// variant, and a tooltip explaining what the status means. One component for
// BidStatus, BookingStatus, SubscriptionStatus, ContractStatus, DisputeStatus,
// JobStatus, ApprovalStatus and InviteStatus.

import { cn } from '@/lib/utils'

type Variant = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const VARIANT_CLASS: Record<Variant, string> = {
  neutral: 'bg-muted text-muted-foreground border-border',
  info: 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-destructive/10 text-destructive border-destructive/30',
}

interface Entry {
  label: string
  variant: Variant
  title: string
}

// Keyed by status string. Some strings are shared across enums but always
// carry the same meaning here.
const STATUS: Record<string, Entry> = {
  // Approval
  pending: { label: 'Pending', variant: 'warning', title: 'Awaiting a decision.' },
  approved: { label: 'Approved', variant: 'success', title: 'Approved and live.' },
  rejected: { label: 'Rejected', variant: 'danger', title: 'Not approved.' },
  // Bid
  shortlisted: {
    label: 'Shortlisted',
    variant: 'info',
    title: 'The caster shortlisted this bid — messaging is unlocked.',
  },
  accepted: { label: 'Accepted', variant: 'success', title: 'Accepted — a booking was created.' },
  withdrawn: { label: 'Withdrawn', variant: 'neutral', title: 'You withdrew this bid.' },
  expired: { label: 'Expired', variant: 'neutral', title: 'No longer active.' },
  // Job
  draft: { label: 'Draft', variant: 'neutral', title: 'Not yet published.' },
  active: { label: 'Active', variant: 'success', title: 'Live and accepting bids.' },
  filled: { label: 'Filled', variant: 'info', title: 'All spots are booked.' },
  cancelled: { label: 'Cancelled', variant: 'danger', title: 'Cancelled.' },
  closed: { label: 'Closed', variant: 'neutral', title: 'Closed to new bids.' },
  // Booking
  pending_contract: {
    label: 'Awaiting contract',
    variant: 'warning',
    title: 'Both parties must sign the contract to confirm the booking.',
  },
  confirmed: { label: 'Confirmed', variant: 'success', title: 'Booked — the contract is signed.' },
  completed: { label: 'Completed', variant: 'success', title: 'Shoot completed.' },
  disputed: {
    label: 'Disputed',
    variant: 'danger',
    title: 'A dispute is open and under review.',
  },
  // Subscription
  trialing: { label: 'Trialing', variant: 'info', title: 'Free trial in progress.' },
  past_due: {
    label: 'Past due',
    variant: 'danger',
    title: 'Payment failed — update your billing details to keep access.',
  },
  canceled: { label: 'Canceled', variant: 'neutral', title: 'Subscription canceled.' },
  incomplete: {
    label: 'Incomplete',
    variant: 'warning',
    title: 'Initial payment has not completed yet.',
  },
  unpaid: { label: 'Unpaid', variant: 'danger', title: 'Subscription unpaid.' },
  inactive: { label: 'No subscription', variant: 'neutral', title: 'No active subscription.' },
  // Contract
  pending_signatures: {
    label: 'Awaiting signatures',
    variant: 'warning',
    title: 'Neither party has signed yet.',
  },
  partially_signed: {
    label: 'Partially signed',
    variant: 'warning',
    title: 'One party has signed. Both must sign within 72 hours.',
  },
  fully_signed: {
    label: 'Fully signed',
    variant: 'success',
    title: 'Both parties signed — the shoot location is now revealed.',
  },
  voided: { label: 'Voided', variant: 'neutral', title: 'The contract was voided.' },
  // Dispute
  open: { label: 'Open', variant: 'danger', title: 'A new dispute awaiting review.' },
  under_review: { label: 'Under review', variant: 'warning', title: 'An admin is reviewing.' },
  resolved: { label: 'Resolved', variant: 'success', title: 'Resolved by an admin.' },
  escalated: { label: 'Escalated', variant: 'danger', title: 'Escalated for legal review.' },
  // Invite
  declined: { label: 'Declined', variant: 'neutral', title: 'You declined this invite.' },
}

interface StatusBadgeProps {
  // Tolerate null/undefined: callers occasionally pass an unpopulated relation
  // field, and a missing status must render a quiet dash, never crash.
  status: string | null | undefined
  className?: string
  /** Override the label (e.g. to localise) without losing the variant/tooltip. */
  label?: string
}

export function StatusBadge({ status, className, label }: StatusBadgeProps) {
  const entry = status ? STATUS[status] : undefined
  const variant: Variant = entry?.variant ?? 'neutral'
  const text = label ?? entry?.label ?? humanise(status)

  return (
    <span
      title={entry?.title ?? text}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASS[variant],
        className
      )}
    >
      {text}
    </span>
  )
}

function humanise(value: string | null | undefined): string {
  if (!value) return '—'
  return value
    .split('_')
    .map((w) => (w.length ? `${w[0]!.toUpperCase()}${w.slice(1)}` : w))
    .join(' ')
}
