'use client'

/**
 * App button. Four variants, two sizes — what you ask for is what you get.
 *
 * - primary: the one filled action per view
 * - secondary: bordered, for alternatives beside a primary
 * - ghost: quiet chrome (back, inline tools, icon buttons)
 * - destructive: irreversible actions
 *
 * `icon` makes a square control; always pair it with `aria-label`.
 */
import * as React from 'react'
import { RiLoader4Line } from '@remixicon/react'
import * as AlignButton from '@/components/alignui/button'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md'

const variantMap: Record<
  ButtonVariant,
  { variant: 'primary' | 'neutral' | 'error'; mode: 'filled' | 'stroke' | 'ghost' }
> = {
  primary: { variant: 'primary', mode: 'filled' },
  secondary: { variant: 'neutral', mode: 'stroke' },
  ghost: { variant: 'neutral', mode: 'ghost' },
  destructive: { variant: 'error', mode: 'filled' },
}

function Button({
  className,
  variant = 'primary',
  size = 'md',
  icon = false,
  pending = false,
  asChild = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: boolean
  asChild?: boolean
  pending?: boolean
}) {
  const mapped = variantMap[variant]

  return (
    <AlignButton.Root
      variant={mapped.variant}
      mode={mapped.mode}
      size={size === 'sm' ? 'small' : 'medium'}
      asChild={asChild}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        size === 'sm' ? '[&_svg:not([class*="size-"])]:size-4' : '[&_svg:not([class*="size-"])]:size-5',
        icon && (size === 'sm' ? 'size-8 px-0' : 'size-10 px-0'),
        className,
      )}
      {...props}
    >
      {pending ? <AlignButton.Icon as={RiLoader4Line} className="animate-spin" /> : null}
      {children}
    </AlignButton.Root>
  )
}

export { Button }
export type { ButtonVariant, ButtonSize }
