/**
 * floatingSurface / menuItem
 *
 * The one look for every floating layer: DropdownMenu, ContextMenu, Menubar,
 * Select, Popover, HoverCard, Command popovers. `popover` surface, hairline
 * border, `floating` radius (lg) and elevation, and an enter/exit that
 * scales from the trigger's side over `duration-base` with the emphasized ease.
 *
 * Menu items sit inside `p-2`, so their radius is one step down (sm) to stay
 * concentric with the panel.
 */
export const floatingSurface =
  "z-50 rounded-lg border bg-popover text-popover-foreground shadow-floating outline-hidden duration-base ease-emphasized data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"

export const menuItem =
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-2 text-body outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md [&_svg:not([class*='text-'])]:text-muted-foreground"

/** Destructive menu item: danger text, danger tint on focus. */
export const menuItemDestructive =
  "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-status-destructive-bg data-[variant=destructive]:focus:text-status-destructive-fg data-[variant=destructive]:data-[highlighted]:bg-status-destructive-bg data-[variant=destructive]:data-[highlighted]:text-status-destructive-fg data-[variant=destructive]:*:[svg]:!text-destructive"

export const menuLabel = "px-2 py-2 text-label data-[inset]:pl-8"

export const menuSeparator = "-mx-1 my-1 h-px bg-border"
