/**
 * DateTile
 *
 * Purpose: the calendar block that leads an event row — short month over the
 * day numeral. Same footprint everywhere an event is listed.
 *
 * Variants: none.
 *
 * Accessibility: reads as "Mar 14" — it is the row's only date, so it stays
 * in the accessibility tree.
 *
 * Usage:
 *   <DateTile month="Mar" day="14" />
 */
import { cn } from "@/lib/utils"

function DateTile({
  month,
  day,
  className,
}: {
  month: string
  day: string | number
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-center",
        className
      )}
    >
      <span className="text-eyebrow">{month}</span>
      <span className="text-numeral text-section-title leading-none">{day}</span>
    </div>
  )
}

export { DateTile }
