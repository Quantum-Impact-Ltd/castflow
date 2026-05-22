'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { contactMessageSchema, type ContactMessageInput } from '@castflow/validators'
import { useSendContactMessage } from '@/lib/hooks/use-contact'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Topic = 'sales' | 'support' | 'safety' | 'press' | 'other'

const TOPICS: Array<{
  value: Topic
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  sla: string
}> = [
  {
    value: 'sales',
    label: 'Sales · plans',
    icon: Building2,
    sla: '24 hours',
  },
  {
    value: 'support',
    label: 'Account support',
    icon: Users,
    sla: '24 hours',
  },
  {
    value: 'safety',
    label: 'Safety · report',
    icon: ShieldCheck,
    sla: 'Same day',
  },
  {
    value: 'press',
    label: 'Press · partnerships',
    icon: Newspaper,
    sla: '2 business days',
  },
]

type ContactInput = ContactMessageInput

export function ContactContent() {
  const [topic, setTopic] = useState<Topic>('sales')
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      topic: 'sales',
      message: '',
      website: '',
    },
  })
  const sendMessage = useSendContactMessage()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setValue,
    reset,
  } = form

  const onSubmit = async (values: ContactInput) => {
    try {
      await sendMessage.mutateAsync(values)
      const sla =
        TOPICS.find((t) => t.value === values.topic)?.sla ?? '24 hours'
      toast.success('Message sent', {
        description: `We'll reply to ${values.email} within ${sla}.`,
      })
      reset()
      setTopic('sales')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong — try again'
      toast.error('We couldn’t send your message', { description: message })
    }
  }

  return (
    <>
      <Hero />

      <section className="w-full pb-24 lg:pb-32">
        <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Form */}
            <Reveal className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-background p-8 shadow-sm lg:p-12">
                <h2 className="font-serif text-3xl text-foreground sm:text-4xl">Send a message</h2>
                <p className="mt-2 text-sm text-foreground/70">
                  Every message goes to a human. We aim to reply within the SLA shown next to your
                  topic.
                </p>

                {/* Topic pills */}
                <div className="mt-8">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
                    What&apos;s this about?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TOPICS.map((t) => {
                      const active = topic === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            setTopic(t.value)
                            setValue('topic', t.value, { shouldDirty: true })
                          }}
                          aria-pressed={active}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            active
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border/60 bg-[var(--surface-50)] text-foreground/75 hover:border-foreground/40 hover:text-foreground'
                          )}
                        >
                          <t.icon className="h-3.5 w-3.5" aria-hidden />
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
                  noValidate
                >
                  {/* Honeypot — kept off-screen + hidden from AT. Bots that
                      blindly fill every input populate this; server treats
                      any non-empty value as a silent reject. Real users
                      never see or focus this field. */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                    {...register('website')}
                  />
                  <Field label="Name" htmlFor="name" error={errors.name?.message}>
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Jane Producer"
                      {...register('name')}
                    />
                  </Field>

                  <Field label="Work email" htmlFor="email" error={errors.email?.message}>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@studio.co.uk"
                      {...register('email')}
                    />
                  </Field>

                  <Field
                    label="Company"
                    htmlFor="company"
                    hint="Optional"
                    error={errors.company?.message}
                    className="md:col-span-2"
                  >
                    <Input
                      id="company"
                      autoComplete="organization"
                      placeholder="Studio West"
                      {...register('company')}
                    />
                  </Field>

                  <Field
                    label="Message"
                    htmlFor="message"
                    error={errors.message?.message}
                    className="md:col-span-2"
                  >
                    <Textarea
                      id="message"
                      rows={6}
                      placeholder="Tell us a bit about your shoot, your team, or what we can help with."
                      {...register('message')}
                    />
                  </Field>

                  <div className="md:col-span-2 mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-foreground/55">
                      By submitting you agree to our{' '}
                      <Link href="/terms" className="underline-offset-4 hover:underline">
                        Terms
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="underline-offset-4 hover:underline">
                        Privacy policy
                      </Link>
                      .
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="rounded-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                          Sending
                        </>
                      ) : isSubmitSuccessful ? (
                        <>
                          <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden />
                          Sent
                        </>
                      ) : (
                        <>
                          Send message
                          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Reveal>

            {/* Side panel */}
            <Reveal delay={120} className="lg:col-span-5">
              <div className="flex flex-col gap-4">
                <SlaCard topic={topic} />
                <DirectContacts />
                <SafetyCallout />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  )
}

