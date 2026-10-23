/**
 * Elevation tokens. `css` strings feed the emitted CSS variables
 * (`--elevation-*`, used as `shadow-card` / `shadow-floating` / `shadow-modal`);
 * `native` mirrors the same depth for React Native shadow props.
 *
 * `card` is the resting elevation for object surfaces. It resolves to none
 * in both themes — a stack of soft shadows reads as noise in the feed, and
 * the border (or the fill, on light-mode feed cards) carries the edge.
 * Only floating layers (popover, menu, toast) and modals (dialog, sheet)
 * cast a shadow.
 */
export const shadows = {
  card: {
    css: {
      light: "0 0 #0000",
      dark: "0 0 #0000",
    },
    native: {
      shadowColor: "#000000",
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
  },
  floating: {
    css: {
      light: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      dark: "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    },
    native: {
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  },
  modal: {
    css: {
      light: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      dark: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)",
    },
    native: {
      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  },
} as const

export type ShadowToken = keyof typeof shadows
