/**
 * The two blurred tonal washes that sit behind the dark auth / onboarding
 * surfaces — depth only, no grid or particles. Render inside a
 * `relative isolate overflow-hidden` container. (Dedupe #4.)
 */
export function AtmosphereBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-[var(--brand-700)] opacity-[0.22] blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[var(--cta-400)] opacity-[0.16] blur-[140px]"
      />
    </>
  )
}
