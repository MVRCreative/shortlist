/**
 * SearchInput
 *
 * Purpose: The standard icon-in-input search field. Wraps `Input` with the
 * Lucide search icon positioned inside the field so every search box in the
 * app shares one implementation.
 *
 * Props: All `Input` props are forwarded. `size="sm"` is the 32px field used
 * beside compact pill rows. `className` styles the input itself (padding for
 * the icon is applied automatically).
 *
 * Accessibility: Provide `aria-label` or an associated `<label>` when the
 * field has no visible label.
 *
 * Usage:
 *   <SearchInput
 *     value={query}
 *     onChange={(e) => setQuery(e.target.value)}
 *     placeholder="Search"
 *     aria-label="Search communities"
 *   />
 */
"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function SearchInput({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<typeof Input>, "size" | "fieldSize"> & {
  size?: "default" | "sm"
}) {
  return (
    <div className="relative w-full min-w-0">
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "sm" ? "left-2.5 size-icon-sm" : "left-3 size-icon-md"
        )}
      />
      <Input
        fieldSize={size === "sm" ? "sm" : "default"}
        className={cn(size === "sm" ? "pl-8" : "pl-9", className)}
        {...props}
      />
    </div>
  )
}

export { SearchInput }
