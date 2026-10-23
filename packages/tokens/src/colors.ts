/**
 * Source of truth for Loople color tokens.
 *
 * Values are plain hex strings for light mode; dark mode uses oklch for a
 * perceptually even surface ramp. The CSS emitter writes them verbatim and
 * React Native hex/rgb values are derived at build time (see ./convert +
 * ./tokens), so hex and oklch are both valid here.
 *
 * Token semantics follow shadcn conventions and must not be repurposed:
 * - `muted` / `secondary` / `accent` are SURFACES (skeletons, chips, hovers).
 * - `border` / `input` are LINE colors. Cards are borderless via component
 *   styles, not by blanking these tokens.
 *
 * Accent families come in trios for the two-tone treatment:
 * - `accent-x`            the hue — borders and marks. Dark values are lighter
 *   so the mark reads on the card (mobile role text uses this token).
 * - `accent-x-light`      chip fill — a soft wash in light. In dark, the hue
 *   at 16% over the card (`#141414`).
 * - `accent-x-foreground` text on that fill — a darker shade in light, a
 *   lighter shade in dark. Both clear 4.5:1 on the fill.
 *
 * Dark status chips use the same recipe: fill at 16% of the hue over the
 * card, border at 24%. Labels stay the bright hue, lifted only when that
 * hue misses 4.5:1 on the fill. `primary-light` is the brand blue at 10%,
 * because its label is the saturated primary rather than a lighter step.
 *
 * Key order is significant: the CSS emitter preserves it for the
 * `:root` / `.dark` blocks.
 */

export type ColorToken =
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "destructive"
  | "destructive-foreground"
  | "border"
  | "input"
  | "ring"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "sidebar"
  | "sidebar-foreground"
  | "sidebar-primary"
  | "sidebar-primary-foreground"
  | "sidebar-accent"
  | "sidebar-accent-foreground"
  | "sidebar-border"
  | "sidebar-ring"
  | "success"
  | "success-foreground"
  | "primary-light"
  | "blue-mid"
  | "blue-light"
  | "blue-pale"
  | "blue-wash"
  | "blue-mist"
  | "red"
  | "red-wash"
  | "green"
  | "green-wash"
  | "orange"
  | "orange-wash"
  | "violet"
  | "violet-wash"
  | "slate"
  | "slate-wash"
  | "gray"
  | "gray-faint"
  | "paper"
  | "inset"
  | "accent-coral"
  | "accent-coral-light"
  | "accent-coral-foreground"
  | "accent-amber"
  | "accent-amber-light"
  | "accent-amber-foreground"
  | "accent-emerald"
  | "accent-emerald-light"
  | "accent-emerald-foreground"
  | "accent-violet"
  | "accent-violet-light"
  | "accent-violet-foreground"
  | "accent-cyan"
  | "accent-cyan-light"
  | "accent-cyan-foreground"
  | "status-success-fg"
  | "status-success-bd"
  | "status-success-bg"
  | "status-danger-fg"
  | "status-danger-bd"
  | "status-danger-bg"
  | "status-warning-fg"
  | "status-warning-bd"
  | "status-warning-bg"
  | "status-info-fg"
  | "status-info-bd"
  | "status-info-bg"
  | "status-brand-fg"
  | "status-brand-bd"
  | "status-brand-bg"
  | "status-neutral-fg"
  | "status-neutral-bd"
  | "status-neutral-bg"
  | "status-destructive-fg"
  | "status-destructive-bd"
  | "status-destructive-bg"

export type ColorMap = Record<ColorToken, string>

/** Exact swatches from the refined palette. Semantic tokens use these values. */
export const palette = {
  blue: "#325CFE",
  "blue-mid": "#4C82FE",
  "blue-light": "#97BAFF",
  "blue-pale": "#C0D5FF",
  "blue-wash": "#EBF1FF",
  "blue-mist": "#EFF6FF",
  red: "#FC3848",
  "red-wash": "#FFEBEC",
  green: "#20C16B",
  "green-wash": "#E3F7EC",
  orange: "#FA7318",
  "orange-wash": "#FFF3EB",
  violet: "#7C52F4",
  "violet-wash": "#EEEBFE",
  slate: "#525866",
  "slate-wash": "#EBECF0",
  gray: "#7B7B7B",
  "gray-faint": "#F7F7F7",
  paper: "#FBFAF6",
  inset: "#F6F7FB",
  ink: "#1C1C1C",
  line: "#D1D1D1",
  soft: "#F5F5F5",
  white: "#FFFFFF",
} as const

