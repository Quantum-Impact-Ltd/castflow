'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  FileText,
  Download,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Circle,
  Ban,
} from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import { PageHeader, LoadingState, ErrorState, LockedField, StatusBadge } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useContract, useGenerateContract, useSignContract } from '@/lib/hooks/use-contracts'
import { formatDate } from '@/lib/utils'

const SIGNING_WINDOW_MS = 72 * 60 * 60 * 1000

export function ContractClient({ bookingId }: { bookingId: string }) {
  const { data: contract, isPending, isError, error, refetch } = useContract(bookingId)
  const generate = useGenerateContract(bookingId)
  const sign = useSignContract(bookingId)

  const [legalName, setLegalName] = useState('')
  const [agreed, setAgreed] = useState(false)

  if (isPending) return <LoadingState variant="detail" />

  // A 404 means the contract has not been generated yet.
  if (isError) {
    const status = error instanceof ApiError ? error.status : 0
    if (status === 404) {
      return (
        <div className="space-y-6">
          <BackLink bookingId={bookingId} />
          <PageHeader title="Contract" description="Generate the contract to begin signing." />
          <Card className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileText className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No contract yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Generate the contract for this booking. Both parties then have 72 hours to sign.
              </p>
            </div>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              {generate.isPending ? 'Generating…' : 'Generate contract'}
            </Button>
          </Card>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <BackLink bookingId={bookingId} />
        <ErrorState onRetry={() => void refetch()} />
      </div>
    )
  }

  const locationUnlocked = contract.status === 'fully_signed'
  const isVoided = contract.status === 'voided'
  const alreadySigned = contract.artistSigned

  const submitDisabled =
    isVoided || alreadySigned || !agreed || legalName.trim().length < 2 || sign.isPending

  function submitSignature() {
    const trimmed = legalName.trim()
    if (trimmed.length < 2 || !agreed) return
    sign.mutate(trimmed)
  }

  return (
    <div className="space-y-6">
      <BackLink bookingId={bookingId} />

      <PageHeader
        title="Shoot contract"
        description={contract.jobTitle}
        actions={<StatusBadge status={contract.status} />}
      />

      {isVoided ? (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Ban className="mt-0.5 h-4 w-4 shrink-0" />
          This contract was voided and can no longer be signed. The booking may have been cancelled
          or the 72-hour signing window may have elapsed.
        </div>
      ) : contract.status !== 'fully_signed' ? (
        <SigningCountdown createdAt={contract.createdAt} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Parties &amp; engagement</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Artist" value={contract.artistLegalName} />
              <Detail label="Caster" value={contract.casterCompanyName} />
              <Detail label="Job" value={contract.jobTitle} />
              <Detail label="Shoot date" value={formatDate(contract.shootDate)} />
              <div className="sm:col-span-2">
                <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Shoot location
                </dt>
                <dd className="mt-1">
                  {locationUnlocked ? (
                    <span className="text-sm text-foreground">{contract.shootLocation || '—'}</span>
                  ) : (
                    <LockedField reason="Revealed once both parties sign" />
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Payment terms</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Terms" value={contract.paymentTerms} />
              <Detail
                label="Agreed rate"
                value={
                  contract.paymentType === 'hourly'
                    ? `${formatGbp(contract.agreedRate)}/hr`
                    : formatGbp(contract.agreedRate)
                }
              />
              {contract.paymentType === 'hourly' ? (
                <Detail label="Agreed hours" value={`${contract.agreedHours ?? '—'} hrs`} />
              ) : null}
              <Detail label="Total" value={formatGbp(contract.totalAmount)} />
            </dl>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Usage &amp; legal</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Detail label="Usage rights" value={contract.usageRights} />
              </div>
              <Detail label="Exclusivity" value={contract.exclusivity ? 'Yes' : 'No'} />
              <Detail label="NDA included" value={contract.ndaIncluded ? 'Yes' : 'No'} />
            </dl>
          </Card>

          {contract.pdfUrl ? (
            <Card className="flex items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Signed contract</p>
                  <p className="text-xs text-muted-foreground">Both parties have signed.</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={contract.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-1.5 h-4 w-4" /> Download PDF
                </a>
              </Button>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Signatures</h2>
            <ul className="space-y-3 text-sm">
              <SignatureRow
                label="You (artist)"
                signed={contract.artistSigned}
                signedAt={contract.artistSignedAt}
              />
              <SignatureRow
                label={contract.casterCompanyName}
                signed={contract.casterSigned}
                signedAt={contract.casterSignedAt}
              />
            </ul>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Sign the contract</h2>
            {alreadySigned ? (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                You signed this contract on {formatDate(contract.artistSignedAt)}.
              </div>
            ) : isVoided ? (
              <p className="text-sm text-muted-foreground">This contract can no longer be signed.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  By typing your full legal name below and submitting, you are providing a legally
                  binding electronic signature under the Electronic Communications Act 2000.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="legal-name">Full legal name</Label>
                  <Input
                    id="legal-name"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Jane Alexandra Smith"
                    maxLength={200}
                    autoComplete="name"
                  />
                </div>
                <label className="flex items-start gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--brand-500)]"
                  />
                  <span>I agree to the terms of this contract.</span>
                </label>
                <Button className="w-full" onClick={submitSignature} disabled={submitDisabled}>
                  {sign.isPending ? 'Signing…' : 'Sign contract'}
                </Button>
              </>
            )}
          </Card>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            The shoot location is only revealed once both parties have signed.
          </div>
        </div>
      </div>
    </div>
  )
}

function SigningCountdown({ createdAt }: { createdAt: string }) {
  const deadline = new Date(createdAt).getTime() + SIGNING_WINDOW_MS
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const remaining = deadline - now
  const expired = remaining <= 0

  return (
    <div
      className={
        expired
          ? 'flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'
          : 'flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800'
      }
    >
      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
      {expired ? (
        <span>The 72-hour signing window has expired.</span>
      ) : (
        <span>Both parties must sign within 72 hours of generation — {formatRemaining(remaining)}.</span>
      )}
    </div>
  )
}

function SignatureRow({
  label,
  signed,
  signedAt,
}: {
  label: string
  signed: boolean
  signedAt: string | null
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        {signed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        {label}
      </span>
      <span className="font-medium text-foreground">
        {signed ? formatDate(signedAt) : 'Awaiting'}
      </span>
    </li>
  )
}

function BackLink({ bookingId }: { bookingId: string }) {
  return (
    <Link
      href={`/artist/bookings/${bookingId}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to booking
    </Link>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{value}</dd>
    </div>
  )
}

function formatGbp(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

function formatRemaining(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000))
  if (hours >= 1) {
    return `expires in ${hours} hour${hours === 1 ? '' : 's'}`
  }
  const mins = Math.max(1, Math.ceil(ms / (60 * 1000)))
  return `expires in ${mins} minute${mins === 1 ? '' : 's'}`
}
