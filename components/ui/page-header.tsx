/**
 * PageHeader
 *
 * Purpose: the sticky chrome bar at the top of every center-column page —
 * optional back control, one h1, an optional description, trailing actions,
 * and an optional row beneath (tabs, filters, search).
 *
 * Variants: `size` page (section roots: page-title + description) | detail
 * (object pages: card-title + meta, truncated). `back` takes an href or an
 * onClick; `backOn="mobile"` hides it from md up where the rail navigates.
 *
 * Accessibility: renders the page's only h1. The back control is a 44px
 * target with an explicit label.
 *
 * Usage:
 *   <PageHeader title="Events" description="Open to everyone" back={{ href: "/" }} backOn="mobile" />
 */
"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const pageHeaderSurface = "sticky top-0 z-30 border-b border-border bg-chrome"

type BackTarget = { href: string } | { onClick: () => void }

type BackButtonProps = {
  back: BackTarget
  label?: string
  /** Only for `onClick` targets (a step back while work is in flight). */
  disabled?: boolean
  className?: string
}

export function BackButton({ back, label = "Go back", disabled, className }: BackButtonProps) {
  const classes = cn("-ml-2 shrink-0", className)
  if ("href" in back) {
    return (
      <Button asChild variant="ghost" size="icon-lg" shape="pill" className={classes}>
        <Link href={back.href} aria-label={label}>
          <ArrowLeft className="size-icon-lg" />
        </Link>
      </Button>
    )
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      shape="pill"
      className={classes}
      onClick={back.onClick}
      aria-label={label}
      disabled={disabled}
    >
      <ArrowLeft className="size-icon-lg" />
    </Button>
  )
}

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  back?: BackTarget
  backLabel?: string
  backOn?: "always" | "mobile"
  size?: "page" | "detail"
  actions?: ReactNode
  /** Row under the title bar that sticks with it (tabs, filters, search). */
  children?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  back,
  backLabel,
  backOn = "always",
  size = "page",
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(pageHeaderSurface, className)}>
      <header className="flex min-h-touch items-center gap-4 px-4 py-3">
        {back ? (
          <BackButton
            back={back}
            {...(backLabel ? { label: backLabel } : {})}
            className={cn(backOn === "mobile" && "md:hidden")}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className={size === "page" ? "text-page-title" : "truncate text-card-title"}>{title}</h1>
          {description ? (
            <p className={size === "page" ? "text-description" : "truncate text-meta"}>{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  )
}
