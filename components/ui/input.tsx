import * as React from 'react'
import { cn } from '@/lib/utils'

/** Single-line field. AlignUI input surface (shadow, radius, type). */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-10 bg-bg-white-0 px-3 text-paragraph-sm text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 outline-none',
        'transition duration-200 ease-out placeholder:text-text-soft-400',
        'hover:bg-bg-weak-50 hover:ring-transparent',
        'focus:bg-bg-white-0 focus:shadow-button-important-focus focus:ring-stroke-strong-950',
        'disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300',
        'aria-invalid:ring-error-base',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
