'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useContract, useSignContract } from '@/lib/hooks/use-contracts'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  bookingId: string
  signerRole: 'artist' | 'caster'
}

export function ContractClient({ bookingId, signerRole }: Props) {
  const contract = useContract(bookingId)
  const sign = useSignContract(bookingId)
  const [name, setName] = useState('')
  const [agreed, setAgreed] = useState(false)

  if (contract.isPending) return <LoadingState rows={6} />
  if (contract.isError || !contract.data)
    return (
      <ErrorState
        title="No contract yet"
        message="The contract is generated automatically after the booking is confirmed."
      />
    )

  const c = contract.data
  const alreadySigned = signerRole === 'artist' ? c.artistSigned : c.casterSigned

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Contract"
        description={c.jobTitle}
        actions={<StatusBadge status={c.status} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Artist" value={c.artistLegalName} />
            <Field label="Caster" value={c.casterCompanyName} />
            <Field label="Shoot date" value={formatDate(c.shootDate)} />
            <Field label="Location" value={c.shootLocation} />
            <Field label="Payment" value={c.paymentTerms} />
            <Field label="Total" value={formatCurrency(c.totalAmount)} />
            <Field label="Usage rights" value={c.usageRights} className="col-span-2" />
            <Field label="Exclusivity" value={c.exclusivity ? 'Yes' : 'No'} />
            <Field label="NDA included" value={c.ndaIncluded ? 'Yes' : 'No'} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground">Artist signature</div>
              <div>
                {c.artistSigned
                  ? `Signed ${formatDate(c.artistSignedAt ?? c.createdAt)}`
                  : 'Pending'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Caster signature</div>
              <div>
                {c.casterSigned
                  ? `Signed ${formatDate(c.casterSignedAt ?? c.createdAt)}`
                  : 'Pending'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {alreadySigned || c.status === 'fully_signed' ? (
        <Card>
          <CardContent className="text-sm pt-6">
            {c.pdfUrl ? (
              <p>
                A signed PDF copy will be available shortly. Status:{' '}
                <span className="capitalize">{c.status.replace(/_/g, ' ')}</span>.
              </p>
            ) : (
              <p>You have signed this contract.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signatureName">Full legal name</Label>
              <Input
                id="signatureName"
                placeholder="Type your full legal name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
              />
              <span>I agree to the terms of this contract.</span>
            </label>
            <Button
              disabled={!name.trim() || !agreed || sign.isPending}
              onClick={() => sign.mutate(name.trim())}
            >
              {sign.isPending ? 'Signing…' : 'Sign contract'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div>{value}</div>
    </div>
  )
}
