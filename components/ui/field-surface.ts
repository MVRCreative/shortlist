/**
 * fieldSurface
 *
 * The one look for every text-entry and picker field: Input, Textarea,
 * SelectTrigger, the InputGroup shell, and date/time inputs. Transparent on
 * whatever surface holds it, hairline `input` border, `control` radius, the
 * 1px focus ring, and the destructive border when `aria-invalid`.
 *
 * Heights come from `sizing.control` via `fieldSize`.
 *
 * Focus is a 1px ring at 30% of the brand. The border stays the cold line.
 * Buttons and other controls keep the 3px ring; fields do not.
 *
 * `fieldBare` is the same type and color with the frame removed, for text
 * that sits on a card (composer, reply). It must not include `dark:bg-input/30`:
 * that fill is the field well, and on a card it reads as a second surface.
 */
import { cva } from "class-variance-authority"

/** 1px brand ring at 30%. The border does not change color. */
export const fieldFocusVisible = "focus-visible:ring-1 focus-visible:ring-ring/30"

export const fieldSurface = [
  "w-full min-w-0 rounded-lg border border-input bg-transparent text-body-reading text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast placeholder:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-body dark:aria-invalid:ring-destructive/40",
  fieldFocusVisible,
].join(" ")

export const fieldBare =
  "w-full min-w-0 resize-none field-sizing-content border-0 bg-transparent p-0 text-body-reading text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"

export const fieldSize = cva("", {
  variants: {
    size: {
      sm: "h-control-sm px-2.5",
      default: "h-control-md px-3",
      lg: "h-control-lg px-3.5",
    },
  },
  defaultVariants: { size: "default" },
})
