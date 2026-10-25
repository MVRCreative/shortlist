/**
 * StatusBanner
 *
 * Purpose: calm, persistent status inside a page: incomplete setup, a state
 * the person is in (waitlisted, pending), or a blocker with a fix. Not for
 * load failures (use ErrorState) and not for transient confirmation (toast).
 *
 * Tones: `info`, `warning`, `success`, `danger` — the same names and status
 * tokens Badge uses. Title is `text-label-sm`, description 14px muted. The
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
  info: { surface: "border-information-light bg-information-lighter", icon: "text-information-base", Icon: Info },
  warning: {
    surface: "border-warning-light bg-warning-lighter",
    icon: "text-warning-base",
    Icon: AlertTriangle,
  },
  success: {
    surface: "border-success-light bg-success-lighter",
    icon: "text-success-base",
    Icon: CheckCircle2,
  },
  danger: { surface: "border-error-light bg-error-lighter", icon: "text-error-base", Icon: XCircle },
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
        "flex flex-col gap-3 rounded-20 border px-3 py-2.5 text-text-strong-950 sm:flex-row sm:items-start sm:justify-between",
        surface,
        className
      )}
    >
      <div className="flex min-w-0 gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", icon)} aria-hidden />
        <div className="min-w-0">
          <p className="text-label-sm break-words">{title}</p>
          {description ? <p className="mt-0.5 text-paragraph-sm break-words">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0 pl-8 sm:pt-0.5 sm:pl-0">{action}</div> : null}
    </div>
  )
}
