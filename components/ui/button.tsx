/**
 * Button
 *
 * Purpose: every clickable action that is not a link in running copy.
 *
 * Variants: `default` (the one primary action per view, solid in both themes),
 * `destructive` (solid; the action deletes or removes), `outline` and
 * `secondary` (quiet actions), `ghost` (toolbar and inline icon actions),
 * `link` (an action that reads as text).
 *
 * Sizes come from `sizing.control` in @loople/tokens: `xs` 24, `sm` 32,
 * `default` 40, `lg` 44, `xl` 56 (live, glanceable taps like scoreboard
 * increments). Icon sizes are the same heights, square. `sm-touch` and
 * `icon-touch` are 44 on phones and compact from `md` up — for row actions
 * on touch-first admin screens.
 *
 * `tone` colors the label of a quiet button (`ghost`, `outline`,
 * `secondary`); solid variants ignore it. `muted` for secondary toolbar
 * actions; `brand` / `destructive` / `success` / `warning` when the action's meaning is
 * the color; `brand-hover` / `destructive-hover` stay muted until hover
 * (feed reactions, quiet remove). `shape="pill"` is the only radius override.
 *
 * - `pending` disables the button, sets `aria-busy`, and shows a Spinner. Do
 *   not hand-compose spinners inside buttons.
 * - Press feedback (`press`) and state transitions come from motion tokens.
 * - String labels truncate inside the button instead of overflowing it.
 *
 * Accessibility: icon-only sizes need an `aria-label`. Focus shows the 3px ring.
 *
 * Usage:
 *   <Button pending={saving}>Save changes</Button>
 *   <Button variant="ghost" size="icon" aria-label="More actions"><MoreHorizontal /></Button>
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "press inline-flex max-w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-control whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline: "border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-control-md px-4 has-[>svg]:px-3",
        xs: "h-control-xs gap-1 rounded-md px-2 text-chip has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-icon-xs",
        sm: "h-control-sm gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-control-lg px-6 has-[>svg]:px-4",
        icon: "size-control-md",
        "icon-xs": "size-control-xs rounded-md [&_svg:not([class*='size-'])]:size-icon-xs",
        "icon-sm": "size-control-sm",
        "icon-lg": "size-control-lg",
        xl: "h-control-xl px-6 text-section-title has-[>svg]:px-4",
        "sm-touch": "h-touch gap-1.5 px-3 has-[>svg]:px-2.5 md:h-control-sm",
        "icon-touch": "size-touch md:size-control-md",
      },
      tone: {
        default: "",
        muted: "text-muted-foreground hover:text-foreground",
        brand: "text-primary hover:bg-primary-light hover:text-primary",
        "brand-hover": "text-muted-foreground hover:bg-primary-light hover:text-primary",
        destructive: "text-destructive hover:bg-status-destructive-bg hover:text-status-destructive-fg",
        "destructive-hover": "text-muted-foreground hover:bg-status-destructive-bg hover:text-status-destructive-fg",
        success: "text-status-success-fg hover:bg-status-success-bg hover:text-status-success-fg",
        warning: "text-status-warning-fg hover:bg-status-warning-bg hover:text-status-warning-fg",
      },
      // Shape is orthogonal to size: pill wins over the size's radius.
      shape: {
        default: "",
        pill: "rounded-full",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0 has-[>svg]:px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
      tone: "default",
    },
  }
)

function wrapText(children: React.ReactNode) {
  return React.Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className="min-w-0 truncate">{child}</span>
    ) : (
      child
    )
  )
}

function Button({
  className,
  variant = "default",
  size = "default",
  shape = "default",
  tone = "default",
  asChild = false,
  pending = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Work in flight: disables the button and shows a spinner. */
    pending?: boolean
  }) {
  const quiet = variant === "ghost" || variant === "outline" || variant === "secondary"
  const classes = cn(buttonVariants({ variant, size, shape, tone: quiet ? tone : "default" }), className)

  if (asChild) {
    return (
      <Slot.Root data-slot="button" data-variant={variant} data-size={size} className={classes} {...props}>
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <Spinner aria-hidden="true" role={undefined} aria-label={undefined} /> : null}
      {wrapText(children)}
    </button>
  )
}

type ButtonTone = NonNullable<VariantProps<typeof buttonVariants>["tone"]>

export { Button, buttonVariants, type ButtonTone }
