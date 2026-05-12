import { ResetPasswordForm } from '../reset-form'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ResetPasswordTokenPage({ params }: PageProps) {
  const { token } = await params
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Pick a strong password you don&apos;t use elsewhere.
      </p>
      <div className="mt-6">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  )
}
