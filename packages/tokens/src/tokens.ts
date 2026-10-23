import { lightColors, darkColors, type ColorToken, type ColorMap } from "./colors"
import { motion } from "./motion"
import { overlay } from "./overlay"
import { radius, radiusRole } from "./radius"
import { shadows } from "./shadows"
import { spacing } from "./spacing"
import { sizing } from "./sizing"
import {
  fontFamily,
  fontSize,
  fontWeight,
  nativeFontFamily,
  tracking,
  typeRoles,
} from "./typography"
import { oklchToHex, oklchToRgb } from "./convert"

export interface ColorValue {
  /** Original oklch string (used by the web CSS variables). */
  oklch: string
  /** Computed hex for React Native, which cannot parse oklch. */
  hex: string
  /** Computed [r, g, b] (0-255) for React Native. */
  rgb: [number, number, number]
}

export type ColorTokenSet = Record<ColorToken, ColorValue>

function buildSet(map: ColorMap): ColorTokenSet {
  const entries = (Object.entries(map) as [ColorToken, string][]).map(
    ([token, oklch]) =>
      [token, { oklch, hex: oklchToHex(oklch), rgb: oklchToRgb(oklch) }] as const
  )
  return Object.fromEntries(entries) as ColorTokenSet
}

/**
 * The full Loople design token object. `colors` carries every theme value in all
 * three formats; web consumes `oklch` (via the emitted CSS) while mobile consumes
 * `hex`/`rgb`.
 */
export const tokens = {
  colors: {
    light: buildSet(lightColors),
    dark: buildSet(darkColors),
  },
  spacing,
  sizing,
  radius,
  radiusRole,
  shadows,
  fontFamily,
  nativeFontFamily,
  fontSize,
  fontWeight,
  tracking,
  typeRoles,
  motion,
  overlay,
} as const

export type Tokens = typeof tokens
