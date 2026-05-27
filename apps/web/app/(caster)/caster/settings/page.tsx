'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import {
  Building2,
  KeyRound,
  Mail,
  Receipt,
  Bell,
  Trash2,
  ArrowRight,
  ImageIcon,
  UploadCloud,
} from 'lucide-react'
import type { CasterProfile, CompanyType } from '@castflow/types'
import { UPLOAD_LIMITS } from '@castflow/validators'
import { PageHeader, LoadingState, ErrorState } from '@/components/dashboard'
import { CalendarFeedCard } from '@/components/dashboard/calendar-feed-card'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { authClient } from '@/lib/auth-client'
import { useMyCaster, useUpdateMyCaster } from '@/lib/hooks/use-caster'
import { useUploadFile } from '@/lib/hooks/use-uploads'
import { cn } from '@/lib/utils'

const LOGO_LIMITS = UPLOAD_LIMITS.caster_logo

const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: 'brand', label: 'Brand' },
  { value: 'agency', label: 'Agency' },
  { value: 'production_house', label: 'Production house' },
  { value: 'independent', label: 'Independent' },
]

interface CompanyForm {
  companyName: string
  contactName: string
  phone: string
  website: string
  companyType: CompanyType
}

export default function CasterSettingsPage() {
  const profile = useMyCaster()

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your company, security, and preferences." />

      {profile.isPending ? (
        <Card className="p-6">
          <LoadingState rows={3} />
        </Card>
      ) : profile.isError || !profile.data ? (
        <ErrorState
          message="We couldn’t load your settings right now."
          onRetry={() => void profile.refetch()}
        />
      ) : (
        <>
          <CompanyInfoSection profile={profile.data} />
          <LogoSection profile={profile.data} />
        </>
      )}

      <AccountSecuritySection />

      <CalendarFeedCard />

      {/* Quick links */}
      <Card className="divide-y divide-border p-0">
        <LinkRow
          icon={Receipt}
          title="Billing & invoices"
          description="Your payment history and downloadable invoices."
          href="/caster/settings/billing"
        />
        <LinkRow
          icon={Bell}
          title="Notification settings"
          description="Choose which emails you receive."
          href="/caster/settings/notifications"
        />
      </Card>

      {/* Danger zone */}
      <Card className="flex flex-col gap-4 border border-destructive/30 p-6 ring-destructive/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium text-foreground">Delete account</p>
            <p className="text-sm text-muted-foreground">
              Permanently remove your company profile and all data.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/5"
        >
          <Link href="/caster/settings/delete">Delete…</Link>
        </Button>
      </Card>
    </div>
  )
}

