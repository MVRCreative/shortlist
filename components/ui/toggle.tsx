/**
 * Toggle
 *
 * Purpose: a two-state control in a toolbar (formatting, view options). For
 * picking one option from a set of filters use SegmentedPills; for navigation
 * use Tabs.
 *
 * States: hover raises contrast (`accent`); on uses the primary tint, because
 * primary marks selection. Heights follow `sizing.control`.
 */
'use client'

import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const toggleVariants = cva(
  "press inline-flex items-center justify-center gap-2 rounded-lg border border-transparent text-label whitespace-nowrap outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-foreground aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border-border bg-transparent',
      },
      size: {
        default: 'h-control-md min-w-control-md px-2.5',
        sm: 'h-control-sm min-w-control-sm px-2',
        lg: 'h-control-lg min-w-control-lg px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
