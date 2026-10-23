/**
 * UserAvatar
 *
 * Purpose: Render a person's avatar from a resolved image URL (`User.avatar`),
 * falling back to their initials when no image is available or the image fails
 * to load. Wraps the base `Avatar` primitive so every avatar across the app
 * displays the user's profile picture from a single, owned component.
 *
 * Props:
 * - `name`: used to derive initials for the fallback (required).
 * - `src`: resolved image URL (signed URL from storage). When empty/null, only
 *   initials are shown.
 * - `size`: semantic size step (`xs` 24px, `sm` 32px, `md` 40px (default),
 *   `lg` 48px, `xl` 64px, `hero` 80px, `2xl` responsive profile hero).
 *   `chip` is a 20px circle that nests inside a pill; `fill` fills a photo-grid
 *   tile edge to edge. Every other size is the `radiusRole.avatar` square.
 * - `tone`: the initials fill. `brand` (default) for people in feeds and
 *   headers; `neutral` for dense lists, stacks, and grids where many brand
 *   fills would be noise; `strong` for the one emphasized person (profile hero).
 * - `className`: forwarded to the `Avatar` root for layout and decoration
 *   (margins, `border-4 border-background`, opacity). Shape, size, and fill
 *   come from `size` and `tone` — `design-drift` blocks restyling them.
 * - `fallbackClassName`: for primitives in `components/ui` only
 *   (`CommunityAvatar` identity colors). Feature code uses `tone`.
 * - `imageAlt`: accessible alt text for the image (defaults to the person's name).
 * - `children`: optional decorations such as `AvatarBadge`.
 *
 * Accessibility: Radix `Avatar.Image` automatically falls back to
 * `Avatar.Fallback` on load error, so initials always remain readable. Provide
 * a meaningful `imageAlt` when the avatar is not accompanied by a visible name.
 *
 * Usage:
 *   <UserAvatar name={user.name} src={user.avatar} size="sm" />
 */
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { neutralMarkFill } from "@/components/ui/icon-mark"
import { cn } from "@/lib/utils"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const userAvatarVariants = cva("shrink-0", {
  variants: {
    size: {
      chip: "size-icon-lg rounded-full",
      fill: "size-full rounded-none",
      xs: "size-avatar-xs",
      sm: "size-avatar-sm",
      md: "size-avatar-md",
      lg: "size-avatar-lg",
      xl: "size-avatar-xl",
      hero: "size-avatar-hero",
      "2xl": "size-avatar-hero sm:size-avatar-2xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const FALLBACK_TEXT_SIZE = {
  chip: "text-chip rounded-full",
  fill: "text-meta sm:text-body rounded-none",
  xs: "text-meta",
  sm: "text-meta",
  md: "text-label",
  lg: "text-label",
  xl: "text-section-title",
  hero: "text-page-title",
  "2xl": "text-section-title sm:text-page-title",
} as const

const FALLBACK_TONE = {
  brand: "",
  neutral: cn(neutralMarkFill, "text-foreground"),
  strong: "bg-primary text-primary-foreground",
} as const

type UserAvatarTone = keyof typeof FALLBACK_TONE

type UserAvatarSize = NonNullable<VariantProps<typeof userAvatarVariants>["size"]>

type UserAvatarProps = Omit<React.ComponentProps<typeof Avatar>, "size"> & {
  name: string
  src?: string | null
  size?: UserAvatarSize
  tone?: UserAvatarTone
  fallbackClassName?: string
  imageAlt?: string
}

function UserAvatar({
  name,
  src,
  size = "md",
  tone = "brand",
  className,
  fallbackClassName,
  imageAlt,
  children,
  ...props
}: UserAvatarProps) {
  return (
    <Avatar className={cn(userAvatarVariants({ size }), className)} {...props}>
      {src ? <AvatarImage src={src} alt={imageAlt ?? name} /> : null}
      <AvatarFallback
        className={cn(
          "font-medium",
          FALLBACK_TEXT_SIZE[size],
          FALLBACK_TONE[tone],
          fallbackClassName
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
      {children}
    </Avatar>
  )
}

export { UserAvatar, userAvatarVariants, type UserAvatarSize, type UserAvatarTone }
