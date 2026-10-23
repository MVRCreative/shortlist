/**
 * Radius scale. `base` is the canonical `--radius` value the web app emits.
 * The `px` map mirrors the Tailwind `@theme` derivations
 * (xs = base - 8px, sm = base - 4px, md = base - 2px, lg = base,
 * xl = base + 4px) as plain numbers for React Native, assuming the
 * default 16px root font size (0.75rem = 12px).
 */
export const radius = {
  base: "0.75rem",
  px: {
    xs: 4,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    full: 9999,
    DEFAULT: 12,
  },
} as const

export type RadiusStep = Exclude<keyof typeof radius.px, "DEFAULT">

/**
 * Which step each kind of element uses. Nested elements step down: a control
 * inside a surface is `lg` inside `xl`.
 */
export const radiusRole = {
  /** 16px marks: checkbox, tooltip arrow. */
  mark: "xs",
  /** Small insets, menu items inside a floating layer. */
  inset: "sm",
  /** Badges and chips. */
  chip: "md",
  /** Buttons, inputs, selects, toggles at sm size and up. */
  control: "lg",
  /** Popover, dropdown, tooltip, hover card, select content. */
  floating: "lg",
  /** Cards, panels, feed objects, tables. */
  surface: "xl",
  /** Dialogs and sheets. */
  modal: "xl",
  /** People and community avatars (rounded square). */
  avatar: "md",
  /** Pill-shaped filters and counts. */
  pill: "full",
} as const satisfies Record<string, RadiusStep>
