import { AlertCircle, Inbox } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  rows?: number
  className?: string
}

export function LoadingState({ rows = 4, className }: LoadingStateProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this section. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="border-destructive/30 bg-destructive/5 text-destructive flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
      <AlertCircle className="size-8" />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-80">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="border-border bg-muted/30 flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <div className="text-muted-foreground">{icon ?? <Inbox className="size-8" />}</div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
