/**
 * ErrorState
 *
 * Purpose: the one way a failed load renders. An AlignUI-style alert row —
 * status icon, what failed, why if known, and a quiet retry. Never render a
 * failure as empty data, and never dress it as a card with a red rail.
 *
 * Layouts:
 * - `inline` (default): compact. Inside panels, tables, tiles.
 * - `region`: same composition with more vertical padding so it can fill a
 *   list hole. Still left-aligned — region is spacing, not a second look.
 *
 * Retry copy is always "Try again" on an outline button. Omit `onRetry` only
 * when there is truly nothing to retry; `reloadOnRetry` reloads the page as
 * a last resort.
 *
 * Accessibility: `role="alert"` so the failure is announced. The icon is
 * decorative.
 *
 * Usage:
 *   <ErrorState title="Couldn’t load members" onRetry={refetch} />
 *   <ErrorState layout="region" title="Couldn’t load programs" description={error} onRetry={retry} />
 */
"use client"

import type { ReactNode } from "react"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ErrorState({
  title,
  description,
  onRetry,
  reloadOnRetry = false,
  layout = "inline",
  className,
}: {
  title: string
  description?: ReactNode
  onRetry?: () => void
  /** No in-place retry exists; the button reloads the page. */
  reloadOnRetry?: boolean
  layout?: "inline" | "region"
  className?: string
}) {
  const retry = onRetry ?? (reloadOnRetry ? () => window.location.reload() : undefined)
  const region = layout === "region"

  return (
    <div
      role="alert"
      data-slot="error-state"
      data-layout={layout}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border border-status-destructive-bd bg-status-destructive-bg px-3 text-foreground sm:flex-row sm:items-start sm:justify-between",
        region ? "py-8" : "py-2.5",
        className
      )}
    >
      <div className="flex min-w-0 gap-3">
        <AlertCircle
          className="mt-0.5 size-icon-lg shrink-0 text-status-destructive-fg"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-label break-words">{title}</p>
          {description ? (
            <p className="mt-0.5 text-description break-words">{description}</p>
          ) : null}
        </div>
      </div>
      {retry ? (
        <div className="shrink-0 pl-8 sm:pt-0.5 sm:pl-0">
          <Button type="button" variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  )
}
