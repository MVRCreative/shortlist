/**
 * Typography: families, the size scale, and the type roles.
 *
 * Roles are the only way screens set type. Web emits one `text-<role>` utility
 * per role (see ./emit-css); mobile reads `typeRoles` through `useMobileTheme()`
 * and the `Text` component. Sizes are px; letter spacing is em so both
 * platforms can scale it by the role's size.
 */
export const fontFamily = {
  sans: ["Geist", "Geist Fallback"],
  mono: ["Geist Mono", "Geist Mono Fallback"],
} as const

/** Registered font names on mobile, one file per weight (RN cannot synthesize weights). */
export const nativeFontFamily = {
  sans: {
    400: "Geist_400Regular",
    500: "Geist_500Medium",
    600: "Geist_600SemiBold",
    700: "Geist_700Bold",
  },
  /** Numerals only; no role sets mono above medium. */
  mono: {
    400: "GeistMono_400Regular",
    500: "GeistMono_500Medium",
  },
} as const

export const fontSize = {
  xs: { size: 12, lineHeight: 16 },
  sm: { size: 14, lineHeight: 20 },
  base: { size: 16, lineHeight: 24 },
  lg: { size: 18, lineHeight: 28 },
  xl: { size: 20, lineHeight: 28 },
  "2xl": { size: 24, lineHeight: 32 },
  "3xl": { size: 30, lineHeight: 36 },
  "4xl": { size: 36, lineHeight: 40 },
  "6xl": { size: 60, lineHeight: 60 },
} as const

export type FontSizeStep = keyof typeof fontSize

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export type FontWeightName = keyof typeof fontWeight

/** Letter spacing in em. */
export const tracking = {
  tight: -0.025,
  normal: 0,
  caps: 0.06,
  widest: 0.1,
} as const

export type TextColorRole = "foreground" | "foreground-secondary" | "muted-foreground" | "primary"

/** `foreground-secondary` is the foreground at this opacity, in both themes. */
export const foregroundSecondaryAlpha = 0.75

export interface TypeRole {
  /** Omitted for roles that inherit size (numeral). */
  size?: FontSizeStep
  weight: FontWeightName
  family: "sans" | "mono"
  tracking: keyof typeof tracking
  uppercase?: boolean
  tabular?: boolean
  /** Omitted for roles that inherit color (numeral). */
  color?: TextColorRole
}

/**
 * The type roles. Below the page title, hierarchy is size and color, not
 * weight. `control` and `chip` are for Button and Badge primitives only:
 * a control label is semibold so it reads as an action, not as text.
 */
export const typeRoles = {
  "page-title": { size: "2xl", weight: "medium", family: "sans", tracking: "tight", color: "foreground" },
  "section-title": { size: "lg", weight: "normal", family: "sans", tracking: "normal", color: "foreground" },
  "card-title": { size: "base", weight: "normal", family: "sans", tracking: "normal", color: "foreground-secondary" },
  body: { size: "sm", weight: "normal", family: "sans", tracking: "normal", color: "foreground" },
  "body-reading": { size: "base", weight: "normal", family: "sans", tracking: "normal", color: "foreground" },
  /** Supporting copy under a title: card, field, dialog, banner, empty state. */
  description: { size: "sm", weight: "normal", family: "sans", tracking: "normal", color: "muted-foreground" },
  /** Form labels and emphasized inline names. */
  label: { size: "sm", weight: "medium", family: "sans", tracking: "normal", color: "foreground" },
  eyebrow: { size: "xs", weight: "medium", family: "sans", tracking: "caps", uppercase: true, color: "muted-foreground" },
  meta: { size: "xs", weight: "normal", family: "sans", tracking: "normal", color: "muted-foreground" },
  numeral: { weight: "normal", family: "mono", tracking: "normal", tabular: true },
  "numeral-hero": { size: "3xl", weight: "medium", family: "mono", tracking: "tight", tabular: true, color: "foreground" },
  /** A live figure read at a distance: scoreboard score, payment confirmation. */
  "numeral-display": { size: "6xl", weight: "medium", family: "mono", tracking: "tight", tabular: true, color: "foreground" },
  "editorial-title": { size: "3xl", weight: "bold", family: "sans", tracking: "tight", color: "foreground" },
  "editorial-display": { size: "4xl", weight: "bold", family: "sans", tracking: "tight", color: "foreground" },
  kbd: { size: "xs", weight: "normal", family: "sans", tracking: "widest", color: "muted-foreground" },
  /** Button labels (primitive-owned). Color comes from the button variant. */
  control: { size: "sm", weight: "semibold", family: "sans", tracking: "normal" },
  /** Badge and count labels (primitive-owned). Color comes from the badge tone. */
  chip: { size: "xs", weight: "semibold", family: "sans", tracking: "normal" },
} as const satisfies Record<string, TypeRole>

export type TypeRoleName = keyof typeof typeRoles
