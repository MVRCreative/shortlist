import { lightColors, darkColors, type ColorMap } from "./colors"
import { motion } from "./motion"
import { chrome, overlay } from "./overlay"
import { radius } from "./radius"
import { shadows } from "./shadows"
import { shellMax, sizing } from "./sizing"

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
import { fontSize, fontWeight, foregroundSecondaryAlpha, tracking, typeRoles, type TypeRole } from "./typography"

/**
 * Emits everything the web app reads from tokens: Tailwind `@theme` keys,
 * the `:root` / `.dark` custom properties, the type-role utilities, and the
 * motion utilities. `apps/web/app/globals.css` imports the result; nothing
 * in it should restate a value defined here.
 */

const rem = (px: number) => `${px / 16}rem`
const bezier = (points: readonly number[]) => `cubic-bezier(${points.join(", ")})`

function emitBlock(selector: string, colors: ColorMap, theme: "light" | "dark", isRoot: boolean): string {
  const lines: string[] = []
  for (const [token, value] of Object.entries(colors)) {
    lines.push(`  --${token}: ${value};`)
    if (isRoot && token === "chart-5") lines.push(`  --radius: ${radius.base};`)
  }
  // Re-declared per theme so a nested `.dark` scope resolves against its own foreground.
  lines.push(
    `  --foreground-secondary: color-mix(in oklch, var(--foreground) ${foregroundSecondaryAlpha * 100}%, transparent);`,
  )
  for (const [token, value] of Object.entries(shadows)) {
    lines.push(`  --elevation-${token}: ${value.css[theme]};`)
  }
  if (isRoot) {
    for (const [name, ms] of Object.entries(motion.duration)) lines.push(`  --duration-${name}: ${ms}ms;`)
    lines.push(`  --press-scale: ${motion.press.scale};`)
    lines.push(`  --duration-shimmer: ${motion.shimmerMs}ms;`)
  }
  return `${selector} {\n${lines.join("\n")}\n}`
}

function emitTheme(): string {
  const lines: string[] = []
  for (const [step, px] of Object.entries(sizing.control)) lines.push(`  --spacing-control-${step}: ${rem(px)};`)
  lines.push(`  --spacing-touch: ${rem(sizing.touch)};`)
  for (const [step, px] of Object.entries(sizing.icon)) lines.push(`  --spacing-icon-${step}: ${rem(px)};`)
  for (const [step, px] of Object.entries(sizing.avatar)) lines.push(`  --spacing-avatar-${step}: ${rem(px)};`)
  for (const [step, px] of Object.entries(sizing.shell)) lines.push(`  --spacing-shell-${kebab(step)}: ${rem(px)};`)
  for (const [step, px] of Object.entries(shellMax)) lines.push(`  --container-shell-${step}: ${rem(px)};`)
  for (const [name, points] of Object.entries(motion.easing)) lines.push(`  --ease-${name}: ${bezier(points)};`)
  lines.push(`  --tracking-caps: ${tracking.caps}em;`)
  lines.push(`  --color-overlay: ${overlay.backdrop};`)
  lines.push(`  --color-media-scrim: ${overlay.mediaScrim};`)
  lines.push(`  --color-on-overlay: ${overlay.onOverlay};`)
  return `@theme {\n${lines.join("\n")}\n}`
}

function emitThemeInline(): string {
  const lines = Object.keys(shadows).map((token) => `  --shadow-${token}: var(--elevation-${token});`)
  lines.push("  --color-foreground-secondary: var(--foreground-secondary);")
  return `@theme inline {\n${lines.join("\n")}\n}`
}

function emitRole(name: string, role: TypeRole): string {
  const lines: string[] = []
  if (role.size) {
    const step = fontSize[role.size]
    lines.push(`  font-size: ${rem(step.size)};`)
    lines.push(`  line-height: ${rem(step.lineHeight)};`)
  }
  if (role.family === "mono") lines.push("  font-family: var(--font-mono);")
  lines.push(`  font-weight: ${fontWeight[role.weight]};`)
  if (role.tracking !== "normal") lines.push(`  letter-spacing: ${tracking[role.tracking]}em;`)
  if (role.uppercase) lines.push("  text-transform: uppercase;")
  if (role.tabular) lines.push("  font-variant-numeric: tabular-nums;")
  // Foreground is the page default, so foreground roles inherit: a label
  // inside a primary link or destructive banner keeps that color. Roles whose
  // color is part of their meaning (muted, secondary) set it.
  if (role.color && role.color !== "foreground") lines.push(`  color: var(--${role.color});`)
  return `@utility text-${name} {\n${lines.join("\n")}\n}`
}

function emitMotionUtilities(): string {
  const durations = Object.keys(motion.duration).map(
    (name) =>
      `@utility duration-${name} {\n  --tw-duration: var(--duration-${name});\n  transition-duration: var(--duration-${name});\n}`
  )
  const press = [
    "/* Press feedback for tappable rows, cards, and buttons. */",
    "@utility press {",
    "  transition-property: scale, color, background-color, border-color, box-shadow;",
    "  transition-duration: var(--duration-fast);",
    "  transition-timing-function: var(--ease-standard);",
    "  &:active:not(:disabled, [aria-disabled='true']) {",
    "    scale: var(--press-scale);",
    "  }",
    "}",
  ].join("\n")
  const chromeSurface = [
    "/* Sticky headers and bars over scrolling content. */",
    "@utility bg-chrome {",
    `  background-color: color-mix(in oklch, var(--background) ${chrome.backgroundAlpha * 100}%, transparent);`,
    `  backdrop-filter: blur(${chrome.blurPx}px);`,
    "}",
  ].join("\n")
  return [...durations, press, chromeSurface].join("\n")
}

export function emitCss(): string {
  const header = "/* Generated by @loople/tokens (pnpm --filter @loople/tokens build). Do not edit. */"
  const roles = Object.entries(typeRoles)
    .map(([name, role]) => emitRole(name, role))
    .join("\n")
  return [
    header,
    emitTheme(),
    emitThemeInline(),
    emitBlock(":root", lightColors, "light", true),
    emitBlock(".dark", darkColors, "dark", false),
    "/* Type roles. One utility owns size, weight, tracking, and (non-default) color. */",
    roles,
    emitMotionUtilities(),
  ].join("\n\n") + "\n"
}
