/**
 * ListGroup
 *
 * Purpose: the standard bordered list container — a rounded 1px-border box
 * whose children separate with hairline dividers. Use for compact row lists
 * inside sheets, settings, and detail views instead of hand-rolled
 * `divide-y border` combinations.
 *
 * Variants: none; pass `className` for width/margin adjustments only.
 * Accessibility: purely presentational — rows themselves carry semantics
 * (buttons, links, or plain divs).
 *
 * Usage:
 *   <ListGroup>
 *     <button className="px-4 py-3 …">Row one</button>
 *     <button className="px-4 py-3 …">Row two</button>
 *   </ListGroup>
 */
import { cn } from "@/lib/utils"

export function ListGroup({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border overflow-hidden divide-y divide-border",
        className
      )}
    >
      {children}
    </div>
  )
}
