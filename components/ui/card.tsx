import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card — content object surface only.
 *
 * `cardSurface` is the one object surface in the app: hairline border,
 * `bg-card`, `surface` radius (xl), `shadow-card` (flat at rest). Card,
 * SectionPanel, and feed objects all build on it; a hand-written
 * `rounded-xl border bg-card` string is drift. Load failures use `ErrorState`
 * (destructive status surface), not this card.
 *
 * For page sections with a title, put the title **outside** the surface using
 * `Section` / `SectionHeader` / `SectionPanel` from `@/components/ui/section`
 * (same hierarchy as Home Reminders). Do not use CardHeader as a page eyebrow.
 */
export const cardSurface = "rounded-xl border border-transparent bg-card text-card-foreground shadow-card"

/**
 * Feed objects (posts, reminders, broadcasts, the composer, sidebar panels on
 * the feed). Page and card are the same white, so the hairline is what
 * separates them. Dark mode uses the same line.
 */
export const feedSurface = "rounded-xl border border-border bg-card text-card-foreground shadow-card"

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
  return <div data-slot="card-title" className={cn("text-card-title", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-description", className)} {...props} />
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
