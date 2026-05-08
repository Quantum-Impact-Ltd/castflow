export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto py-12 px-4">{children}</main>
    </div>
  )
}
