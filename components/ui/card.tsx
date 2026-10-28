import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card — content object surface only.
 *
 * `cardSurface` is the one object surface in the app: paper fill, hairline
 * border, proposal radius (25). No resting shadow. Prefer the `surface-group`
 * utility for lists and plan grids. Load failures use `ErrorState`.
 */
export const cardSurface =
  "rounded-25 border border-stroke-soft-200 bg-bg-white-0 text-text-strong-950"

/**
 * Feed objects share the same paper + hairline surface as cards.
 */
export const feedSurface =
  "rounded-25 border border-stroke-soft-200 bg-bg-white-0 text-text-strong-950"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn(cardSurface, "flex flex-col gap-6 py-6", className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("text-label-md", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-paragraph-sm", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6 [.border-t]:pt-6", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
