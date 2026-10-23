/**
 * Theme-independent layers drawn over content or media. These sit on photos
 * or dimmed pages, so they do not follow the light/dark palettes.
 */
export const overlay = {
  /** Behind dialogs, sheets, and drawers. */
  backdrop: "rgba(0, 0, 0, 0.5)",
  /** Behind chips and controls placed on photos. */
  mediaScrim: "rgba(0, 0, 0, 0.55)",
  /** Full-screen media lightbox. */
  mediaScrimHeavy: "rgba(0, 0, 0, 0.9)",
  /** Text and icons on any of the above. */
  onOverlay: "#ffffff",
  /** Shadow color for floating layers. */
  shadow: "#000000",
} as const

/**
 * Translucent sticky chrome (page headers, tab bars) over scrolling content.
 * Web emits `bg-chrome`.
 */
export const chrome = {
  /** Share of the page background that stays opaque. */
  backgroundAlpha: 0.8,
  blurPx: 24,
} as const

/**
 * Alpha for tinting a data-driven color (team color, audience tone) that has
 * no semantic token. Theme colors use their own tint tokens instead
 * (primary-light, status-*-bg, muted).
 */
export const dataTint = {
  subtle: 0.1,
  strong: 0.2,
} as const

export type OverlayToken = keyof typeof overlay
