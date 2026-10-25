/**
 * Toaster
 *
 * Purpose: the one toast channel. Mounted once in `app/layout.tsx`; call
 * `toast.success / error / warning / info / message / promise` from `sonner`.
 * Toasts confirm or report something transient; persistent state belongs in
 * StatusBanner and load failures in ErrorState.
 *
 * Styling: Sonner's rich-color variables are pointed at Loople's status tokens
 * (the same trios Badge and StatusBanner use), the neutral toast at `popover`,
 * and the radius and elevation at the `floating` role. No Sonner default color
 * reaches the screen.
 */
'use client'

import type { CSSProperties } from 'react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const TOKEN_VARS = {
  '--normal-bg': 'var(--color-bg-white-0)',
  '--normal-text': 'var(--color-text-strong-950)',
  '--normal-border': 'var(--color-stroke-soft-200)',
  '--success-bg': 'var(--color-success-lighter)',
  '--success-text': 'var(--color-success-base)',
  '--success-border': 'var(--color-success-light)',
  '--info-bg': 'var(--color-information-lighter)',
  '--info-text': 'var(--color-information-base)',
  '--info-border': 'var(--color-information-light)',
  '--warning-bg': 'var(--color-warning-lighter)',
  '--warning-text': 'var(--color-warning-base)',
  '--warning-border': 'var(--color-warning-light)',
  '--error-bg': 'var(--color-error-lighter)',
  '--error-text': 'var(--color-error-base)',
  '--error-border': 'var(--color-error-light)',
  '--border-radius': '0.625rem',
} as CSSProperties

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-center"
      richColors
      className="toaster group"
      style={TOKEN_VARS}
      toastOptions={{
        classNames: {
          toast: 'font-sans px-3! py-2.5! shadow-regular-md!',
          title: 'text-label-sm! text-current!',
          description: 'text-paragraph-sm! text-text-sub-600!',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