export const lightColors: ColorMap = {
  /* Warm field so white objects sit on it. Ink and hairlines stay neutral.
     Insets are the lightest grey step so groups sit quietly. */
  background: "#FCFAF7",
  foreground: palette.ink,
  card: palette.white,
  "card-foreground": palette.ink,
  popover: palette.white,
  "popover-foreground": palette.ink,
  /* Brand blue from the sheet. #4C82FE is the next step. #97BAFF is blue-light. */
  primary: palette.blue,
  "primary-foreground": palette.white,
  secondary: palette.soft,
  "secondary-foreground": palette.ink,
  muted: palette.soft,
  "muted-foreground": palette.slate,
  accent: palette["slate-wash"],
  "accent-foreground": palette.ink,
  destructive: palette.red,
  "destructive-foreground": palette.white,
  border: palette["slate-wash"],
  input: palette.line,
  ring: palette.blue,
  "chart-1": palette.blue,
  "chart-2": palette.green,
  "chart-3": palette["blue-mid"],
  "chart-4": palette.red,
  "chart-5": palette["blue-light"],
  sidebar: "#FFFFFF",
  "sidebar-foreground": palette.ink,
  "sidebar-primary": palette.blue,
  "sidebar-primary-foreground": palette.white,
  "sidebar-accent": palette["slate-wash"],
  "sidebar-accent-foreground": palette.ink,
  "sidebar-border": palette["slate-wash"],
  "sidebar-ring": palette.blue,
  success: palette.green,
  "success-foreground": palette.ink,
  "primary-light": palette["blue-wash"],
  "blue-mid": palette["blue-mid"],
  "blue-light": palette["blue-light"],
  "blue-pale": palette["blue-pale"],
  "blue-wash": palette["blue-wash"],
  "blue-mist": palette["blue-mist"],
  red: palette.red,
  "red-wash": palette["red-wash"],
  green: palette.green,
  "green-wash": palette["green-wash"],
  orange: palette.orange,
  "orange-wash": palette["orange-wash"],
  violet: palette.violet,
  "violet-wash": palette["violet-wash"],
  slate: palette.slate,
  "slate-wash": palette["slate-wash"],
  gray: palette.gray,
  "gray-faint": palette["gray-faint"],
  paper: palette.paper,
  inset: palette.inset,
  /* Five different families. Violet stays the palette purple; its text
     is a darker shade so initials clear the wash. */
  "accent-coral": "#C2412D",
  "accent-coral-light": "#FEE4E4",
  "accent-coral-foreground": "#843327",
  "accent-amber": "#B45309",
  "accent-amber-light": "#FDF2DD",
  "accent-amber-foreground": "#81410F",
  "accent-emerald": "#047857",
  "accent-emerald-light": "#E3F9F1",
  "accent-emerald-foreground": "#0B5E46",
  "accent-violet": palette.violet,
  "accent-violet-light": palette["violet-wash"],
  "accent-violet-foreground": "#563D9F",
  "accent-cyan": "#0E7490",
  "accent-cyan-light": "#E5F6FF",
  "accent-cyan-foreground": "#12596D",
  "status-success-fg": palette.green,
  "status-success-bd": palette.green,
  "status-success-bg": palette["green-wash"],
  "status-danger-fg": palette.orange,
  "status-danger-bd": palette.orange,
  "status-danger-bg": palette["orange-wash"],
  "status-warning-fg": "#854D0E",
  "status-warning-bd": "#EAB308",
  "status-warning-bg": "#FEF9C3",
  "status-info-fg": palette.blue,
  "status-info-bd": palette["blue-light"],
  "status-info-bg": palette["blue-wash"],
  "status-brand-fg": palette.blue,
  "status-brand-bd": palette["blue-mid"],
  "status-brand-bg": palette["blue-wash"],
  "status-neutral-fg": palette.slate,
  "status-neutral-bd": palette.line,
  "status-neutral-bg": palette.soft,
  "status-destructive-fg": palette.red,
  "status-destructive-bd": palette.red,
  "status-destructive-bg": palette["red-wash"],
}

