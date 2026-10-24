/**
 * Switch
 *
 * Purpose: a setting that takes effect the moment it flips (notifications,
 * visibility). Inside a form that saves on submit, use Checkbox instead.
 *
 * Geometry: 20×36 track, 16px thumb, 2px inset; the thumb travels 16px.
 * Track color and thumb position both move on `duration-fast` with the
 * standard ease so the two read as one motion.
 */
'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-5 w-9 shrink-0 after:absolute after:-inset-3 items-center rounded-full p-0.5 outline-none transition-[background-color,box-shadow] duration-fast ease-standard focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-icon-sm rounded-full bg-white shadow-xs ring-0 transition-transform duration-fast ease-standard data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