function CompanyInfoSection({ profile }: { profile: CasterProfile }) {
  const update = useUpdateMyCaster()

  const [form, setForm] = useState<CompanyForm>({
    companyName: profile.companyName,
    contactName: profile.contactName,
    phone: profile.phone ?? '',
    website: profile.website ?? '',
    companyType: profile.companyType,
  })

  // Keep local state in sync if the profile is refetched (e.g. after a logo
  // change re-invalidates the caster query).
  useEffect(() => {
    setForm({
      companyName: profile.companyName,
      contactName: profile.contactName,
      phone: profile.phone ?? '',
      website: profile.website ?? '',
      companyType: profile.companyType,
    })
  }, [profile])

  const dirty =
    form.companyName !== profile.companyName ||
    form.contactName !== profile.contactName ||
    form.phone !== (profile.phone ?? '') ||
    form.website !== (profile.website ?? '') ||
    form.companyType !== profile.companyType

  function set<K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.companyName.trim() || !form.contactName.trim()) {
      toast.error('Company name and contact name are required')
      return
    }
    update.mutate({
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim(),
      companyType: form.companyType,
      phone: form.phone.trim() === '' ? null : form.phone.trim(),
      website: form.website.trim() === '' ? null : form.website.trim(),
    })
  }

  return (
    <Card className="space-y-6 p-6">
      <SectionHeading icon={Building2} title="Company info" />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactName">Contact name</Label>
            <Input
              id="contactName"
              value={form.contactName}
              onChange={(e) => set('contactName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyType">Company type</Label>
            <Select
              value={form.companyType}
              onValueChange={(v) => set('companyType', v as CompanyType)}
            >
              <SelectTrigger id="companyType" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+44 20 7946 0958"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourcompany.co.uk"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
            />
          </div>
        </div>
        <div>
          <Button type="submit" disabled={update.isPending || !dirty}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function LogoSection({ profile }: { profile: CasterProfile }) {
  const caster = useMyCaster()
  const update = useUpdateMyCaster()
  const upload = useUploadFile()
  const [progress, setProgress] = useState(0)

  const currentLogo = caster.data?.logoUrl ?? profile.logoUrl ?? null

  const onDrop = (files: File[]) => {
    const file = files[0]
    if (!file) return
    setProgress(0)
    upload.mutate(
      { file, type: 'caster_logo', onProgress: setProgress },
      {
        onSuccess: () => {
          void caster.refetch()
          toast.success('Logo uploaded')
        },
      }
    )
  }

  const removeLogo = () => {
    update.mutate({ logoUrl: null }, { onSuccess: () => void caster.refetch() })
  }

  const dropzone = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/svg+xml': [],
    },
    multiple: false,
    maxSize: LOGO_LIMITS.maxSizeMb * 1024 * 1024,
    disabled: upload.isPending,
  })

  return (
    <Card className="space-y-4 p-6">
      <SectionHeading icon={ImageIcon} title="Company logo" />
      {currentLogo ? (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <RemoteImage
              src={currentLogo}
              alt={`${profile.companyName} logo`}
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <p className="flex-1 text-sm text-muted-foreground">
            Shown on your profile and on every job you post.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={dropzone.open}
              disabled={upload.isPending}
            >
              <UploadCloud className="mr-1.5 h-4 w-4" />
              {upload.isPending ? `Uploading… ${progress}%` : 'Replace'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeLogo}
              disabled={update.isPending}
              className="text-destructive hover:bg-destructive/5"
            >
              {update.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </div>
          {/* Hidden input so the dropzone.open() above can trigger a file picker. */}
          <input {...dropzone.getInputProps()} />
        </div>
      ) : (
        <div
          {...dropzone.getRootProps()}
          className={cn(
            'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors',
            dropzone.isDragActive
              ? 'border-primary/60 bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-muted/40',
            upload.isPending && 'cursor-wait opacity-60'
          )}
        >
          <input {...dropzone.getInputProps()} />
          <ImageIcon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {upload.isPending
              ? `Uploading… ${progress}%`
              : dropzone.isDragActive
                ? 'Drop to upload'
                : 'Drag a logo here, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, WebP, or SVG · max {LOGO_LIMITS.maxSizeMb} MB
          </p>
        </div>
      )}
    </Card>
  )
}

function AccountSecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwPending, setPwPending] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPending, setEmailPending] = useState(false)

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwPending(true)
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
    setPwPending(false)
    if (error) {
      toast.error(error.message ?? 'Could not change password')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    toast.success('Password updated')
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailPending(true)
    const { error } = await authClient.changeEmail({
      newEmail,
      callbackURL: '/caster/settings',
    })
    setEmailPending(false)
    if (error) {
      toast.error(error.message ?? 'Could not change email')
      return
    }
    setNewEmail('')
    toast.success('Check your inbox to confirm your new email')
  }

  return (
    <Card className="space-y-6 p-6">
      <SectionHeading icon={KeyRound} title="Account security" />
      <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pwPending || !currentPassword || !newPassword}>
            {pwPending ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>

      <Separator />

      <form onSubmit={changeEmail} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="newEmail" className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Change email
          </Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="new@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="outline" disabled={emailPending || !newEmail}>
          {emailPending ? 'Sending…' : 'Update email'}
        </Button>
      </form>
    </Card>
  )
}

function LinkRow({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof KeyRound
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-6 py-5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted/40"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: typeof KeyRound; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  )
}
