/**
 * React Hook Form `setValueAs` for numeric inputs. Maps an empty/blank field to
 * `undefined` instead of `NaN`.
 *
 * `register('x', { valueAsNumber: true })` turns an emptied number input into
 * `NaN`, which Zod's `z.number()` rejects even when the field is `.optional()`
 * — the validation fails silently (especially if the field is hidden), blocking
 * "Next"/"Save" with no visible error. Mapping empty → `undefined` lets optional
 * fields pass and gives required fields a proper "required" message.
 */
export const numberOrUndefined = (v: unknown): number | undefined =>
  v === '' || v === null || v === undefined ? undefined : Number(v)
