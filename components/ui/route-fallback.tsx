import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Purpose: the one layout for states that replace a whole route — not found,
 * route error, route loading. Content centers in the upper half of the
 * viewport so it reads as the page rather than a blank screen.
 *
 * Variants: none. A title, a description, and the recovery actions.
 *
 * Accessibility: the title is the page's `h1`. Route errors announce through
 * the heading; loading uses `PageLoading` with `routeFallbackHeight`, which
 * carries `role="status"`.
 *
 * Usage:
 *   <RouteFallback
 *     title="Page not found"
 *     description="That page doesn't exist or you don't have access to it."
 *     actions={<Link href="/" className={buttonVariants()}>Back to home</Link>}
 *   />
 */
export const routeFallbackHeight = "min-h-[50vh]"

export function RouteFallback({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        routeFallbackHeight,
        "flex flex-col items-center justify-center gap-4 p-6 text-center",
        className
      )}
    >
      <h1 className="text-page-title">{title}</h1>
      <p className="max-w-sm text-description">{description}</p>
      {actions ? <div className="flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  )
}
