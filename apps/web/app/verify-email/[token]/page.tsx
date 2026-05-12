import Link from 'next/link'

interface PageProps {
  params: Promise<{ token: string }>
}

async function verifyToken(token: string): Promise<boolean> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL']
  if (!apiUrl) return false
  try {
    const res = await fetch(`${apiUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      cache: 'no-store',
      redirect: 'manual',
    })
    // Better Auth returns 200 on success or 302 redirect; treat both as ok.
    return res.ok || (res.status >= 300 && res.status < 400)
  } catch {
    return false
  }
}

export default async function VerifyEmailTokenPage({ params }: PageProps) {
  const { token } = await params
  const ok = await verifyToken(token)

  if (!ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Verification failed</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This link may have expired or already been used.
        </p>
        <Link
          href="/verify-email"
          className="text-primary mt-4 inline-block text-sm underline-offset-4 hover:underline"
        >
          Request a new verification email
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Email verified</h1>
      <p className="text-muted-foreground mt-2 text-sm">Your email is confirmed. You can log in.</p>
      <Link
        href="/login"
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-block rounded-md px-4 py-2 text-sm"
      >
        Go to login
      </Link>
    </div>
  )
}
