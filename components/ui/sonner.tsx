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
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--success-bg': 'var(--status-success-bg)',
  '--success-text': 'var(--status-success-fg)',
  '--success-border': 'var(--status-success-bd)',
  '--info-bg': 'var(--status-info-bg)',
  '--info-text': 'var(--status-info-fg)',
  '--info-border': 'var(--status-info-bd)',
  '--warning-bg': 'var(--status-warning-bg)',
  '--warning-text': 'var(--status-warning-fg)',
  '--warning-border': 'var(--status-warning-bd)',
  '--error-bg': 'var(--status-danger-bg)',
  '--error-text': 'var(--status-danger-fg)',
  '--error-border': 'var(--status-danger-bd)',
  '--border-radius': 'var(--radius)',
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
          toast: 'font-sans px-3! py-2.5! shadow-floating!',
          title: 'text-label! text-current!',
          description: 'text-description! text-foreground-secondary!',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
