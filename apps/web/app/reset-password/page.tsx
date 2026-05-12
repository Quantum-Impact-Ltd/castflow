import Link from 'next/link'

export default function ResetPasswordPage() {
  // The token-bearing reset page lives at /reset-password/[token].
  // This bare /reset-password route exists for users who land here without
  // a token — usually after clicking an old link.
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Reset link missing</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Your reset link is incomplete. Request a new one to continue.
      </p>
      <Link
        href="/forgot-password"
        className="text-primary mt-4 inline-block text-sm underline-offset-4 hover:underline"
      >
        Request a new reset link
      </Link>
    </div>
  )
}
