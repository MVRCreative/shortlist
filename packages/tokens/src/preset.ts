import { tokens } from "./tokens"
import type { ColorToken } from "./colors"

/**
 * NativeWind (Tailwind) preset for the future Expo app. Exposes the Loople
 * palette as hex (RN-safe), plus radius and font families. Defaults to the light
 * theme; dark values are available via `tokens.colors.dark` for a runtime theme
 * switch once mobile is wired up. This file is shipped now but not yet consumed.
 */

function hexPalette(theme: "light" | "dark"): Record<ColorToken, string> {
  const set = tokens.colors[theme]
  const entries = (Object.keys(set) as ColorToken[]).map(
    (token) => [token, set[token].hex] as const
  )
  return Object.fromEntries(entries) as Record<ColorToken, string>
}

export const preset = {
  theme: {
    extend: {
      colors: hexPalette("light"),
      spacing: tokens.spacing,
      size: {
        icon: tokens.sizing.icon,
        avatar: tokens.sizing.avatar,
        control: tokens.sizing.control,
      },
      borderRadius: {
        xs: tokens.radius.px.xs,
        sm: tokens.radius.px.sm,
        md: tokens.radius.px.md,
        lg: tokens.radius.px.lg,
        xl: tokens.radius.px.xl,
        DEFAULT: tokens.radius.px.DEFAULT,
      },
      fontFamily: {
        sans: [...tokens.fontFamily.sans],
        mono: [...tokens.fontFamily.mono],
      },
    },
  },
} as const

export const darkPalette = hexPalette("dark")