export const darkColors: ColorMap = {
  /* Neutral black at the same elevation steps as the old cool ramp,
     matched to the neutral ink. The line separates objects; the fill
     barely lifts. */
  background: "#0D0D0D",
  foreground: palette["gray-faint"],
  card: "#141414",
  "card-foreground": palette["gray-faint"],
  popover: "#1E1E1E",
  "popover-foreground": palette["gray-faint"],
  /* Sheet blue that holds on the dark page. Page ink on the fill matches. */
  primary: palette["blue-mid"],
  "primary-foreground": "#0D0D0D",
  secondary: "#191919",
  "secondary-foreground": palette["gray-faint"],
  muted: "#191919",
  "muted-foreground": palette.gray,
  accent: "#232323",
  "accent-foreground": palette["gray-faint"],
  destructive: palette.red,
  "destructive-foreground": "#0D0D0D",
  border: "#373737",
  input: "#373737",
  /* Focus is the sheet's light slate, not a blue wash. */
  ring: palette["slate-wash"],
  "chart-1": palette["blue-mid"],
  "chart-2": palette.green,
  "chart-3": palette["blue-light"],
  "chart-4": palette.red,
  "chart-5": palette["blue-light"],
  sidebar: "#0D0D0D",
  "sidebar-foreground": palette["gray-faint"],
  "sidebar-primary": palette["blue-mid"],
  "sidebar-primary-foreground": "#0D0D0D",
  "sidebar-accent": "#232323",
  "sidebar-accent-foreground": palette["gray-faint"],
  "sidebar-border": "#373737",
  "sidebar-ring": palette["slate-wash"],
  success: palette.green,
  "success-foreground": "#0D0D0D",
  /* Brand blue at 10% over the card. 16% drops primary text under 4.5:1. */
  "primary-light": "#1A1F2B",
  "blue-mid": palette["blue-mid"],
  "blue-light": palette["blue-light"],
  "blue-pale": palette["blue-pale"],
  "blue-wash": palette["blue-wash"],
  "blue-mist": palette["blue-mist"],
  red: palette.red,
  "red-wash": palette["red-wash"],
  green: palette.green,
  "green-wash": palette["green-wash"],
  orange: palette.orange,
  "orange-wash": palette["orange-wash"],
  violet: palette.violet,
  "violet-wash": palette["violet-wash"],
  slate: palette.slate,
  "slate-wash": palette["slate-wash"],
  gray: palette.gray,
  "gray-faint": palette["gray-faint"],
  paper: palette.paper,
  inset: palette.inset,
  "accent-coral": "#F86A6A",
  "accent-coral-light": "#382222",
  "accent-coral-foreground": "#FA9898",
  "accent-amber": "#F5B942",
  "accent-amber-light": "#382E1B",
  "accent-amber-foreground": "#F5B942",
  "accent-emerald": "#34D399",
  "accent-emerald-light": "#193329",
  "accent-emerald-foreground": "#34D399",
  "accent-violet": "#A78BFA",
  "accent-violet-light": "#2C2739",
  "accent-violet-foreground": "#BDA9FB",
  "accent-cyan": "#47C2FF",
  "accent-cyan-light": "#1C303A",
  "accent-cyan-foreground": "#47C2FF",
  /* Fill is the hue at 16% over the card; border is 24%. Destructive text
     is lifted so it clears 4.5:1 on that fill. */
  "status-success-fg": palette.green,
  "status-success-bd": "#173E29",
  "status-success-bg": "#163022",
  "status-danger-fg": palette.orange,
  "status-danger-bd": "#4B2B15",
  "status-danger-bg": "#392315",
  "status-warning-fg": "#FDE272",
  "status-warning-bd": "#4B4014",
  "status-warning-bg": "#393114",
  "status-info-fg": palette["blue-light"],
  "status-info-bd": "#212E4C",
  "status-info-bg": "#1D2639",
  "status-brand-fg": palette["blue-light"],
  "status-brand-bd": "#212E4C",
  "status-brand-bg": "#1D2639",
  "status-neutral-fg": palette["slate-wash"],
  "status-neutral-bd": "#373737",
  "status-neutral-bg": "#1E1E1E",
  "status-destructive-fg": "#FD6773",
  "status-destructive-bd": "#4C1D20",
  "status-destructive-bg": "#391A1C",
}
