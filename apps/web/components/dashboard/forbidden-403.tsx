import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Forbidden403Props {
  /** Where "Go to your dashboard" should point for the current user. */
  homeHref?: string
}

/**
 * Rendered by a role layout when an authenticated user hits a panel they don't
 * have access to (e.g. an artist navigating to /admin). We render this in place
 * rather than redirecting so the URL is preserved and there is no redirect loop
 * — satisfying the RBAC requirement of a true 403, not a bounce.
 */
export function Forbidden403({ homeHref = '/' }: Forbidden403Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldX className="h-8 w-8" />
      </span>
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          403 — Forbidden
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
          You don’t have access to this area
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This panel is restricted to a different role. If you believe this is a mistake, contact
          support.
        </p>
      </div>
      <Button asChild>
        <Link href={homeHref}>Go to your dashboard</Link>
      </Button>
    </main>
  )
}
