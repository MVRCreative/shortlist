import { spacing } from "./spacing"

/**
 * Semantic sizes for controls, icons, avatars, and layout. Numeric so React
 * Native can use them directly; web emits them as `--spacing-*` so
 * `h-control-md`, `size-icon-sm`, `size-avatar-md` exist as utilities.
 */
export const sizing = {
  /** Button, input, select, and toggle heights. `md` is the default control. */
  control: {
    xs: spacing[6],
    sm: spacing[8],
    md: spacing[10],
    lg: spacing[11],
    /** Oversized taps for live, glanceable use (scoreboard increments). */
    xl: spacing[14],
  },
  /** Minimum touch target on touch-first surfaces. */
  touch: spacing[11],
  icon: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    "2xl": 32,
  },
  avatar: {
    xs: spacing[6],
    sm: spacing[8],
    md: spacing[10],
    lg: spacing[12],
    xl: spacing[16],
    /** Profile hero on narrow screens; grows to `2xl` from `sm` up. */
    hero: spacing[20],
    "2xl": spacing[32],
  },
  /**
   * Member app shell on web: the collapsed nav rail, the rail expanded at xl,
   * the 600px reading column, and the right aside shown from lg. The shell
   * max widths are sums of these (see `shellMax`).
   */
  shell: {
    rail: 68,
    /** Member nav with labels, beside the feed. */
    railExpanded: 275,
    /** Each rail when admin shows two labeled navs side by side. */
    railNav: 224,
    main: 600,
    aside: 350,
  },
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const

/**
 * Shell max width per breakpoint: rail + main (md), + aside (lg), expanded
 * rail (xl). Admin uses this same cap. Its second nav takes the aside's
 * share, so the content column stays one measure at lg and xl.
 */
export const shellMax = {
  md: sizing.shell.rail + sizing.shell.main,
  lg: sizing.shell.rail + sizing.shell.main + sizing.shell.aside,
  xl: sizing.shell.railExpanded + sizing.shell.main + sizing.shell.aside,
} as const

export type SizingToken = typeof sizing
