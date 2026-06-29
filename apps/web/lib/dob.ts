/**
 * ISO `yyyy-mm-dd` for the date exactly `years` ago from today. Used as the
 * `max` attribute on date-of-birth pickers so the picker UI itself reflects
 * the age rule (the zod schema remains the source of truth).
 *
 * Computed on call — never frozen at module load — so a tab left open across
 * midnight doesn't keep yesterday's cap. (Audit L11.)
 */
export function maxDobForAge(years = 18): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().slice(0, 10)
}
