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

/** Border switches to the brand action color plus a soft 3px halo. */
export const fieldFocusVisible =
  "focus-visible:border-primary-base focus-visible:ring-3 focus-visible:ring-primary-alpha-16"

export const fieldSurface = [
  "w-full min-w-0 rounded-10 border border-stroke-soft-200 bg-bg-white-0 text-paragraph-md text-text-strong-950 outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-out placeholder:text-text-soft-400 aria-invalid:border-error-base aria-invalid:ring-3 aria-invalid:ring-error-base/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-paragraph-sm",
  fieldFocusVisible,
].join(" ")

export const fieldBare =
  "w-full min-w-0 resize-none field-sizing-content border-0 bg-transparent p-0 text-paragraph-md text-text-strong-950 shadow-none outline-none placeholder:text-text-soft-400 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"

export const fieldSize = cva("", {
  variants: {
    size: {
      sm: "h-8 px-2.5",
      default: "h-10 px-3",
      lg: "h-11 px-3.5",
    },
  },
  defaultVariants: { size: "default" },
})
