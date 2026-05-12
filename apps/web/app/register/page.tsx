import Link from 'next/link'
import { Card } from '@/components/ui/card'

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Join CastFlow</h1>
        <p className="text-muted-foreground mt-2 text-sm">Choose the account type that fits you</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/register/artist" className="block">
          <Card className="hover:border-primary h-full p-6 transition-colors">
            <h2 className="text-xl font-medium">I&apos;m an artist</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Model or actor — apply for casting jobs, manage bookings, get paid securely.
            </p>
          </Card>
        </Link>

        <Link href="/register/caster" className="block">
          <Card className="hover:border-primary h-full p-6 transition-colors">
            <h2 className="text-xl font-medium">I&apos;m a caster</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Brand, agency or production house — post jobs, find talent, book quickly.
            </p>
          </Card>
        </Link>
      </div>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
