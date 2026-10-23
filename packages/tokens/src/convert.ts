import { formatHex, converter } from "culori"

const toRgb = converter("rgb")

/** Convert an oklch color string to a `#rrggbb` hex string for React Native. */
export function oklchToHex(color: string): string {
  return formatHex(color) ?? "#000000"
}

/** Convert an oklch color string to an `[r, g, b]` (0-255) tuple for React Native. */
export function oklchToRgb(color: string): [number, number, number] {
  const rgb = toRgb(color)
  if (!rgb) return [0, 0, 0]
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255)))
  return [clamp(rgb.r), clamp(rgb.g), clamp(rgb.b)]
}
