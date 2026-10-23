/**
 * Motion. Five sanctioned moves (press, shimmer, enter/exit, state change,
 * reorder/expand) built on these values. Web emits `duration-*` / `ease-*`
 * utilities; mobile reads the numbers for Reanimated.
 */
export const motion = {
  duration: {
    /** Hover and press state changes, small toggles. */
    fast: 150,
    /** Enter/exit for popovers and menus; default state change. */
    base: 200,
    /** Sheets, dialogs, page-level enter. Ceiling for anything frequent. */
    slow: 300,
  },
  /** Cubic-bezier control points. */
  easing: {
    emphasized: [0.16, 1, 0.3, 1],
    standard: [0.2, 0, 0, 1],
    /** Symmetric, for loops that breathe in and out (pulse). */
    inOut: [0.42, 0, 0.58, 1],
  },
  press: {
    /** Tappable rows, cards, and buttons. */
    scale: 0.99,
    /** Text and icon-only pressables on mobile. */
    opacity: 0.7,
  },
  /** Delay between siblings in a staggered entrance (multiply by index). */
  staggerMs: 40,
  /** Skeleton shimmer sweep. */
  shimmerMs: 1600,
  /** Looping "working" indicator (assistant thinking dots): one full cycle, and the offset between dots. */
  pulse: { cycleMs: 1100, staggerMs: 160 },
} as const

export type MotionDuration = keyof typeof motion.duration
