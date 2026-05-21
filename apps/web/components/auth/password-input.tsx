'use client'

import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { AuthInput } from './auth-form-fields'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<ComponentProps<typeof AuthInput>, 'type'> & {
  /** aria-label for the show/hide toggle button. Defaults to "Show password" /
   *  "Hide password". Override for localisation. */
  toggleLabelShow?: string
  toggleLabelHide?: string
}

/**
 * Password field with a show/hide toggle. Wraps `AuthInput` and forwards refs
 * to the inner <input>, so RHF's `register('password')` still works.
 *
 * Toggle is a real button (not a checkbox) with `aria-pressed` so screen
 * readers announce the state correctly. Right-padding on the input prevents
 * text from sliding under the icon.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      className,
      toggleLabelShow = 'Show password',
      toggleLabelHide = 'Hide password',
      ...props
    },
    ref,
  ) {
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative">
        <AuthInput
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-11', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? toggleLabelHide : toggleLabelShow}
          // tabIndex=-1 so the toggle isn't focused on Tab — keeps the form
          // flow input → input → submit. Users who need the toggle can
          // mouse/click it, and screen readers still reach it via the
          // landmarks list.
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9a26c]/40"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    )
  },
)
