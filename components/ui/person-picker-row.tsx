/**
 * PersonPickerRow
 *
 * Purpose: the standard selectable person row used inside people pickers
 * (new message dialog, family member dialog, and future member pickers).
 * Renders avatar + name (+ optional verified check) + subtitle and a
 * selection indicator.
 *
 * Variants: selection indicator is a filled circle check; works for both
 * single- and multi-select flows (the parent owns selection state).
 * Accessibility: rendered as a real <button> with aria-pressed; the visible
 * check is aria-hidden since the pressed state carries the semantics.
 *
 * Usage:
 *   <PersonPickerRow
 *     name={user.name}
 *     subtitle={`@${user.handle}`}
 *     avatarSrc={user.avatar}
 *     selected={isSelected}
 *     onSelect={() => toggle(user.id)}
 *   />
 */
"use client"

import { BadgeCheck, Check } from "lucide-react"
import { UserAvatar } from "@/components/ui/user-avatar"
import { cn } from "@/lib/utils"

export function PersonPickerRow({
  name,
  subtitle,
  avatarSrc,
  verified = false,
  selected,
  onSelect,
}: {
  name: string
  subtitle: string
  avatarSrc?: string | null
  verified?: boolean
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
        selected && "bg-muted"
      )}
    >
      <UserAvatar
        name={name}
        src={avatarSrc}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-label truncate">{name}</span>
          {verified && (
            <BadgeCheck
              className="size-icon-md shrink-0 text-primary"
              aria-label="Verified"
            />
          )}
        </div>
        <p className="text-description truncate">{subtitle}</p>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "size-icon-lg rounded-full border-2 shrink-0 transition-colors duration-fast flex items-center justify-center",
          selected ? "bg-primary border-primary" : "border-input"
        )}
      >
        {selected && <Check className="size-icon-xs text-primary-foreground" />}
      </div>
    </button>
  )
}