function Hero() {
  return (
    <section className="relative w-full overflow-hidden pb-16 pt-20 lg:pb-20 lg:pt-28">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]">
              Contact
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
            Talk to a human <span className="font-serif font-normal italic">about anything.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">
            Sales questions, account help, safety concerns, press requests. Every message reaches a
            real person on our team — no chatbots, no ticket queues, no auto-replies.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function SlaCard({ topic }: { topic: Topic }) {
  const meta = TOPICS.find((t) => t.value === topic)
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-foreground p-7 text-background">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-background/60">
        Response time
      </p>
      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="font-mono text-5xl font-medium tracking-[-0.03em]">
          {meta?.sla.split(' ')[0]}
        </span>
        <span className="text-base text-background/70">
          {meta?.sla.split(' ').slice(1).join(' ')}
        </span>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-background/75">
        For <span className="font-medium text-background">{meta?.label.toLowerCase()}</span>{' '}
        enquiries, you&apos;ll hear back from a CastFlow team member within this window.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-background/65">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Mon–Fri · 09:00–18:00 GMT
      </div>
    </div>
  )
}

function DirectContacts() {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-7">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
        Direct lines
      </p>
      <ul className="mt-5 space-y-4">
        <ContactRow
          icon={Building2}
          label="Sales"
          value="sales@castflow.co.uk"
          href="mailto:sales@castflow.co.uk"
        />
        <ContactRow
          icon={Users}
          label="Support"
          value="help@castflow.co.uk"
          href="mailto:help@castflow.co.uk"
        />
        <ContactRow
          icon={ShieldCheck}
          label="Safety"
          value="safety@castflow.co.uk"
          href="mailto:safety@castflow.co.uk"
        />
        <ContactRow
          icon={Newspaper}
          label="Press"
          value="press@castflow.co.uk"
          href="mailto:press@castflow.co.uk"
        />
      </ul>

      <div className="mt-7 border-t border-border/60 pt-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
          Registered office
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          CastFlow Ltd
          <br />
          124 City Road
          <br />
          London EC1V 2NX
          <br />
          United Kingdom
        </p>
        <p className="mt-3 font-mono text-[11px] text-foreground/55">Companies House · 14582910</p>
      </div>
    </div>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  value: string
  href: string
}) {
  return (
    <li className="flex items-center gap-4">
      <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--surface-50)] text-foreground/70">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
          {label}
        </p>
        <a
          href={href}
          className="mt-0.5 block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {value}
        </a>
      </div>
      <Mail className="h-3.5 w-3.5 flex-none text-foreground/30" aria-hidden />
    </li>
  )
}

function SafetyCallout() {
  return (
    <div className="flex gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-6">
      <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
        <AlertTriangle className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">Reporting a safety issue?</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
          For urgent identity, harassment, or off-platform-payment concerns, email{' '}
          <a
            href="mailto:safety@castflow.co.uk"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            safety@castflow.co.uk
          </a>{' '}
          directly. Same-day human review.
        </p>
      </div>
    </div>
  )
}

function FinalCta() {
  return (
    <section className="w-full pb-28 lg:pb-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-foreground px-10 py-20 text-center text-background lg:px-16">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-background/60">
              While you wait
            </p>
            <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              Take a look at the platform{' '}
              <span className="font-serif font-normal italic">first.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
              Browse talent, see live shoots, or check pricing while we reply. Most questions answer
              themselves with a 90-second tour.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/how-it-works">
                  How it works
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <Label
          htmlFor={htmlFor}
          className="text-xs font-medium uppercase tracking-[0.14em] text-foreground/75"
        >
          {label}
        </Label>
        {hint && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-foreground/45">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
