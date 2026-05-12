import Link from 'next/link'

export default function OnboardingPendingPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Application under review</h1>
      <p className="text-muted-foreground mt-3 text-sm">
        Thanks for joining CastFlow. We&apos;ll review your profile shortly — you&apos;ll get an
        email when you&apos;re approved.
      </p>
      <p className="text-muted-foreground mt-2 text-sm">
        Need to finish your profile?{' '}
        <Link
          href="/onboarding/personal"
          className="text-primary underline-offset-4 hover:underline"
        >
          Continue onboarding
        </Link>
      </p>
    </div>
  )
}
