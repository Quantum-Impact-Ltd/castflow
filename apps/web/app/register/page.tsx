import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Camera, Sparkles, ArrowRight } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterProgress } from '@/components/auth/register-progress'
import { redirectIfAuthenticated } from '@/lib/auth-server'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function forwardedQueryString(
  params: Record<string, string | string[] | undefined>,
  drop: ReadonlyArray<string>,
): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (drop.includes(k)) continue
    if (v == null) continue
    if (Array.isArray(v)) v.forEach((val) => usp.append(k, val))
    else usp.append(k, v)
  }
  const str = usp.toString()
  return str ? `?${str}` : ''
}

export const metadata = {
  title: 'Join CastFlow',
  description: 'Create your CastFlow account — caster or artist.',
}

export default async function RegisterPage({ searchParams }: PageProps) {
  await redirectIfAuthenticated()

  const params = await searchParams
  const role = params['role']
  const roleValue = Array.isArray(role) ? role[0] : role

  if (roleValue === 'artist' || roleValue === 'caster') {
    redirect(`/register/${roleValue}${forwardedQueryString(params, ['role'])}`)
  }

  const carriedQs = forwardedQueryString(params, [])

  return (
    <AuthShell
      eyebrow="Join CastFlow"
      topAccessory={<RegisterProgress current={0} />}
      heading={
        <>
          Pick the side you&apos;re{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            on.
          </span>
        </>
      }
      subhead="Two roles. Your choice is permanent — it shapes the whole platform from here."
      width="lg"
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <RoleTile
          href={`/register/artist${carriedQs}`}
          icon={<Camera className="h-4 w-4" />}
          eyebrow="Models & actors"
          title="I'm an artist"
          body="Apply for shoots, manage bookings, keep 100% of every booking."
          imageUrl="https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=1200&q=80"
          imageAlt="Portrait of a model on set"
        />
        <RoleTile
          href={`/register/caster${carriedQs}`}
          icon={<Sparkles className="h-4 w-4" />}
          eyebrow="Brands, agencies & producers"
          title="I'm a caster"
          body="Post shoots, find verified talent, book in days through escrow."
          imageUrl="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80"
          imageAlt="Cinema camera and crew on a production set"
        />
      </div>
    </AuthShell>
  )
}

function RoleTile({
  href,
  icon,
  eyebrow,
  title,
  body,
  imageUrl,
  imageAlt,
}: {
  href: string
  icon: React.ReactNode
  eyebrow: string
  title: string
  body: string
  imageUrl: string
  imageAlt: string
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-md transition-all hover:border-white/30"
    >
      {/* Photo strip */}
      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr]">
        <div className="relative h-full min-h-[140px] overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(min-width: 640px) 180px, 140px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--ink-900)]/35 via-transparent to-[var(--ink-900)]/85"
          />
        </div>

        {/* Copy */}
        <div className="relative flex flex-col justify-center gap-2 p-5 sm:p-6">
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
            <span className="text-[#f9a26c]">{icon}</span>
            {eyebrow}
          </p>
          <h2 className="text-lg font-semibold leading-tight text-white sm:text-xl">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-white/65">{body}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f9a26c] transition-colors">
            Continue
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  )
}
