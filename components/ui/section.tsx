/**
 * Section
 *
 * Purpose: Page-level block with the title **outside** the surface — the same
 * hierarchy as Home Reminders (`h3` then rail). Use this instead of putting a
 * header bar inside a Card.
 *
 * - `Section` — flex column wrapper
 * - `SectionHeader` — title (+ optional action / description), sits above the panel
 * - `SectionPanel` — the card surface (hairline border + `shadow-card`)
 *
 * Usage:
 *   <Section>
 *     <SectionHeader heading="Trending posts" action={<Link … />} />
 *     <SectionPanel>{…}</SectionPanel>
 *   </Section>
 */
import * as React from "react"

import { cardSurface } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="section"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function SectionHeader({
  heading,
  description,
  action,
  className,
  headingId,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  heading: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  /** Optional id for aria-labelledby on the parent Section. */
  headingId?: string
}) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "flex items-baseline justify-between gap-3 px-1",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <h2
          id={headingId}
          className="text-section-title"
        >
          {heading}
        </h2>
        {description ? (
          <div className="mt-0.5 text-description">
            {description}
          </div>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      ) : null}
    </div>
  )
}

function SectionPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-panel"
      className={cn(cardSurface, "overflow-hidden", className)}
      {...props}
    />
  )
}

export { Section, SectionHeader, SectionPanel }
