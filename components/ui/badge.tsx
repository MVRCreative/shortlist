/**
 * Badge
 *
 * Purpose: a short status or label chip. Not interactive unless rendered as a
 * link through `asChild`.
 *
 * Variants:
 * - Status (`success`, `danger`, `warning`, `info`, `brand`, `neutral`): the
 *   tonal fg/bd/bg trios. Use these for anything that reports state.
 * - `default`: primary tint, for selection or "yours" markers (Going, Owner).
 * - `secondary`, `outline`, `ghost`, `link`: structural chips.
 * - `destructive` is the red chip for remove/delete. `danger` is orange status.
 *
 * Shape: radius `chip` (md). Labels truncate rather than push neighbors off
 * the row.
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const DANGER = "border-status-danger-bd bg-status-danger-bg text-status-danger-fg"
const DESTRUCTIVE = "border-status-destructive-bd bg-status-destructive-bg text-status-destructive-fg"

const badgeVariants = cva(
  "inline-flex h-control-xs w-fit max-w-full min-w-0 shrink items-center justify-center gap-1 overflow-hidden rounded-md border px-2 text-chip whitespace-nowrap transition-[color,background-color,box-shadow] duration-fast focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive [&>span]:truncate [&>svg]:pointer-events-none [&>svg]:size-icon-xs [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-light text-primary [a&]:hover:bg-primary-light",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-accent",
        destructive: DESTRUCTIVE,
        success: "border-status-success-bd bg-status-success-bg text-status-success-fg",
        danger: DANGER,
        warning: "border-status-warning-bd bg-status-warning-bg text-status-warning-fg",
        info: "border-status-info-bd bg-status-info-bg text-status-info-fg",
        brand: "border-status-brand-bd bg-status-brand-bg text-status-brand-fg",
        neutral: "border-status-neutral-bd bg-status-neutral-bg text-status-neutral-fg",
        outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "border-transparent [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "border-transparent text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {asChild
        ? children
        : React.Children.map(children, (child) =>
            typeof child === "string" || typeof child === "number" ? <span>{child}</span> : child
          )}
    </Comp>
  )
}

export { Badge, badgeVariants }
