/**
 * modalOverlay / modalSurface / sheetSurface
 *
 * The one look for blocking layers: Dialog, AlertDialog, Sheet, Drawer.
 *
 * - Backdrop: `bg-overlay` (token), fades over `duration-base`.
 * - Centered modal: `modal` radius (xl), `modal` elevation, 16px gutter on
 *   phones (`inset-x-4 mx-auto`) whatever `max-w-*` a caller passes; scales
 *   in from 95% with the emphasized ease.
 * - Sheet: slides from its edge over `duration-slow` with the emphasized ease
 *   and leaves faster (`duration-base`). Edge sheets are square against the
 *   viewport; top/bottom sheets round the exposed edge.
 */
export const modalOverlay =
  "fixed inset-0 z-50 bg-overlay duration-base data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"

export const modalSurface =
  "fixed inset-x-4 top-1/2 z-50 mx-auto grid max-h-[calc(100dvh-2rem)] max-w-lg -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-background p-6 shadow-modal outline-none duration-base ease-emphasized data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"

export const sheetSurface =
  "fixed z-50 flex flex-col gap-4 bg-background shadow-modal outline-none ease-emphasized data-[state=open]:animate-in data-[state=open]:duration-slow data-[state=closed]:animate-out data-[state=closed]:duration-base"

export const sheetSide = {
  right:
    "inset-y-0 right-0 h-full w-full border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right sm:w-3/4 sm:max-w-sm",
  left: "inset-y-0 left-0 h-full w-full border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:w-3/4 sm:max-w-sm",
  top: "inset-x-0 top-0 h-auto rounded-b-xl border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
  bottom:
    "inset-x-0 bottom-0 h-auto rounded-t-xl border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
} as const
