/**
 * Textarea
 *
 * Purpose: multi-line text entry that grows with its content. Same surface as
 * Input (`fieldSurface`); minimum height is two control heights.
 *
 * Variants: default is the field well. `bare` drops the border, fill, radius,
 * and focus ring so the text sits on whatever surface holds it (composer, reply).
 * Accessibility: the caret is the focus cue when bare; the labelled field keeps
 * the 3px ring. Disabled copy stays muted.
 *
 * Usage: `<Textarea bare placeholder="What's happening?" />`
 */
import * as React from "react"

import { fieldBare, fieldSurface } from "@/components/ui/field-surface"
import { cn } from "@/lib/utils"

function Textarea({
  className,
  bare = false,
  ...props
}: React.ComponentProps<"textarea"> & { bare?: boolean }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        bare ? fieldBare : cn(fieldSurface, "flex field-sizing-content min-h-20 px-3 py-2"),
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
