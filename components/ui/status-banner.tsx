/**
 * StatusBanner
 *
 * Purpose: calm, persistent status inside a page: incomplete setup, a state
 * the person is in (waitlisted, pending), or a blocker with a fix. Not for
 * load failures (use ErrorState) and not for transient confirmation (toast).
 *
 * Tones: `info`, `warning`, `success`, `danger` — the same names and status
 * tokens Badge uses. Title is `text-label`, description 14px muted. The
 * optional action sits under the copy on narrow screens and to the right
 * from `sm` up.
 *
 * Accessibility: `role="status"` (polite). Icons are decorative.
 */
import type { ReactNode } from "react"
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export type StatusTone = "info" | "warning" | "success" | "danger"

const TONE: Record<StatusTone, { surface: string; icon: string; Icon: typeof Info }> = {
  info: { surface: "border-status-info-bd bg-status-info-bg", icon: "text-status-info-fg", Icon: Info },
  warning: {
    surface: "border-status-warning-bd bg-status-warning-bg",
    icon: "text-status-warning-fg",
    Icon: AlertTriangle,
  },
  success: {
    surface: "border-status-success-bd bg-status-success-bg",
    icon: "text-status-success-fg",
    Icon: CheckCircle2,
  },
  danger: { surface: "border-status-danger-bd bg-status-danger-bg", icon: "text-status-danger-fg", Icon: XCircle },
}

export function StatusBanner({
  tone = "info",
  title,
  description,
  action,
  className,
}: {
  tone?: StatusTone
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const { surface, icon, Icon } = TONE[tone]
  return (
    <div
      role="status"
      data-slot="status-banner"
      data-tone={tone}
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-3 py-2.5 text-foreground sm:flex-row sm:items-start sm:justify-between",
        surface,
        className
      )}
    >
      <div className="flex min-w-0 gap-3">
        <Icon className={cn("mt-0.5 size-icon-lg shrink-0", icon)} aria-hidden />
        <div className="min-w-0">
          <p className="text-label break-words">{title}</p>
          {description ? <p className="mt-0.5 text-description break-words">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0 pl-8 sm:pt-0.5 sm:pl-0">{action}</div> : null}
    </div>
  )
}
