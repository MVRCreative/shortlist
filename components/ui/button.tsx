'use client'

/**
 * App button. Renders AlignUI Button — primary / neutral / error only.
 * Legacy variant names map onto AlignUI variant + mode so every screen matches.
 */
import * as React from 'react'
import { RiLoader4Line } from '@remixicon/react'
import * as AlignButton from '@/components/alignui/button'
import { cn } from '@/lib/utils'

type LegacyVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type LegacySize =
  | 'default'
  | 'xs'
  | 'sm'
  | 'lg'
  | 'icon'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-lg'
  | 'xl'
  | 'sm-touch'
  | 'icon-touch'

const variantMap: Record<LegacyVariant, { variant: 'primary' | 'neutral' | 'error'; mode: 'filled' | 'stroke' | 'lighter' | 'ghost' }> = {
  default: { variant: 'primary', mode: 'filled' },
  destructive: { variant: 'error', mode: 'filled' },
  outline: { variant: 'neutral', mode: 'stroke' },
  secondary: { variant: 'neutral', mode: 'lighter' },
  ghost: { variant: 'neutral', mode: 'ghost' },
  link: { variant: 'primary', mode: 'ghost' },
}

const sizeMap: Record<LegacySize, 'medium' | 'small' | 'xsmall' | 'xxsmall'> = {
  default: 'medium',
  lg: 'medium',
  xl: 'medium',
  sm: 'small',
  'sm-touch': 'small',
  xs: 'xsmall',
  icon: 'small',
  'icon-sm': 'small',
  'icon-lg': 'medium',
  'icon-touch': 'medium',
  'icon-xs': 'xxsmall',
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  shape,
  pending = false,
  asChild = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: LegacyVariant
  size?: LegacySize
  shape?: 'default' | 'pill'
  tone?: string
  asChild?: boolean
  pending?: boolean
}) {
  const mapped = variantMap[variant]
  const iconOnly = size.startsWith('icon')

  return (
    <AlignButton.Root
      variant={mapped.variant}
      mode={mapped.mode}
      size={sizeMap[size]}
      asChild={asChild}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-5',
        iconOnly && 'px-0',
        shape === 'pill' && 'rounded-full',
        variant === 'link' && 'h-auto px-0',
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
