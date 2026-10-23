/**
 * IconMark
 *
 * Purpose: an icon in an avatar slot — system notifications, "All
 * communities", dependents, transactions, setup cards. Same rounded-square
 * shape (`radiusRole.avatar`) and size scale as `UserAvatar`, so a list that
 * mixes people and icons stays on one grid.
 *
 * Variants:
 * - `size`: `xs` 24px (inline with meta text), `sm` 32px (default), `md` 40px,
 *   `lg` 48px.
 * - `tone`: `neutral` (default) for inert rows; `brand` for a feature or
 *   setup prompt; `warning` / `danger` / `info` / `success` when the icon
 *   itself carries status (admin "needs you").
 *
 * Accessibility: decorative (`aria-hidden`). The row's text names the thing.
 *
 * Usage:
 *   <IconMark icon={CreditCard} size="md" />
 */
import type { ComponentType } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** Neutral fill for avatar-slot marks. Dark surfaces are flat, so it carries a hairline there. */
export const neutralMarkFill = "bg-secondary dark:ring-1 dark:ring-inset dark:ring-border"

const iconMarkVariants = cva(
  "flex shrink-0 items-center justify-center rounded-md",
  {
    variants: {
      size: {
        xs: "size-avatar-xs [&>svg]:size-icon-xs",
        sm: "size-avatar-sm [&>svg]:size-icon-md",
        md: "size-avatar-md [&>svg]:size-icon-lg",
        lg: "size-avatar-lg [&>svg]:size-icon-xl",
      },
      tone: {
        neutral: cn(neutralMarkFill, "text-muted-foreground"),
        brand: "bg-status-brand-bg text-status-brand-fg",
        warning: "bg-status-warning-bg text-status-warning-fg",
        danger: "bg-status-danger-bg text-status-danger-fg",
        info: "bg-status-info-bg text-status-info-fg",
        success: "bg-status-success-bg text-status-success-fg",
      },
    },
    defaultVariants: {
      size: "sm",
      tone: "neutral",
    },
  }
)

type IconMarkProps = VariantProps<typeof iconMarkVariants> & {
  icon: ComponentType<{ className?: string }>
  className?: string
}

function IconMark({ icon: Icon, size, tone, className }: IconMarkProps) {
  return (
    <span aria-hidden="true" className={cn(iconMarkVariants({ size, tone }), className)}>
      <Icon />
    </span>
  )
}

export { IconMark, iconMarkVariants }
