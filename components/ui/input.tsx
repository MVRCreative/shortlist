/**
 * Input
 *
 * Purpose: single-line text entry. Shares `fieldSurface` with Textarea and
 * SelectTrigger so every field has one height, radius, border, and focus ring.
 *
 * Sizes (`fieldSize`): `sm` 32, `default` 40, `lg` 44. Use `fieldSize`, not a
 * height class, to change it.
 *
 * Accessibility: pair with a Label (or `aria-label`), and set `aria-invalid`
 * plus an error message id on validation failure.
 */
import * as React from "react"

import { fieldSize, fieldSurface } from "@/components/ui/field-surface"
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  fieldSize: size = "default",
  ...props
}: React.ComponentProps<"input"> & { fieldSize?: "sm" | "default" | "lg" }) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        fieldSurface,
        fieldSize({ size }),
        "py-1 selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-control-xs file:border-0 file:bg-transparent file:text-label file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
