import { PersonalForm } from './personal-form'

export default function OnboardingPersonalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Personal information</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          You must be 18 or older to be approved.
        </p>
      </div>
      <PersonalForm />
    </div>
  )
}
